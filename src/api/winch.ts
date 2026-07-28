import { Path } from '../common/api/constants';
import type { WinchStateResponse, CommandRequest, ControlResponse } from '../common/api/types';
import { apiRequest } from './client';

export function fetchWinchState(): Promise<WinchStateResponse> {
  return apiRequest<WinchStateResponse>(Path.WINCH_STATE);
}

export function controlWinch(command: CommandRequest['command']): Promise<ControlResponse> {
  return apiRequest<ControlResponse>(Path.WINCH_CONTROL, {
    method: 'POST',
    body: JSON.stringify({ command }),
  });
}
