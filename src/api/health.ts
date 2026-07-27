import { Path } from './common/constants';
import type { HealthResponse } from './common/types';
import { apiRequest } from './client';

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>(Path.HEALTH);
}
