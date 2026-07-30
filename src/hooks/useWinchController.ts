import { useCallback, useEffect, useRef, useState } from 'react';
import { controlWinch, fetchWinchState, fetchHealth } from '../api';
import type { WinchState } from '../common/api/types';
import type { Direction, ConnectionStatus } from '../common/hooks/types';
import {
  HEARTBEAT_INTERVAL_MS,
  STATE_POLL_INTERVAL_MS,
  HEALTH_POLL_INTERVAL_MS,
} from '../common/shared/constants';
import { toAutostopReason } from '../helpers/autostop';
import { apiErrorMessage, autostopReasonMessage } from '../helpers/messages';
import { startPolling } from '../helpers/poll';
import { useToasts } from './useToasts';

const CONNECTION_FAILURE_GRACE = 2;

export function useWinchController() {
  const [state, setState] = useState<WinchState>('STOPPED');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [blocked, setBlocked] = useState<Record<Direction, boolean>>({
    forward: false,
    reverse: false,
  });

  const { toasts, pushToast, dismissToast } = useToasts();

  const heldDirectionRef = useRef<Direction | null>(null);
  const stopHeartbeatRef = useRef<() => void | null>(null);
  const failuresStreakRef = useRef(0);
  const offlineNotifiedRef = useRef(false);

  const reportOnline = useCallback(() => {
    failuresStreakRef.current = 0;
    offlineNotifiedRef.current = false;
    setConnectionStatus('online');
  }, []);

  const reportFailure = useCallback(
    (error: unknown) => {
      failuresStreakRef.current += 1;
      if (failuresStreakRef.current < CONNECTION_FAILURE_GRACE) return;

      setConnectionStatus('offline');
      if (!offlineNotifiedRef.current) {
        offlineNotifiedRef.current = true;
        pushToast(apiErrorMessage(error), 'error');
      }
    },
    [pushToast]
  );

  const blockDirection = useCallback((direction: Direction) => {
    setBlocked((prev) => (prev[direction] ? prev : { ...prev, [direction]: true }));
  }, []);

  const unblockDirection = useCallback((direction: Direction) => {
    setBlocked((prev) => (prev[direction] ? { ...prev, [direction]: false } : prev));
  }, []);

  const stopHeartbeat = useCallback(() => {
    stopHeartbeatRef.current?.();
    stopHeartbeatRef.current = null;
  }, []);

  const send = useCallback(
    async (command: Direction | 'stop') => {
      try {
        await controlWinch(command);
        reportOnline();
      } catch (error) {
        reportFailure(error);
        if (command !== 'stop' && heldDirectionRef.current === command) {
          heldDirectionRef.current = null;
          stopHeartbeat();
          blockDirection(command);
        }
      }
    },
    [reportFailure, reportOnline, blockDirection, stopHeartbeat]
  );

  const startHold = useCallback(
    (direction: Direction) => {
      if (blocked[direction]) return;
      if (heldDirectionRef.current === direction) return;

      stopHeartbeat();
      heldDirectionRef.current = direction;
      stopHeartbeatRef.current = startPolling(() => send(direction), {
        intervalMs: HEARTBEAT_INTERVAL_MS,
      });
    },
    [blocked, send, stopHeartbeat]
  );

  const endHold = useCallback(
    (direction: Direction) => {
      unblockDirection(direction);
      if (heldDirectionRef.current !== direction) return;

      heldDirectionRef.current = null;
      stopHeartbeat();
      void send('stop');
    },
    [send, stopHeartbeat, unblockDirection]
  );

  const stop = useCallback(() => {
    const held = heldDirectionRef.current;
    heldDirectionRef.current = null;
    stopHeartbeat();
    if (held) unblockDirection(held);
    void send('stop');
  }, [send, stopHeartbeat, unblockDirection]);

  // Опитування стану
  useEffect(() => {
    return startPolling(
      async () => {
        try {
          const response = await fetchWinchState();
          reportOnline();
          setState(response.state);

          const held = heldDirectionRef.current;
          if (held && response.state === 'STOPPED') {
            // зупинка зі сторони прошивки ESP, щоб фронт не тримав кнопку, знімаємо це
            // і показуємо причину, якщо вона видана прошивкою ESP
            heldDirectionRef.current = null;
            stopHeartbeat();
            blockDirection(held);

            const reason = toAutostopReason(response.stopReason);
            if (reason) pushToast(autostopReasonMessage(reason), 'warning');
          }
        } catch (error) {
          reportFailure(error);
        }
      },
      { intervalMs: STATE_POLL_INTERVAL_MS }
    );
  }, [reportFailure, reportOnline, blockDirection, pushToast, stopHeartbeat]);

  // Окремо опитування health (легший ендпоінт, підстраховка)

  useEffect(() => {
    return startPolling(
      async () => {
        try {
          await fetchHealth();
          reportOnline();
        } catch (error) {
          reportFailure(error);
        }
      },
      { intervalMs: HEALTH_POLL_INTERVAL_MS }
    );
  }, [reportFailure, reportOnline]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && heldDirectionRef.current) stop();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stop]);

  const activeDirection: Direction | null =
    state === 'FORWARD' ? 'forward' : state === 'REVERSE' ? 'reverse' : null;

  const isBlocked = useCallback((direction: Direction) => blocked[direction], [blocked]);

  return {
    state,
    connectionStatus,
    activeDirection,
    isBlocked,
    startHold,
    endHold,
    stop,
    toasts,
    dismissToast,
  };
}
