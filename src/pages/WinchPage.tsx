import ControlPannel from '../components/control-panel/ControlPannel';
import s from './WinchPage.module.css';

export default function WinchPage() {
  return (
    <div className={s.screen}>
      <ControlPannel />
    </div>
  );
}
