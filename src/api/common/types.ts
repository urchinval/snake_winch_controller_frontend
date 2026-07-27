import { Path } from './constants';

export type PathType = (typeof Path)[keyof typeof Path];

export type WinchState = 'FORWARD' | 'REVERSE' | 'STOPPED';

export type WinchStateResponse = {
  state: WinchState;
  lastCommandAgeMs: number;
  watchdogTimeoutMs: number;
  maxRunTimeMs: number;
  uptimeMs: number;
  isConnected: boolean;
};

export type HealthResponse = {
  status: string;
  uptimeMs: number;
  wifi: boolean;
  ip: string;
};

export type ControlResponse = {
  state: WinchState;
};

export type CommandRequest = {
  command: 'forward' | 'reverse' | 'stop';
};
