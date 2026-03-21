'use client';

import type { BuilderExperience } from '@/lib/resume-builder';
import { AiPolishCard } from '@/app/components/resume-builder/ai-polish-card';

type ExperienceEditorProps = {
  items: BuilderExperience[];
  polishingTarget: { sectionType: 'experience' | 'project'; index: number } | null;
  completion: string;
  completionError: string;
  isPolishing: boolean;
  onChange: (index: number, patch: Partial<BuilderExperience>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onPolish: (index: number) => void;
  onAcceptPolish: (index: number) => void;
  onCancelPolish: () => void;
};

export function ExperienceEditor({
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
}: ExperienceEditorProps) {
  return (
    <section className="builder-form-section">
      <div className="builder-section-head">
        <div>
          <div className="builder-eyebrow">Experience</div>
          <h3>工作经历</h3>
          <p className="small">先用大白话记录职责和结果，再用 AI 按 STAR 法则打磨成简历语气。</p>
        </div>
        <button className="secondary button-compact" type="button" onClick={onAdd}>
          新增经历
        </button>
      </div>

      <div className="builder-stack">
        {items.map((item, index) => {
          const isActive = polishingTarget?.sectionType === 'experience' && polishingTarget.index === index;
          const sourceText = item.polishedDraft || item.draft;

          return (
            <details key={`${item.company}-${index}`} className="builder-entry" open>
              <summary>
                <span>{item.company || `工作经历 ${index + 1}`}</span>
                <span className="small">{item.polishedDraft ? '已 AI 润色' : item.role || '待补充岗位'}</span>
              </summary>
              <div className="builder-grid-2">
                <div>
                  <label>公司</label>
                  <input value={item.company} onChange={(event) => onChange(index, { company: event.target.value })} />
                </div>
                <div>
                  <label>岗位</label>
                  <input value={item.role} onChange={(event) => onChange(index, { role: event.target.value })} />
                </div>
                <div>
                  <label>开始时间</label>
                  <input value={item.start} onChange={(event) => onChange(index, { start: event.target.value })} />
                </div>
                <div>
                  <label>结束时间</label>
                  <input value={item.end ?? ''} onChange={(event) => onChange(index, { end: event.target.value })} />
                </div>
              </div>
              <label>技术栈</label>
              <input
                value={item.techStack.join(', ')}
                onChange={(event) =>
                  onChange(index, {
                    techStack: event.target.value
                      .split(',')
                      .map((value) => value.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="Kubernetes, Go, Terraform"
              />
              <label>职责 / 成果草稿</label>
              <textarea
                className="builder-large-textarea"
                value={sourceText}
                onChange={(event) =>
                  onChange(index, {
                    draft: event.target.value,
                    polishedDraft: ''
                  })
                }
                placeholder="可以先用大白话写：我负责了什么、怎么做、最后带来了什么结果。"
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
