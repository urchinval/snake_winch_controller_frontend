import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, fetchWinchState, controlWinch } from '../api';
import type { CommandRequest, WinchState } from '../common/api/types';
import type { ConnectionStatus, ActiveDirection, Direction } from '../common/shared/types';
import { HEARTBEAT_INTERVAL_MS, STATE_POLL_INTERVAL_MS } from '../common/shared/constants';

export function useWinchControl() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WinchState>('STOPPED');
  const [activeDirection, setActiveDirection] = useState<ActiveDirection>(null);

  const heartbeatRef = useRef<number | null>(null);
  // Черга команд щоб запити йшли в заначеному порядку і не перезаписувалися
  const commandQueueRef = useRef<Promise<void>>(Promise.resolve());
  const commandInFlightRef = useRef(false);
  const isHeldRef = useRef(false);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  const applyState = useCallback(
    (newState: WinchState) => {
      setState(newState);
      setConnectionStatus('online');
      setError(null);

      if (newState === 'STOPPED' && heartbeatRef.current !== null) {
        stopHeartbeat();
        setActiveDirection(null);
        isHeldRef.current = false;
      }
    },
    [stopHeartbeat]
  );

  const applyFailure = useCallback((err: unknown) => {
    setConnectionStatus('offline');
    setError(err instanceof ApiError ? err.message : 'Unknown error');
  }, []);

  const refreshState = useCallback(async () => {
    try {
      const response = await fetchWinchState();
      applyState(response.state);
    } catch (err) {
      applyFailure(err);
    }
  }, [applyState, applyFailure]);

  useEffect(() => {
    const tick = () => {
      if (isHeldRef.current) return;
      void refreshState();
    };

    const initialTimerId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, STATE_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimerId);
      window.clearInterval(intervalId);
    };
  }, [refreshState]);

  useEffect(() => stopHeartbeat, [stopHeartbeat]);

  // Ставить команду в чергу замість того, щоб пускати fetch одразу тобто
  // наступна команда ніколи не полетить, поки не прийде відповідь на
  // попередню, і ESP32 отримує їх у тому ж порядку, що й UI.
  const sendCommand = useCallback(
    (command: CommandRequest['command']) => {
      const run = async () => {
        commandInFlightRef.current = true;
        try {
          const response = await controlWinch(command);
          applyState(response.state);
        } catch (err) {
          applyFailure(err);
        } finally {
          commandInFlightRef.current = false;
        }
      };

      commandQueueRef.current = commandQueueRef.current.then(run);
      return commandQueueRef.current;
    },
    [applyState, applyFailure]
  );

  const handleStartHold = useCallback(
    (direction: Direction) => {
      setActiveDirection(direction);
      isHeldRef.current = true;

      stopHeartbeat(); // про всяк випадок, якщо попередній ще не встиг прибратись

      void sendCommand(direction);

      heartbeatRef.current = window.setInterval(() => {
        if (commandInFlightRef.current) return;
        void sendCommand(direction);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [sendCommand, stopHeartbeat]
  );

  const handleEndHold = useCallback(() => {
    setActiveDirection(null);
    isHeldRef.current = false;
    stopHeartbeat();
    void sendCommand('stop');
  }, [sendCommand, stopHeartbeat]);

  const handleStopClick = useCallback(() => {
    setActiveDirection(null);
    isHeldRef.current = false;
    stopHeartbeat();
    void sendCommand('stop');
  }, [sendCommand, stopHeartbeat]);

  return {
    connectionStatus,
    error,
    state,
    activeDirection,
    handleStartHold,
    handleEndHold,
    handleStopClick,
  };
}
