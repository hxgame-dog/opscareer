import type { ReactNode } from 'react';

type ResultCardProps = {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  active?: boolean;
  onClick?: () => void;
};

export function ResultCard({ title, subtitle, meta, actions, children, active = false, onClick }: ResultCardProps) {
  return (
    <div
      className={`result-card ${active ? 'result-card-active' : ''} ${onClick ? 'result-card-clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="result-card-head">
        <div>
          <div className="result-card-title">{title}</div>
          {subtitle ? <div className="result-card-subtitle">{subtitle}</div> : null}
        </div>
        {actions ? <div className="result-card-actions">{actions}</div> : null}
      </div>
      {meta ? <div className="result-card-meta">{meta}</div> : null}
      {children ? <div className="result-card-body">{children}</div> : null}
    </div>
  );
}
