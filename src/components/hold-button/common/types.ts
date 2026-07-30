import type { ComponentPropsWithoutRef } from 'react';

type Direction = 'forward' | 'reverse';

export type HoldButtonProps = ComponentPropsWithoutRef<'button'> & {
  label: string;
  direction: Direction;
  activeDirection: Direction | null;
  isBlocked?: boolean;
  onStart: () => void;
  onEnd: () => void;
};
