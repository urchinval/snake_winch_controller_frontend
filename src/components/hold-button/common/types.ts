import type { ComponentPropsWithoutRef } from 'react';
import type { Direction, ActiveDirection } from '../../../common/shared/types';

export type HoldButtonProps = ComponentPropsWithoutRef<'button'> & {
  label: string;
  direction: Direction;
  activeDirection: ActiveDirection;
  isBlocked?: boolean;
  onStart: () => void;
  onEnd: () => void;
};
