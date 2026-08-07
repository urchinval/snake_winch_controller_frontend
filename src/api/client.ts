import { BASE_URL } from '../common/api/constants';
import type { PathType } from '../common/api/types';
import { REQUEST_TIMEOUT_MS } from '../common/shared/constants';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function apiRequest<T>(path: PathType, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = options.body ? { 'Content-Type': 'application/json' } : {};
  let response: Response;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Controller request timed out', 0);
    }
    throw new ApiError('No connection to controller', 0);
  } finally {
    window.clearTimeout(timeoutId);
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
