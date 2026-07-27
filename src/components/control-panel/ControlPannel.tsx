import HoldButton from '../hold-button/HoldButton';
import s from './ControlPannel.module.css';

export default function ControlPannel() {
  //mock data
  const connectionStatus = 'online';
  const error = null;
  let state;
  const activeDirection = 'forward';
  const handleStartHold = (command: string) => {
    return command;
  };
  const handleEndHold = () => {
    return;
  };
  const handleStopClick = () => {
    return;
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

      {error && <div className={s.error}></div>}

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
          className={`${s.btnStop} ${state !== 'STOPPED' ? s.active : ''}`}
          onClick={handleStopClick}>
          СТОП
        </button>
      </div>
    </div>
  );
}
