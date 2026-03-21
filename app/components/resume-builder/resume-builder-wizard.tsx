'use client';

import type { BuilderIdentity } from '@/lib/resume-builder';

type ResumeBuilderWizardProps = {
  identity: BuilderIdentity | null;
  targetRole: string;
  step: 1 | 2;
  onIdentityChange: (value: BuilderIdentity) => void;
  onTargetRoleChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
};

const identityOptions: Array<{ value: BuilderIdentity; hint: string }> = [
  { value: '学生', hint: '适合校招、实习和项目经历为主的表达。' },
  { value: '职场新人', hint: '适合 1-3 年经验，突出成长速度与执行结果。' },
  { value: '资深职场人', hint: '适合中高阶候选人，强调 ownership 与量化成果。' }
];

const targetRolePresets = [
  { label: '产品经理', hint: '强调策略、协作和结果转化' },
  { label: '策略运营', hint: '强调增长、分析与关键指标' },
  { label: '后端开发', hint: '强调系统设计、稳定性和性能' },
  { label: 'SRE', hint: '强调稳定性、自动化和故障治理' },
  { label: '平台工程师', hint: '强调工程效率、平台能力和抽象' }
];

export function ResumeBuilderWizard({
  identity,
  targetRole,
  step,
  onIdentityChange,
  onTargetRoleChange,
  onBack,
  onNext
}: ResumeBuilderWizardProps) {
  return (
    <div className="builder-wizard">
      <div className="builder-wizard-progress">
        <span className={step === 1 ? 'active' : step > 1 ? 'done' : ''}>1</span>
        <span className={step === 2 ? 'active' : ''}>2</span>
      </div>

      {step === 1 ? (
        <section className="builder-panel builder-panel-emphasis">
          <div className="builder-eyebrow">Step 1</div>
          <h2>你当前更接近哪一种身份？</h2>
          <p className="small">这个选择会影响 AI 润色的语气和表达成熟度。</p>
          <div className="builder-choice-grid">
            {identityOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`builder-choice builder-choice-detail ${identity === option.value ? 'builder-choice-active' : ''}`}
                onClick={() => onIdentityChange(option.value)}
              >
                <strong>{option.value}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
          <div className="builder-step-note">这一步不会写入数据库，只在当前简历工作台会话中生效。</div>
          <div className="builder-actions">
            <button type="button" disabled={!identity} onClick={onNext}>
              继续
            </button>
          </div>
        </section>
      ) : (
        <section className="builder-panel builder-panel-emphasis">
          <div className="builder-eyebrow">Step 2</div>
          <h2>你这次主要面向什么岗位？</h2>
          <p className="small">岗位会作为 AI 润色与简历生成的重要上下文。</p>
          <div className="builder-choice-grid builder-choice-grid-compact">
            {targetRolePresets.map((option) => (
              <button
                key={option.label}
                type="button"
                className={`builder-choice builder-choice-detail ${targetRole === option.label ? 'builder-choice-active' : ''}`}
                onClick={() => onTargetRoleChange(option.label)}
              >
                <strong>{option.label}</strong>
                <span>{option.hint}</span>
              </button>
            ))}
          </div>
          <label>自定义目标岗位</label>
          <input value={targetRole} onChange={(event) => onTargetRoleChange(event.target.value)} placeholder="例如：后端开发 / 平台工程师" />
          <div className="builder-step-note">后续 AI 会优先使用这个岗位语境，按 STAR 方式改写经历与项目。</div>
          <div className="builder-actions">
            <button className="ghost button-compact" type="button" onClick={onBack}>
              返回上一步
            </button>
            <button type="button" disabled={!targetRole.trim()} onClick={onNext}>
              开始填写简历
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
