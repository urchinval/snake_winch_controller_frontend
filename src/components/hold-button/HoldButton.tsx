import type { HoldButtonProps } from './common/types';
import s from './HoldButton.module.css';

export default function HoldButton({
  label,
  direction,
  activeDirection,
  isBlocked = false,
  onStart,
  onEnd,
}: HoldButtonProps) {
  const isActive = direction === activeDirection;
  const activeClass = isActive
    ? direction === 'forward'
      ? s.activeForward
      : s.activeReverse
    : ' ';

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    onStart();
  };

  return (
    <button
      className={`${s.btn} ${activeClass} ${isBlocked ? s.blocked : ''}`}
      onPointerDown={handlePointerDown}
      onPointerUp={onEnd}
      onPointerLeave={onEnd}
      onPointerCancel={onEnd}>
      {label}
    </button>
  );
}
