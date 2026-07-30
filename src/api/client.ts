import { BASE_URL, API_PREFIX } from '../common/api/constants';
import type { PathType } from '../common/api/types';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: PathType, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const headers: HeadersInit = options.body ? { 'Content-Type': 'application/json' } : {};
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError('No connection to controller', 0);
  }

  if (!response.ok) {
    let message = `Server error (HTTP ${response.status})`;
    try {
      const body = await response.json();
      if (body && typeof body.error === 'string') message = body.error;
    } catch (error) {
      console.error('Error parsing API response', error);
    }
    throw new ApiError(message, response.status);
  }

  return response.json() as Promise<T>;
}
