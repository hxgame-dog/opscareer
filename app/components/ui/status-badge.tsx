import { getStatusBadgeTone, type StatusBadgeTone } from '@/lib/status-badge';

type StatusBadgeProps = {
  children: string;
  tone?: StatusBadgeTone;
};

export function StatusBadge({ children, tone = 'default' }: StatusBadgeProps) {
  const resolvedTone = tone === 'default' ? getStatusBadgeTone(children) : tone;
  return <span className={`status-pill status-pill-${resolvedTone}`}>{children}</span>;
}
