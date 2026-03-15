import type { ReactNode } from 'react';

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
          <div className="eyebrow">Context</div>
          <h3>{title}</h3>
        </div>
        {onClose ? (
          <button className="ghost detail-close" onClick={onClose}>
            关闭
          </button>
        ) : null}
      </div>
      {body}
    </aside>
  );
}
