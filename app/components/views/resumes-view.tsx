'use client';

import { useState } from 'react';
import { resumeThemes } from '@/lib/resume-themes';
import type { Language, ResumeDiffResult, ResumeImportPreview, ResumeTheme } from '@/types/domain';

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
  const [toolTab, setToolTab] = useState<'theme' | 'diff'>('theme');

  return (
    <section className="content-stack">
      <div className="resumes-layout">
        <article className="panel panel-tight resumes-sidebar-panel">
          <div className="database-header database-header-compact">
            <div>
              <div className="eyebrow">Resume Library</div>
              <h2>我的简历</h2>
            </div>
            <button className="secondary button-compact" onClick={onGenerateResume} disabled={isGeneratingResume}>
              {isGeneratingResume ? '生成中...' : '新建版本'}
            </button>
          </div>
          <div className="resume-groups">
            {resumeGroups.map((group) => (
              <section key={group.rootResumeId} className="resume-group-card">
                <div className="resume-group-title-row">
                  <div>
                    <strong>{group.displayTitle}</strong>
                    <div className="small">{group.versionCount} 个版本</div>
                  </div>
                  <span className="small">{formatTime(group.updatedAt)}</span>
                </div>
                <div className="history-list">
                  {group.versions.map((version) => (
                    <div key={version.id} className={`history-item ${resumeId === version.id ? 'history-item-active' : ''}`}>
                      <button className="history-item-main" onClick={() => onSelectResumeVersion(version.id)}>
                        <span>V{version.version}</span>
                        <span className="small">{version.targetLabel ?? version.title}</span>
                      </button>
                      <button className="danger" onClick={() => onDeleteResume(version.id)}>
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            ))}
            {resumeGroups.length === 0 ? <div className="item small">还没有简历，先生成第一版。</div> : null}
          </div>
        </article>

        <article className="panel panel-tight resumes-editor-panel">
          <div className="database-header database-header-compact">
            <div>
              <div className="eyebrow">Editor</div>
              <h2>简历编辑器</h2>
            </div>
            <div className="inline compact-actions">
              <button className="button-compact" onClick={onGenerateResume} disabled={isGeneratingResume}>
                {isGeneratingResume ? '生成中...' : '生成简历'}
              </button>
              <button className="secondary button-compact" onClick={onOptimizeResume} disabled={isOptimizingResume}>
                {isOptimizingResume ? '优化中...' : '按 JD 优化'}
              </button>
              <label className="button-file button-compact secondary">
                {isImportingResumeFile ? '导入中...' : '导入 PDF / Word'}
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
            </div>
          </div>
          <label>当前简历标题</label>
          <input value={resumeTitle} onChange={(e) => onResumeTitleChange(e.target.value)} placeholder="给当前版本起个名字" />
          <div className="inline compact-actions">
            <button className="ghost button-compact" onClick={onRenameResume} disabled={!resumeId || isRenamingResume}>
              {isRenamingResume ? '保存中...' : '重命名'}
            </button>
            <button className="button-compact" onClick={onSaveResumeContent} disabled={!resumeId || isSavingResumeContent}>
              {isSavingResumeContent ? '保存中...' : '保存正文'}
            </button>
            <a href={resumeId ? `/api/resume/${resumeId}/export?format=md` : '#'} className="anchor-wrap">
              <button className="secondary button-compact" disabled={!resumeId}>
                Markdown
              </button>
            </a>
            <a href={resumeId ? `/api/resume/${resumeId}/export?format=pdf` : '#'} className="anchor-wrap">
              <button className="warn button-compact" disabled={!resumeId}>
                PDF
              </button>
            </a>
          </div>
          <div className="small">支持导入 PDF、DOCX 简历。旧版 `.doc` 请先转成 `.docx` 或 PDF。</div>
          {resumeImportPreview ? (
            <div className="resume-import-preview">
              <div className="section-header">
                <div>
                  <div className="section-eyebrow">Import Preview</div>
                  <h3 className="section-title">识别预览确认</h3>
                </div>
                <div className="section-actions">
                  <button className="ghost button-compact" type="button" onClick={onCancelResumeImport}>
                    取消
                  </button>
                  <button
                    className="button-compact"
                    type="button"
                    onClick={onConfirmResumeImport}
                    disabled={isConfirmingResumeImport}
                  >
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
              <div className="small">确认导入后，这份内容会保存为新的简历版本，同时回填个人档案。</div>
            </div>
          ) : null}
          <label>Resume Markdown</label>
          <textarea value={resumeMarkdown} onChange={(e) => onResumeMarkdownChange(e.target.value)} />
        </article>

        <article className="panel panel-tight resumes-side-panel">
          <div className="database-header database-header-compact">
            <div>
              <div className="eyebrow">Theme + Diff</div>
              <h2>版本工具</h2>
            </div>
          </div>
          <div className="tool-tabs">
            <button
              className={`tool-tab ${toolTab === 'theme' ? 'tool-tab-active' : ''}`}
              onClick={() => setToolTab('theme')}
              type="button"
            >
              主题
            </button>
            <button
              className={`tool-tab ${toolTab === 'diff' ? 'tool-tab-active' : ''}`}
              onClick={() => setToolTab('diff')}
              type="button"
            >
              版本对比
            </button>
          </div>
          {toolTab === 'theme' ? (
            <div className="tool-tab-panel">
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
            </div>
          ) : (
            <div className="tool-tab-panel">
              <label>基础版本</label>
              <select
                value={diffSelection.baseId}
                onChange={(e) => onDiffSelectionChange({ ...diffSelection, baseId: e.target.value })}
              >
                <option value="">请选择版本</option>
                {allResumeVersions.map((version) => (
                  <option key={version.id} value={version.id}>
                    V{version.version} · {version.targetLabel ?? version.title}
                  </option>
                ))}
              </select>
              <label>对比版本</label>
              <select
                value={diffSelection.compareId}
                onChange={(e) => onDiffSelectionChange({ ...diffSelection, compareId: e.target.value })}
              >
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
                <div className="diff-grid diff-grid-single" style={{ marginTop: 12 }}>
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
                <div className="item small" style={{ marginTop: 12 }}>
                  选择两个版本后即可查看差异。
                </div>
              )}
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
