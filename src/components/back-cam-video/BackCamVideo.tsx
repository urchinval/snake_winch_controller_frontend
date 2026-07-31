import { MEDIAMTX_WEBRTC_PORT, CAMERA_PATH } from './common/types';
import s from './BackCamVideo.module.css';

export default function BackCamVideo() {
  const src = `http://${window.location.hostname}:${MEDIAMTX_WEBRTC_PORT}/${CAMERA_PATH}`;

  return (
    <div className={s.wrapper}>
      <iframe src={src} className={s.video} allow="autoplay" title="Камера на лебідці" />
    </div>
  );
}
