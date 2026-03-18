import type { ReactNode } from 'react';

type FilterRailProps = {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function FilterRail({ title, actions, children }: FilterRailProps) {
  return (
    <aside className="filter-rail">
      <div className="filter-rail-header">
        <h3>{title}</h3>
        {actions ? <div className="filter-rail-actions">{actions}</div> : null}
      </div>
      <div className="filter-rail-body">{children}</div>
    </aside>
  );
}
