import { EmptyState } from '@/app/components/ui/empty-state';
import { SectionHeader } from '@/app/components/ui/section-header';
import { StatusBadge } from '@/app/components/ui/status-badge';
import type { Language } from '@/types/domain';

type JobPostingRecord = {
  id: string;
  company: string;
  role: string;
  description: string;
  language: Language;
  source: 'MANUAL' | 'RESUME_OPTIMIZE' | 'INTERVIEW_PREP';
  saved: boolean;
  updatedAt: string;
};

type JobsViewProps = {
  jdText: string;
  optResult: string;
  prepResult: string;
  jdSearch: string;
  savedOnly: boolean;
  jdLibrary: JobPostingRecord[];
  selectedJobPosting: JobPostingRecord | null;
  onJdTextChange: (value: string) => void;
  onJdSearchChange: (value: string) => void;
  onToggleSavedOnly: () => void;
  onSearch: () => void;
  onOptimizeResume: () => void;
  onPrepareInterview: () => void;
  onSaveCurrentJd: () => void;
  onCreateApplicationFromJd: (posting: JobPostingRecord) => void;
  onStartMockInterviewWithJobPosting: (posting: JobPostingRecord) => void;
  onOpenJobPostingDetail: (id: string) => void;
  onToggleSavedJobPosting: (posting: JobPostingRecord) => void;
  onOptimizeWithJobPosting: (posting: JobPostingRecord) => void;
  onPrepareInterviewWithJobPosting: (posting: JobPostingRecord) => void;
  isOptimizingResume: boolean;
  isPreparingInterview: boolean;
  isSavingCurrentJd: boolean;
};

export function JobsView({
  jdText,
  optResult,
  prepResult,
  jdSearch,
  savedOnly,
  jdLibrary,
  selectedJobPosting,
  onJdTextChange,
  onJdSearchChange,
  onToggleSavedOnly,
  onSearch,
  onOptimizeResume,
  onPrepareInterview,
  onSaveCurrentJd,
  onCreateApplicationFromJd,
  onStartMockInterviewWithJobPosting,
  onOpenJobPostingDetail,
  onToggleSavedJobPosting,
  onOptimizeWithJobPosting,
  onPrepareInterviewWithJobPosting,
  isOptimizingResume,
  isPreparingInterview,
  isSavingCurrentJd
}: JobsViewProps) {
  const formatTime = (value: string) => new Date(value).toLocaleString();

  return (
    <section className="content-stack">
      <article className="panel panel-tight">
        <SectionHeader
          eyebrow="Job Database"
          title="JD 库"
          actions={
            <div className="inline compact-actions">
            <button className="secondary button-compact" onClick={onSearch}>
              刷新列表
            </button>
            <button className="ghost button-compact" onClick={onToggleSavedOnly}>
              {savedOnly ? '只看收藏中' : '查看全部'}
            </button>
            </div>
          }
        />
        <div className="jd-toolbar jd-toolbar-compact">
          <div className="jd-toolbar-search">
            <label>搜索</label>
            <input value={jdSearch} onChange={(e) => onJdSearchChange(e.target.value)} placeholder="公司 / 岗位 / 关键词" />
          </div>
          <div className="jd-toolbar-actions">
            <button className="button-compact" onClick={onOptimizeResume} disabled={isOptimizingResume}>
              {isOptimizingResume ? '诊断中...' : '简历优化'}
            </button>
            <button className="secondary button-compact" onClick={onPrepareInterview} disabled={isPreparingInterview}>
              {isPreparingInterview ? '生成中...' : '面试建议'}
            </button>
            <button className="warn button-compact" onClick={onSaveCurrentJd} disabled={isSavingCurrentJd}>
              {isSavingCurrentJd ? '保存中...' : '收藏当前 JD'}
            </button>
          </div>
        </div>

        <div className="db-table-wrap">
          <div className="db-table jd-table">
            <div className="db-row db-row-head">
              <div className="jd-col-primary">公司 / 岗位</div>
              <div className="jd-col-language">语言</div>
              <div className="jd-col-source">来源</div>
              <div className="jd-col-saved">收藏</div>
              <div className="jd-col-updated">最近更新</div>
              <div className="jd-col-actions">操作</div>
            </div>
            {jdLibrary.map((posting) => (
              <div
                key={posting.id}
                className={`db-row db-row-button ${selectedJobPosting?.id === posting.id ? 'db-row-active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onOpenJobPostingDetail(posting.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onOpenJobPostingDetail(posting.id);
                  }
                }}
              >
                <div className="jd-col-primary jd-primary-cell">
                  <strong>{posting.company}</strong>
                  <div className="small">{posting.role}</div>
                  <div className="small jd-row-meta">
                    {posting.language === 'zh-CN' ? '中文' : 'English'} · {posting.source} · {formatTime(posting.updatedAt)}
                  </div>
                </div>
                <div className="jd-col-language">{posting.language === 'zh-CN' ? '中文' : 'English'}</div>
                <div className="jd-col-source">{posting.source}</div>
                <div className="jd-col-saved">
                  <StatusBadge tone={posting.saved ? 'success' : 'default'}>{posting.saved ? '已收藏' : '未收藏'}</StatusBadge>
                </div>
                <div className="small jd-col-updated">{formatTime(posting.updatedAt)}</div>
                <div className="jd-col-actions db-actions db-actions-compact" onClick={(event) => event.stopPropagation()}>
                  <button className="secondary button-compact" onClick={() => onCreateApplicationFromJd(posting)}>
                    投递
                  </button>
                  <button className="ghost button-compact" onClick={() => onOptimizeWithJobPosting(posting)}>
                    优化
                  </button>
                  <details className="row-actions-menu" onClick={(event) => event.stopPropagation()}>
                    <summary className="ghost button-compact row-actions-trigger">更多</summary>
                    <div className="row-actions-popover">
                      <button className="ghost button-compact" onClick={() => onPrepareInterviewWithJobPosting(posting)}>
                        面试题
                      </button>
                      <button className="warn button-compact" onClick={() => onStartMockInterviewWithJobPosting(posting)}>
                        模拟
                      </button>
                      <button className="ghost button-compact" onClick={() => onToggleSavedJobPosting(posting)}>
                        {posting.saved ? '取消收藏' : '收藏'}
                      </button>
                    </div>
                  </details>
                </div>
              </div>
            ))}
            {jdLibrary.length === 0 ? <EmptyState title="暂无 JD 收藏记录" description="保存一条岗位描述后，这里会变成你的 JD 数据库。" /> : null}
          </div>
        </div>
      </article>

      <article className="panel panel-tight jobs-editor-panel">
        <SectionHeader eyebrow="Editor" title="JD 编辑器" />
        <label>JD JSON</label>
        <textarea value={jdText} onChange={(e) => onJdTextChange(e.target.value)} />
        <div className="grid-2">
          <div>
            <label>诊断输出</label>
            <pre>{optResult || '暂无诊断结果'}</pre>
          </div>
          <div>
            <label>面试建议输出</label>
            <pre>{prepResult || '暂无面试建议'}</pre>
          </div>
        </div>
      </article>
    </section>
  );
}
