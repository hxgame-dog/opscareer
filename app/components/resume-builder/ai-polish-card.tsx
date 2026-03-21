'use client';

type AiPolishCardProps = {
  source: string;
  completion: string;
  isLoading: boolean;
  error: string;
  onAccept: () => void;
  onCancel: () => void;
};

export function AiPolishCard({ source, completion, isLoading, error, onAccept, onCancel }: AiPolishCardProps) {
  return (
    <div className="builder-polish-card">
      <div className="builder-polish-note">AI 会按 STAR 法则整理内容，并自动补充量化结果占位符。只有点击“采纳该版本”后才会覆盖原文。</div>
      <div className="builder-polish-columns">
        <section className="builder-polish-pane">
          <div className="builder-polish-label">原始草稿</div>
          <pre>{source || '这里会显示你当前输入的原始内容。'}</pre>
        </section>
        <section className="builder-polish-pane builder-polish-pane-accent">
          <div className="builder-polish-label">AI 润色版本</div>
          <pre>{completion || (isLoading ? '正在按照 STAR 法则润色...' : '等待润色结果...')}</pre>
        </section>
      </div>
      <div className="builder-polish-actions">
        {error ? <div className="builder-inline-error">{error}</div> : null}
        <button className="ghost button-compact" type="button" onClick={onCancel}>
          取消
        </button>
        <button type="button" className="button-compact" disabled={!completion.trim() || isLoading} onClick={onAccept}>
          采纳该版本
        </button>
      </div>
    </div>
  );
}
