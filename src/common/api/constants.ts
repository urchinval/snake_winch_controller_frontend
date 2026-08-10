export const BASE_URL = '/api/v1';

export const Path = {
  WINCH_STATE: '/winch/state',
  WINCH_CONTROL: '/winch/control',
} as const;

// Same-origin path, proxied by nginx (see mediamtx_for_cam.txt) - nginx injects
// the MediaMTX auth header server-side, so this must NOT hit the MediaMTX
// WebRTC port (8889) directly; that port is internal-only.
export const CAMERA_PATH = '/winch_cam/';
