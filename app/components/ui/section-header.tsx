import type { ReactNode } from 'react';

type SectionHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
};

export function SectionHeader({ eyebrow, title, actions }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <div className="section-eyebrow">{eyebrow}</div>
        <h2 className="section-title">{title}</h2>
      </div>
      {actions ? <div className="section-actions">{actions}</div> : null}
    </div>
  );
}
