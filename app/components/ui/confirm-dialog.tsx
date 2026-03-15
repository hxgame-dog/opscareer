import type { ReactNode } from 'react';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  extra?: ReactNode;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'default',
  busy = false,
  onCancel,
  onConfirm,
  extra
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true">
      <div className="confirm-dialog">
        <div className="section-eyebrow">Please Confirm</div>
        <h3>{title}</h3>
        <p>{description}</p>
        {extra}
        <div className="confirm-actions">
          <button className="ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button className={tone === 'danger' ? 'danger' : ''} onClick={onConfirm} disabled={busy}>
            {busy ? '处理中...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
