export type ToastVariant = 'error' | 'warning' | 'info';

export type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};
