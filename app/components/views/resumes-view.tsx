'use client';

import { useState } from 'react';
import { ActionBar } from '@/app/components/ui/action-bar';
import { EmptyState } from '@/app/components/ui/empty-state';
import { NextStepPanel } from '@/app/components/ui/next-step-panel';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { ToolbarTabs } from '@/app/components/ui/toolbar-tabs';
import { getResumeNextRecommendation } from '@/lib/product-guidance';
import { resumeThemes } from '@/lib/resume-themes';
import type { ResumeDiffResult, ResumeImportPreview, ResumeTheme } from '@/types/domain';

type ResumeVersion = {
  id: string;
  title: string;
  version: number;
  theme: ResumeTheme;
  parentResumeId: string | null;
  createdAt: string;
  updatedAt: string;
  targetLabel: string | null;
};

type ResumeHistoryGroup = {
  rootResumeId: string;
  displayTitle: string;
  latestResumeId: string;
  versionCount: number;
  updatedAt: string;
  versions: ResumeVersion[];
};

type ResumeDiffPayload = {
  base: { id: string; title: string; version: number };
  compare: { id: string; title: string; version: number };
  diff: ResumeDiffResult;
};

type ResumesViewProps = {
  resumeId: string;
  resumeGeneratedRecently: boolean;
  resumeTitle: string;
  resumeMarkdown: string;
  activeTheme: ResumeTheme;
  allResumeVersions: ResumeVersion[];
  resumeGroups: ResumeHistoryGroup[];
  diffSelection: {
    baseId: string;
    compareId: string;
  };
  diffResult: ResumeDiffPayload | null;
  onResumeTitleChange: (value: string) => void;
  onResumeMarkdownChange: (value: string) => void;
  onGenerateResume: () => void;
  onOptimizeResume: () => void;
  onGoJobs: () => void;
  onRenameResume: () => void;
  onSaveResumeContent: () => void;
  onImportResumeFile: (file: File) => void;
  resumeImportPreview: ResumeImportPreview | null;
  onChangeResumeImportPreview: (patch: Partial<ResumeImportPreview>) => void;
  onConfirmResumeImport: () => void;
  onCancelResumeImport: () => void;
  onApplyTheme: (theme: ResumeTheme) => void;
  onSelectResumeVersion: (id: string) => void;
  onDeleteResume: (id: string) => void;
  onDiffSelectionChange: (selection: { baseId: string; compareId: string }) => void;
  onLoadDiff: () => void;
  isGeneratingResume: boolean;
  isOptimizingResume: boolean;
  isRenamingResume: boolean;
  isSavingResumeContent: boolean;
  isImportingResumeFile: boolean;
  isConfirmingResumeImport: boolean;
  isLoadingDiff: boolean;
};

export function ResumesView({
  resumeId,
  resumeGeneratedRecently,
  resumeTitle,
  resumeMarkdown,
  activeTheme,
  allResumeVersions,
  resumeGroups,
  diffSelection,
  diffResult,
  onResumeTitleChange,
  onResumeMarkdownChange,
  onGenerateResume,
  onOptimizeResume,
  onGoJobs,
  onRenameResume,
  onSaveResumeContent,
  onImportResumeFile,
  resumeImportPreview,
  onChangeResumeImportPreview,
  onConfirmResumeImport,
  onCancelResumeImport,
  onApplyTheme,
  onSelectResumeVersion,
  onDeleteResume,
  onDiffSelectionChange,
  onLoadDiff,
  isGeneratingResume,
  isOptimizingResume,
  isRenamingResume,
  isSavingResumeContent,
  isImportingResumeFile,
  isConfirmingResumeImport,
  isLoadingDiff
}: ResumesViewProps) {
  const formatTime = (value: string) => new Date(value).toLocaleString();
  const [toolTab, setToolTab] = useState<'theme' | 'diff' | 'summary'>('theme');
  const nextRecommendation = getResumeNextRecommendation({
    hasResume: Boolean(resumeId),
    generatedRecently: resumeGeneratedRecently
  });

  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Resume Hub"
        title="围绕投递目标编辑简历"
        description="把版本链、导入预览和正文编辑放进一个更安静的简历工作区里。"
        accent="brand"
        meta={
          <>
            <span className="timeline-tag">版本链</span>
            <span className="timeline-tag">正文编辑</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <div className="inline compact-actions">
                <button onClick={onGenerateResume} disabled={isGeneratingResume}>
                  {isGeneratingResume ? '生成中...' : '生成简历'}
                </button>
                <button className="secondary" onClick={onOptimizeResume} disabled={isOptimizingResume}>
                  {isOptimizingResume ? '优化中...' : '按 JD 优化'}
                </button>
              </div>
            }
            right={
              <label className="button-file secondary">
                {isImportingResumeFile ? '识别中...' : '导入 PDF / DOCX'}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                  disabled={isImportingResumeFile}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onImportResumeFile(file);
                      event.target.value = '';
                    }
                  }}
                />
              </label>
            }
          />
        }
      />

      <NextStepPanel
        title={nextRecommendation.title}
        description={nextRecommendation.description}
        actions={
          <div className="next-step-actions">
            <button onClick={onOptimizeResume} disabled={!resumeId || isOptimizingResume}>
              {isOptimizingResume ? '优化中...' : '按 JD 优化'}
            </button>
            <button className="secondary" onClick={onGoJobs}>
              打开岗位库
            </button>
          </div>
        }
        tags={[
          resumeId ? '当前已有版本' : '还未生成版本',
          ...(resumeGeneratedRecently ? ['刚生成的新版本'] : []),
          resumeId ? '推荐继续优化再投递' : '先生成再管理版本'
        ]}
      />

      <div className="resume-studio-layout">
        <PanelShell
          eyebrow="Library"
          title="简历库与版本链"
          subtitle={`共 ${resumeGroups.length} 组简历`}
          className="resume-library-panel"
          actions={
            <button className="secondary button-compact" onClick={onGenerateResume} disabled={isGeneratingResume}>
              新建版本
            </button>
          }
        >
          <div className="resume-groups">
            {resumeGroups.length > 0 ? (
              resumeGroups.map((group) => (
                <section key={group.rootResumeId} className="resume-group-card">
                  <div className="resume-group-title-row">
                    <div>
                      <strong>{group.displayTitle}</strong>
                      <div className="small">{group.versionCount} 个版本</div>
                    </div>
                    <span className="small">{formatTime(group.updatedAt)}</span>
                  </div>
                  <div className="dashboard-card-list">
                    {group.versions.map((version) => (
                      <ResultCard
                        key={version.id}
                        title={`V${version.version}`}
                        subtitle={version.targetLabel ?? version.title}
                        active={resumeId === version.id}
                        meta={<div className="small">{version.theme} · {formatTime(version.updatedAt)}</div>}
                        onClick={() => onSelectResumeVersion(version.id)}
                        actions={
                          <button className="danger button-compact" onClick={() => onDeleteResume(version.id)}>
                            删除
                          </button>
                        }
                      />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <EmptyState title="还没有简历" description="先生成第一版简历，后续才能形成版本链。" />
            )}
          </div>
        </PanelShell>

        <PanelShell eyebrow="Editor" title="正文编辑器" subtitle="这里是你最重要的主工作区。" className="resume-editor-panel">
          <div className="resume-editor-toolbar">
            <input value={resumeTitle} onChange={(event) => onResumeTitleChange(event.target.value)} placeholder="当前简历标题" />
            <div className="inline compact-actions">
              <button className="ghost button-compact" onClick={onRenameResume} disabled={!resumeId || isRenamingResume}>
                {isRenamingResume ? '保存中...' : '重命名'}
              </button>
              <button className="button-compact" onClick={onSaveResumeContent} disabled={!resumeId || isSavingResumeContent}>
                {isSavingResumeContent ? '保存中...' : '保存正文'}
              </button>
              <a href={resumeId ? `/api/resume/${resumeId}/export?format=md` : '#'} className="anchor-wrap">
                <button className="secondary button-compact" disabled={!resumeId}>Markdown</button>
              </a>
              <a href={resumeId ? `/api/resume/${resumeId}/export?format=pdf` : '#'} className="anchor-wrap">
                <button className="warn button-compact" disabled={!resumeId}>PDF</button>
              </a>
            </div>
          </div>

          {resumeImportPreview ? (
            <div className="resume-import-preview">
              <div className="page-inline-header">
                <div>
                  <div className="section-eyebrow">Import Preview</div>
                  <h3 className="section-title">识别预览确认</h3>
                </div>
                <div className="section-actions">
                  <button className="ghost button-compact" type="button" onClick={onCancelResumeImport}>
                    取消
                  </button>
                  <button type="button" className="button-compact" onClick={onConfirmResumeImport} disabled={isConfirmingResumeImport}>
                    {isConfirmingResumeImport ? '保存中...' : '确认导入'}
                  </button>
                </div>
              </div>
              <div className="resume-import-meta">
                <span className="timeline-tag">文件 {resumeImportPreview.filename}</span>
                <span className="timeline-tag">经历 {resumeImportPreview.profile.experiences.length}</span>
                <span className="timeline-tag">项目 {resumeImportPreview.profile.projects.length}</span>
                <span className="timeline-tag">技能 {resumeImportPreview.profile.skills.length}</span>
              </div>
              <label>导入标题</label>
              <input
                value={resumeImportPreview.title}
                onChange={(event) => onChangeResumeImportPreview({ title: event.target.value })}
                placeholder="确认导入后的简历标题"
              />
              <label>识别后的 Markdown</label>
              <textarea
                className="resume-import-markdown"
                value={resumeImportPreview.markdown}
                onChange={(event) => onChangeResumeImportPreview({ markdown: event.target.value })}
              />
            </div>
          ) : null}

          <textarea className="resume-editor-markdown" value={resumeMarkdown} onChange={(event) => onResumeMarkdownChange(event.target.value)} />
        </PanelShell>

        <PanelShell eyebrow="Tools" title="主题 / 对比 / 摘要" subtitle="把次级工具收进右侧辅助区。" className="resume-tools-panel">
          <ToolbarTabs
            value={toolTab}
            items={[
              { id: 'theme', label: '主题' },
              { id: 'diff', label: '版本对比' },
              { id: 'summary', label: '当前版本' }
            ]}
            onChange={setToolTab}
          />
          {toolTab === 'theme' ? (
            <div className="theme-grid theme-grid-compact">
              {resumeThemes.map((theme) => (
                <button
                  key={theme.id}
                  className={`theme-card ${activeTheme === theme.id ? 'theme-card-active' : ''}`}
                  onClick={() => onApplyTheme(theme.id)}
                  style={{ ['--theme-accent' as string]: theme.accentColor }}
                >
                  <span>{theme.name}</span>
                  <span className="small">{theme.tone}</span>
                </button>
              ))}
            </div>
          ) : null}
          {toolTab === 'diff' ? (
            <div className="tool-tab-panel">
              <label>基础版本</label>
              <select value={diffSelection.baseId} onChange={(e) => onDiffSelectionChange({ ...diffSelection, baseId: e.target.value })}>
                <option value="">请选择版本</option>
                {allResumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    V{version.version} · {version.targetLabel ?? version.title}
                  </option>
                ))}
              </select>
              <label>对比版本</label>
              <select value={diffSelection.compareId} onChange={(e) => onDiffSelectionChange({ ...diffSelection, compareId: e.target.value })}>
                <option value="">请选择版本</option>
                {allResumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    V{version.version} · {version.targetLabel ?? version.title}
                  </option>
                ))}
              </select>
              <button className="button-compact" onClick={onLoadDiff} disabled={isLoadingDiff}>
                {isLoadingDiff ? '分析中...' : '生成差异'}
              </button>
              {diffResult ? (
                <div className="diff-grid diff-grid-single">
                  <div className="item">
                    <strong>Summary</strong>
                    <div className="small">Before: {diffResult.diff.summary.before || '空'}</div>
                    <div className="small">After: {diffResult.diff.summary.after || '空'}</div>
                  </div>
                  <div className="item">
                    <strong>Skills</strong>
                    <div className="small">新增: {diffResult.diff.skills.added.join(' / ') || '无'}</div>
                    <div className="small">移除: {diffResult.diff.skills.removed.join(' / ') || '无'}</div>
                  </div>
                </div>
              ) : (
                <EmptyState title="先选两个版本" description="选择两个版本后即可查看结构化差异。" />
              )}
            </div>
          ) : null}
          {toolTab === 'summary' ? (
            <div className="tool-tab-panel">
              <ResultCard
                title={resumeTitle || '未命名简历'}
                subtitle={resumeId || '还没有保存版本'}
                meta={<div className="small">主题 {activeTheme} · 正文 {resumeMarkdown.length} 字符</div>}
              />
            </div>
          ) : null}
        </PanelShell>
      </div>
    </section>
  );
}
