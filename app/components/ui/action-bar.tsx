import type { ReactNode } from 'react';

type ActionBarProps = {
  left?: ReactNode;
  right?: ReactNode;
};

export function ActionBar({ left, right }: ActionBarProps) {
  return (
    <div className="action-bar">
      <div className="action-bar-left">{left}</div>
      <div className="action-bar-right">{right}</div>
    </div>
  );
}
