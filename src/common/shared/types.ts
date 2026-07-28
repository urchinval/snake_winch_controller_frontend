import type { WinchStateResponse } from '../api/types';

export type AutostopReason = 'watchdog' | 'maxRunTime' | 'unknown';

export type WinchSnapshot = {
  state: WinchStateResponse['state'];
  lastCommandAgeMs: number;
  runTimeMs: number;
};
