import { ActionBar } from '@/app/components/ui/action-bar';
import { EmptyState } from '@/app/components/ui/empty-state';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { SearchBar } from '@/app/components/ui/search-bar';
import { StatusBadge } from '@/app/components/ui/status-badge';

type InterviewRecord = {
  id: string;
  roundName: string;
  notes: string;
  summary: string | null;
  status: 'APPLIED' | 'SCREENING' | 'TECHNICAL' | 'FINAL' | 'OFFER' | 'REJECTED' | 'WITHDRAWN';
  applicationId?: string | null;
  jobPosting: {
    company: string;
    role: string;
  };
};

type InterviewsViewProps = {
  interviewForm: {
    applicationId: string;
    jobPostingId: string;
    roundName: string;
    notes: string;
  };
  interviewFilters: {
    status: string;
    company: string;
    role: string;
  };
  interviews: InterviewRecord[];
  onInterviewFormChange: (form: {
    applicationId: string;
    jobPostingId: string;
    roundName: string;
    notes: string;
  }) => void;
  onInterviewFiltersChange: (filters: {
    status: string;
    company: string;
    role: string;
  }) => void;
  onCreateInterview: () => void;
  onLoadInterviews: () => void;
  onUpdateInterviewStatus: (id: string, status: InterviewRecord['status']) => void;
  onGenSummary: (id: string) => void;
  isCreatingInterview: boolean;
};

export function InterviewsView({
  interviewForm,
  interviewFilters,
  interviews,
  onInterviewFormChange,
  onInterviewFiltersChange,
  onCreateInterview,
  onLoadInterviews,
  onUpdateInterviewStatus,
  onGenSummary,
  isCreatingInterview
}: InterviewsViewProps) {
  const summaryKeyword = `${interviewFilters.company} ${interviewFilters.role}`.trim();

  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Interview Tracker"
        title="沉淀真实面试与复盘"
        description="把每轮真实面试的记录、状态和复盘放在一个更标准的管理界面里，便于后续复用和对照。"
        accent="slate"
        meta={
          <>
            <span className="timeline-tag">记录</span>
            <span className="timeline-tag">筛选</span>
            <span className="timeline-tag">复盘</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <SearchBar
                label="快速筛选"
                value={summaryKeyword}
                placeholder="公司或岗位关键词"
                onChange={(value) => onInterviewFiltersChange({ ...interviewFilters, company: value, role: value })}
              />
            }
            right={
              <div className="inline compact-actions">
                <button onClick={onCreateInterview} disabled={isCreatingInterview}>
                  {isCreatingInterview ? '保存中...' : '保存记录'}
                </button>
                <button className="secondary" onClick={onLoadInterviews}>
                  刷新列表
                </button>
              </div>
            }
          />
        }
      />

      <div className="interviews-layout">
        <PanelShell eyebrow="Capture" title="新建面试记录" subtitle="这里用于沉淀真实面试的原始记录。">
          <label>Application ID</label>
          <input
            value={interviewForm.applicationId}
            onChange={(event) => onInterviewFormChange({ ...interviewForm, applicationId: event.target.value })}
          />
          <label>Job Posting ID</label>
          <input
            value={interviewForm.jobPostingId}
            onChange={(event) => onInterviewFormChange({ ...interviewForm, jobPostingId: event.target.value })}
          />
          <label>面试轮次</label>
          <input
            value={interviewForm.roundName}
            onChange={(event) => onInterviewFormChange({ ...interviewForm, roundName: event.target.value })}
          />
          <label>面试记录</label>
          <textarea
            value={interviewForm.notes}
            onChange={(event) => onInterviewFormChange({ ...interviewForm, notes: event.target.value })}
          />
        </PanelShell>

        <PanelShell eyebrow="Records" title="面试记录列表" subtitle="筛选、改状态、生成复盘都集中在这里。">
          <div className="grid-3 applications-filter-grid">
            <div>
              <label>状态筛选</label>
              <select
                value={interviewFilters.status}
                onChange={(event) => onInterviewFiltersChange({ ...interviewFilters, status: event.target.value })}
              >
                <option value="">全部</option>
                <option value="APPLIED">APPLIED</option>
                <option value="SCREENING">SCREENING</option>
                <option value="TECHNICAL">TECHNICAL</option>
                <option value="FINAL">FINAL</option>
                <option value="OFFER">OFFER</option>
                <option value="REJECTED">REJECTED</option>
                <option value="WITHDRAWN">WITHDRAWN</option>
              </select>
            </div>
            <div>
              <label>公司筛选</label>
              <input
                value={interviewFilters.company}
                onChange={(event) => onInterviewFiltersChange({ ...interviewFilters, company: event.target.value })}
              />
            </div>
            <div>
              <label>岗位筛选</label>
              <input
                value={interviewFilters.role}
                onChange={(event) => onInterviewFiltersChange({ ...interviewFilters, role: event.target.value })}
              />
            </div>
          </div>

          <div className="dashboard-card-list">
            {interviews.length > 0 ? (
              interviews.map((item) => (
                <ResultCard
                  key={item.id}
                  title={`${item.jobPosting.company} · ${item.jobPosting.role}`}
                  subtitle={`轮次 ${item.roundName}`}
                  meta={
                    <>
                      <div className="inline compact-actions">
                        <StatusBadge>{item.status}</StatusBadge>
                        {item.applicationId ? <StatusBadge tone="success">已关联投递</StatusBadge> : null}
                      </div>
                      <div className="small">{item.notes}</div>
                      <div className="small">复盘: {item.summary ?? '未生成'}</div>
                    </>
                  }
                  actions={
                    <>
                      <select value={item.status} onChange={(event) => onUpdateInterviewStatus(item.id, event.target.value as InterviewRecord['status'])}>
                        <option value="APPLIED">APPLIED</option>
                        <option value="SCREENING">SCREENING</option>
                        <option value="TECHNICAL">TECHNICAL</option>
                        <option value="FINAL">FINAL</option>
                        <option value="OFFER">OFFER</option>
                        <option value="REJECTED">REJECTED</option>
                        <option value="WITHDRAWN">WITHDRAWN</option>
                      </select>
                      <button className="ghost button-compact" onClick={() => onGenSummary(item.id)}>
                        生成复盘
                      </button>
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState title="暂无面试记录" description="保存真实面试或模拟面试沉淀后，这里会出现记录。" />
            )}
          </div>
        </PanelShell>
      </div>
    </section>
  );
}
