import type { ComponentPropsWithoutRef } from 'react';

export type HoldButtonProps = ComponentPropsWithoutRef<'button'> & {
  label: string;
  direction: 'forward' | 'reverse';
  activeDirection: 'forward' | 'reverse' | null;
  isBlocked?: boolean;
  onStart: () => void;
  onEnd: () => void;
};
