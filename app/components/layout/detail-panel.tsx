import type { ReactNode } from 'react';
import { ContextSection } from '@/app/components/ui/context-section';

type DetailPanelProps = {
  title: string;
  body: ReactNode;
  isOpen: boolean;
  onClose?: () => void;
};

export function DetailPanel({ title, body, isOpen, onClose }: DetailPanelProps) {
  return (
    <aside className={`workspace-detail ${isOpen ? '' : 'workspace-detail-hidden'}`}>
      <div className="detail-header">
        <div>
          <div className="eyebrow detail-eyebrow">Context Rail</div>
          <h3>{title}</h3>
        </div>
        {onClose ? (
          <button className="ghost detail-close" onClick={onClose} type="button">
            收起
          </button>
        ) : null}
      </div>
      <ContextSection title={title} description="与当前对象相关的编辑、摘要和下一步动作会显示在这里。">
        {body}
      </ContextSection>
    </aside>
  );
}
