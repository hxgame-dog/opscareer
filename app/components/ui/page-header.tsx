import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  accent?: 'indigo' | 'blue' | 'emerald' | 'amber' | 'slate';
  meta?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  accent = 'slate',
  meta,
  actions
}: PageHeaderProps) {
  return (
    <section className={`page-header page-header-${accent}`}>
      <div className="page-header-copy">
        <div className="page-header-eyebrow">{eyebrow}</div>
        <h1 className="page-header-title">{title}</h1>
        <p className="page-header-description">{description}</p>
        {meta ? <div className="page-header-meta">{meta}</div> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </section>
  );
}
