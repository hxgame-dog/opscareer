type MetricChipProps = {
  label: string;
  value: string | number;
  hint?: string;
};

export function MetricChip({ label, value, hint }: MetricChipProps) {
  return (
    <article className="metric-chip">
      <div className="metric-chip-label">{label}</div>
      <div className="metric-chip-value">{value}</div>
      {hint ? <div className="metric-chip-hint">{hint}</div> : null}
    </article>
  );
}
