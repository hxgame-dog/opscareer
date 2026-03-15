type StatusBadgeProps = {
  children: string;
  tone?: 'default' | 'success' | 'warn';
};

export function StatusBadge({ children, tone = 'default' }: StatusBadgeProps) {
  return <span className={`status-pill status-pill-${tone}`}>{children}</span>;
}
