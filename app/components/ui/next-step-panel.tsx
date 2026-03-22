import type { ReactNode } from 'react';
import { PanelShell } from '@/app/components/ui/panel-shell';

type NextStepPanelProps = {
  title: string;
  description: string;
  tags: string[];
  actions?: ReactNode;
  className?: string;
};

export function NextStepPanel({ title, description, tags, actions, className = '' }: NextStepPanelProps) {
  return (
    <PanelShell
      eyebrow="Next Step"
      title={title}
      subtitle={description}
      className={`next-step-panel ${className}`.trim()}
      actions={actions}
    >
      <div className="next-step-summary">
        {tags.map((tag) => (
          <span key={tag} className="timeline-tag">
            {tag}
          </span>
        ))}
      </div>
    </PanelShell>
  );
}
