import { useWinchControl } from '../../hooks/useWinchController';
import HoldButton from '../hold-button/HoldButton';
import s from './ControlPannel.module.css';

export default function ControlPannel() {
  const {
    connectionStatus,
    error,
    state,
    activeDirection,
    handleStartHold,
    handleEndHold,
    handleStopClick,
  } = useWinchControl();

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
