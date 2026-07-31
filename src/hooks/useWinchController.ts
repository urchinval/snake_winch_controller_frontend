import { useCallback, useEffect, useRef, useState } from 'react';
import { controlWinch, fetchWinchState } from '../api/winch';
import { ApiError } from '../api';
import type { CommandRequest, WinchState } from '../common/api/types';
import type { ConnectionStatus, ActiveDirection } from '../common/shared/types';
import { HEARTBEAT_INTERVAL_MS, STATE_POLL_INTERVAL_MS } from '../common/shared/constants';

export function useWinchControl() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WinchState>('STOPPED');
  const [activeDirection, setActiveDirection] = useState<ActiveDirection>(null);

  const heartbeatRef = useRef<number | null>(null);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  // Єдине місце, де стан із сервера (від опитування чи від відповіді на
  // команду) застосовується до UI. Фікс Бага 2: якщо плата вже реально
  // STOPPED, а фронт все ще думає, що кнопка тримається (heartbeat живий) -
  // знімаємо підсвітку й heartbeat тут же, а не чекаємо явного відпускання.
  const applyState = useCallback(
    (newState: WinchState) => {
      setState(newState);
      setConnectionStatus('online');
      setError(null);

      if (newState === 'STOPPED' && heartbeatRef.current !== null) {
        stopHeartbeat();
        setActiveDirection(null);
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
      void refreshState();
    };

    const initialTimerId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, STATE_POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialTimerId);
      window.clearInterval(intervalId);
    };
  }, [refreshState]);

  // Прибираємо heartbeat, якщо компонент, що використовує хук, розмонтується
  // під час утримання кнопки - інакше команди й далі летіли б у фоні.
  useEffect(() => stopHeartbeat, [stopHeartbeat]);

  const sendCommand = useCallback(
    async (command: CommandRequest['command']) => {
      try {
        const response = await controlWinch(command);
        applyState(response.state);
      } catch (err) {
        applyFailure(err);
      }
    },
    [applyState, applyFailure]
  );

  const handleStartHold = useCallback(
    (command: CommandRequest['command']) => {
      setActiveDirection(command === 'forward' ? 'forward' : 'reverse');

      stopHeartbeat(); // про всяк випадок, якщо попередній ще не встиг прибратись

      void sendCommand(command); // одразу, не чекаючи першого тіку

      heartbeatRef.current = window.setInterval(() => {
        void sendCommand(command);
      }, HEARTBEAT_INTERVAL_MS);
    },
    [sendCommand, stopHeartbeat]
  );

  const handleEndHold = useCallback(() => {
    setActiveDirection(null);
    stopHeartbeat();
    void sendCommand('stop');
  }, [sendCommand, stopHeartbeat]);

  const handleStopClick = useCallback(() => {
    setActiveDirection(null);
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
