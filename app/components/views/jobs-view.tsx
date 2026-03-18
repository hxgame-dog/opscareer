import { EmptyState } from '@/app/components/ui/empty-state';
import { ActionBar } from '@/app/components/ui/action-bar';
import { FilterRail } from '@/app/components/ui/filter-rail';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { SearchBar } from '@/app/components/ui/search-bar';
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
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Job Database"
        title="搜索、筛选并推进岗位"
        description="把 JD 当作整个求职工作台的入口，围绕岗位直接发起简历优化、投递和模拟面试。"
        accent="blue"
        meta={
          <>
            <span className="timeline-tag">搜索 + 筛选</span>
            <span className="timeline-tag">结果区</span>
            <span className="timeline-tag">详情联动</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <SearchBar
                label="岗位搜索"
                value={jdSearch}
                placeholder="公司、岗位、关键词"
                onChange={onJdSearchChange}
              />
            }
            right={
              <div className="inline compact-actions">
                <button className="secondary" onClick={onSearch}>刷新列表</button>
                <button className="ghost" onClick={onToggleSavedOnly}>{savedOnly ? '只看收藏' : '查看全部'}</button>
              </div>
            }
          />
        }
      />

      <div className="jobs-stage-layout">
        <FilterRail
          title="筛选与动作"
          actions={<button className="ghost button-compact" onClick={onToggleSavedOnly}>{savedOnly ? '收藏中' : '全部岗位'}</button>}
        >
          <div className="jobs-filter-stack">
            <div className="small">把最常用的动作放在结果区上方，减少来回切换。</div>
            <button onClick={onOptimizeResume} disabled={isOptimizingResume}>
              {isOptimizingResume ? '诊断中...' : '简历优化'}
            </button>
            <button className="secondary" onClick={onPrepareInterview} disabled={isPreparingInterview}>
              {isPreparingInterview ? '生成中...' : '面试建议'}
            </button>
            <button className="warn" onClick={onSaveCurrentJd} disabled={isSavingCurrentJd}>
              {isSavingCurrentJd ? '保存中...' : '收藏当前 JD'}
            </button>
          </div>
        </FilterRail>

        <div className="jobs-primary-column">
          <PanelShell
            eyebrow="Results"
            title="岗位结果区"
            subtitle={`共 ${jdLibrary.length} 条岗位记录${selectedJobPosting ? ` · 当前 ${selectedJobPosting.company}` : ''}`}
          >
            <div className="jobs-results-list">
              {jdLibrary.length > 0 ? (
                jdLibrary.map((posting) => (
                  <ResultCard
                    key={posting.id}
                    title={`${posting.company} · ${posting.role}`}
                    subtitle={`${posting.language === 'zh-CN' ? '中文' : 'English'} · 更新于 ${formatTime(posting.updatedAt)}`}
                    active={selectedJobPosting?.id === posting.id}
                    meta={
                      <>
                        <StatusBadge tone={posting.saved ? 'success' : 'default'}>
                          {posting.saved ? '已收藏' : '未收藏'}
                        </StatusBadge>{' '}
                        <StatusBadge>{posting.source}</StatusBadge>
                      </>
                    }
                    onClick={() => onOpenJobPostingDetail(posting.id)}
                    actions={
                      <div className="inline compact-actions">
                        <button className="secondary button-compact" onClick={() => onCreateApplicationFromJd(posting)}>
                          投递
                        </button>
                        <button className="ghost button-compact" onClick={() => onOptimizeWithJobPosting(posting)}>
                          优化
                        </button>
                      </div>
                    }
                  >
                    <div className="jobs-card-actions">
                      <button className="ghost button-compact" onClick={() => onPrepareInterviewWithJobPosting(posting)}>
                        面试建议
                      </button>
                      <button className="ghost button-compact" onClick={() => onToggleSavedJobPosting(posting)}>
                        {posting.saved ? '取消收藏' : '收藏'}
                      </button>
                      <button className="warn button-compact" onClick={() => onStartMockInterviewWithJobPosting(posting)}>
                        模拟面试
                      </button>
                    </div>
                  </ResultCard>
                ))
              ) : (
                <EmptyState title="暂无 JD 收藏记录" description="保存一条岗位描述后，这里会变成你的岗位数据库。" />
              )}
            </div>
          </PanelShell>

          <PanelShell eyebrow="Composer" title="JD 编辑器" subtitle="手动录入、粘贴或整理一条岗位描述。">
            <textarea value={jdText} onChange={(event) => onJdTextChange(event.target.value)} />
          </PanelShell>
        </div>

        <div className="jobs-secondary-column">
          <PanelShell eyebrow="Resume Link" title="简历诊断输出" subtitle="从当前 JD 直接推动简历定制。">
            <pre>{optResult || '暂无诊断结果'}</pre>
          </PanelShell>
          <PanelShell eyebrow="Interview Prep" title="面试建议输出" subtitle="围绕岗位要求生成面试问题和回答参考。">
            <pre>{prepResult || '暂无面试建议'}</pre>
          </PanelShell>
        </div>
      </div>
    </section>
  );
}
