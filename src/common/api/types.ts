import { Path } from './constants';

export type PathType = (typeof Path)[keyof typeof Path];

export type WinchState = 'FORWARD' | 'REVERSE' | 'STOPPED';

export type WinchStopReason = 'maxRuntime' | 'manual' | 'none';

export type WinchStateResponse = {
  state: WinchState;
  lastCommandAgeMs: number;
  watchdogTimeoutMs: number;
  maxRuntimeMs: number;
  runTimeMs: number;
  uptimeMs: number;
  isConnected: boolean;
  stopReason: WinchStopReason;
};

export type ControlResponse = {
  state: WinchState;
  stopReason: WinchStopReason;
};

export type CommandRequest = {
  command: 'forward' | 'reverse' | 'stop';
};
