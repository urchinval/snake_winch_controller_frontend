import { CAMERA_PATH } from '../../common/api/constants';
import s from './BackCamVideo.module.css';

export default function BackCamVideo() {
  const src = `${window.location.origin}${CAMERA_PATH}`;

  return (
    <div className={s.wrapper}>
      <iframe src={src} className={s.video} allow="autoplay" title="Камера на лебідці" />
    </div>
  );
}
