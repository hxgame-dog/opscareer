'use client';

import type { BuilderProject } from '@/lib/resume-builder';
import { AiPolishCard } from '@/app/components/resume-builder/ai-polish-card';

type ProjectEditorProps = {
  items: BuilderProject[];
  polishingTarget: { sectionType: 'experience' | 'project'; index: number } | null;
  completion: string;
  completionError: string;
  isPolishing: boolean;
  onChange: (index: number, patch: Partial<BuilderProject>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPolish: (index: number) => void;
  onAcceptPolish: (index: number) => void;
  onCancelPolish: () => void;
};

export function ProjectEditor({
  items,
  polishingTarget,
  completion,
  completionError,
  isPolishing,
  onChange,
  onAdd,
  onRemove,
  onPolish,
  onAcceptPolish,
  onCancelPolish
}: ProjectEditorProps) {
  return (
    <section className="builder-form-section">
      <div className="builder-section-head">
        <div>
          <div className="builder-eyebrow">Projects</div>
          <h3>项目经历</h3>
          <p className="small">项目区更适合先写“背景、动作、结果”，再让 AI 自动补成更专业的亮点表达。</p>
        </div>
        <button className="secondary button-compact" type="button" onClick={onAdd}>
          新增项目
        </button>
      </div>

      <div className="builder-stack">
        {items.map((item, index) => {
          const isActive = polishingTarget?.sectionType === 'project' && polishingTarget.index === index;
          const sourceText = item.polishedDraft || item.draft;

          return (
            <details key={`${item.name}-${index}`} className="builder-entry" open>
              <summary>
                <span>{item.name || `项目 ${index + 1}`}</span>
                <span className="small">{item.polishedDraft ? '已 AI 润色' : item.role || '待补充角色'}</span>
              </summary>
              <div className="builder-grid-2">
                <div>
                  <label>项目名称</label>
                  <input value={item.name} onChange={(event) => onChange(index, { name: event.target.value })} />
                </div>
                <div>
                  <label>角色</label>
                  <input value={item.role ?? ''} onChange={(event) => onChange(index, { role: event.target.value })} />
                </div>
              </div>
              <label>项目简介</label>
              <textarea
                value={item.summary}
                onChange={(event) => onChange(index, { summary: event.target.value })}
                placeholder="一句话说明项目背景。"
              />
              <label>项目亮点草稿</label>
              <textarea
                className="builder-large-textarea"
                value={sourceText}
                onChange={(event) =>
                  onChange(index, {
                    draft: event.target.value,
                    polishedDraft: ''
                  })
                }
                placeholder="可以先描述：你做了什么、怎么推动、结果如何。"
              />
              <div className="builder-inline-actions">
                <button className="ghost button-compact" type="button" onClick={() => onRemove(index)}>
                  删除
                </button>
                <button className="secondary button-compact" type="button" onClick={() => onPolish(index)} disabled={!sourceText.trim() || isPolishing}>
                  {isActive && isPolishing ? '润色中...' : '✨ AI 深度润色'}
                </button>
              </div>

              {isActive ? (
                <AiPolishCard
                  source={sourceText}
                  completion={completion}
                  error={completionError}
                  isLoading={isPolishing}
                  onAccept={() => onAcceptPolish(index)}
                  onCancel={onCancelPolish}
                />
              ) : null}
            </details>
          );
        })}
      </div>
    </section>
  );
}
