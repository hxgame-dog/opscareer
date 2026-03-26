type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-eyebrow">Empty state</div>
      <strong>{title}</strong>
      <div className="small">{description}</div>
      {actionLabel || secondaryLabel ? (
        <div className="inline compact-actions">
          {actionLabel ? <button onClick={onAction}>{actionLabel}</button> : null}
          {secondaryLabel ? <button className="secondary" onClick={onSecondaryAction}>{secondaryLabel}</button> : null}
        </div>
      ) : null}
    </div>
  );
}
