import { Path } from '../common/api/constants';
import type { HealthResponse } from '../common/api/types';
import { apiRequest } from './client';

export function fetchHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>(Path.HEALTH);
}
