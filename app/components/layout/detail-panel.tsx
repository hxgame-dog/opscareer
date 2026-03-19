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
          <div className="eyebrow detail-eyebrow">Context</div>
          <h3>{title}</h3>
        </div>
        {onClose ? (
          <button className="ghost detail-close" onClick={onClose} type="button">
            收起
          </button>
        ) : null}
      </div>
      <ContextSection title={title} description="这里放当前对象的补充信息、编辑入口和下一步动作。">
        {body}
      </ContextSection>
    </aside>
  );
}
