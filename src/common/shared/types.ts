export type AutostopReason = 'maxRuntime' | 'unknown';

export type ToastVariant = 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type Direction = 'forward' | 'reverse';

export type ActiveDirection = Direction | null;

export type ConnectionStatus = 'checking' | 'online' | 'offline';
