type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-eyebrow">Empty state</div>
      <strong>{title}</strong>
      <div className="small">{description}</div>
    </div>
  );
}
