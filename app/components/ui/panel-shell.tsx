import type { ReactNode } from 'react';

type PanelShellProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PanelShell({ eyebrow, title, subtitle, actions, children, className = '' }: PanelShellProps) {
  return (
    <article className={`panel-shell ${className}`.trim()}>
      <div className="panel-shell-header">
        <div>
          {eyebrow ? <div className="panel-shell-eyebrow">{eyebrow}</div> : null}
          <h2 className="panel-shell-title">{title}</h2>
          {subtitle ? <p className="panel-shell-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="panel-shell-actions">{actions}</div> : null}
      </div>
      <div className="panel-shell-body">{children}</div>
    </article>
  );
}
