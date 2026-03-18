import type { ReactNode } from 'react';

type ContextSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function ContextSection({ title, description, children }: ContextSectionProps) {
  return (
    <section className="context-section">
      <div className="context-section-header">
        <h4>{title}</h4>
        {description ? <p>{description}</p> : null}
      </div>
      <div className="context-section-body">{children}</div>
    </section>
  );
}
