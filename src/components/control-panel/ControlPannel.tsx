import { useCallback, useEffect, useState, useRef } from 'react';
import { controlWinch, fetchWinchState } from '../../api/winch';
import { ApiError } from '../../api';
import type { CommandRequest, WinchState } from '../../common/api/types';
import HoldButton from '../hold-button/HoldButton';
import s from './ControlPannel.module.css';

type ConnectionStatus = 'checking' | 'online' | 'offline';
type ActiveDirection = 'forward' | 'reverse' | null;

export default function ControlPannel() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<WinchState | null>(null);
  const [activeDirection, setActiveDirection] = useState<ActiveDirection>(null);
  const heartbeatRef = useRef<number | null>(null);

  const refreshState = useCallback(async () => {
    try {
      const response = await fetchWinchState();
      setState(response.state);
      setConnectionStatus('online');
      setError(null);
    } catch (err) {
      setConnectionStatus('offline');
      setError(err instanceof ApiError ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    const tick = () => {
      void refreshState();
    };

    const initialTimerId = window.setTimeout(tick, 0);
    const intervalId = window.setInterval(tick, 1000);

    return () => {
      window.clearTimeout(initialTimerId);
      window.clearInterval(intervalId);
    };
  }, [refreshState]);

  const sendCommand = async (command: CommandRequest['command']) => {
    try {
      const response = await controlWinch(command);
      setState(response.state);
      setConnectionStatus('online');
      setError(null);
    } catch (err) {
      setConnectionStatus('offline');
      setError(err instanceof ApiError ? err.message : 'Unknown error');
    }
  };

  const HEARTBEAT_MS = 800;

  const handleStartHold = (command: CommandRequest['command']) => {
    setActiveDirection(command === 'forward' ? 'forward' : 'reverse');

    // Clear any previous heartbeat (safety)
    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // Send first command immediately
    void sendCommand(command);

    // Then send heartbeat periodically while held
    const id = window.setInterval(() => {
      void sendCommand(command);
    }, HEARTBEAT_MS);
    heartbeatRef.current = id;
  };

  const handleEndHold = () => {
    setActiveDirection(null);

    if (heartbeatRef.current !== null) {
      window.clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }

    // Ensure the final stop is sent
    void sendCommand('stop');
  };

  const handleStopClick = () => {
    setActiveDirection(null);
    void sendCommand('stop');
  };

  const isConnectedClass =
    connectionStatus === 'online' ? s.online : connectionStatus === 'offline' ? s.offline : ' ';

  return (
    <div className={s.container}>
      <div className={s.topbar}>
        <div className={s.connection}>
          <span className={`${s.dot} ${isConnectedClass}`} />

          {connectionStatus === 'online'
            ? 'ESP32 в мережі'
            : connectionStatus === 'offline'
              ? "Немає зв'язку"
              : 'Перевірка статусу'}
        </div>
      </div>

      {error && <div className={s.error}>{error}</div>}

      <div className={s.controls}>
        <div className={s.directionRow}>
          <HoldButton
            label="⇩ ВНИЗ"
            direction="reverse"
            activeDirection={activeDirection}
            onStart={() => handleStartHold('reverse')}
            onEnd={handleEndHold}
          />
          <HoldButton
            label="ВГОРУ ⇧"
            direction="forward"
            activeDirection={activeDirection}
            onStart={() => handleStartHold('forward')}
            onEnd={handleEndHold}
          />
        </div>
        <p className={s.hintText}>Утримуйте для руху, відпустіть для зупинки</p>

        <button
          type="button"
          className={`${s.btnStop} ${state !== 'STOPPED' ? s.active : ''}`}
          onClick={handleStopClick}>
          СТОП
        </button>
      </div>
    </div>
  );
}
