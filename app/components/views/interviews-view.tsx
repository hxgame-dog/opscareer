import { EmptyState } from '@/app/components/ui/empty-state';
import { SectionHeader } from '@/app/components/ui/section-header';

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
  return (
    <section className="content-stack">
      <div className="interviews-layout">
        <article className="panel panel-tight interviews-form-panel">
          <SectionHeader eyebrow="Interview Tracker" title="记录面试" />
          <label>Application ID</label>
          <input
            value={interviewForm.applicationId}
            onChange={(e) => onInterviewFormChange({ ...interviewForm, applicationId: e.target.value })}
          />
          <label>Job Posting ID</label>
          <input
            value={interviewForm.jobPostingId}
            onChange={(e) => onInterviewFormChange({ ...interviewForm, jobPostingId: e.target.value })}
          />
          <label>面试轮次</label>
          <input value={interviewForm.roundName} onChange={(e) => onInterviewFormChange({ ...interviewForm, roundName: e.target.value })} />
          <label>面试记录</label>
          <textarea value={interviewForm.notes} onChange={(e) => onInterviewFormChange({ ...interviewForm, notes: e.target.value })} />
          <div className="inline compact-actions">
            <button className="button-compact" onClick={onCreateInterview} disabled={isCreatingInterview}>
              {isCreatingInterview ? '保存中...' : '保存记录'}
            </button>
            <button className="secondary button-compact" onClick={onLoadInterviews}>
              刷新列表
            </button>
          </div>
        </article>

        <article className="panel panel-tight interviews-list-panel">
          <SectionHeader eyebrow="Records" title="面试记录列表" />
          <div className="grid-3">
            <div>
              <label>状态筛选</label>
              <select
                value={interviewFilters.status}
                onChange={(e) => onInterviewFiltersChange({ ...interviewFilters, status: e.target.value })}
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
                onChange={(e) => onInterviewFiltersChange({ ...interviewFilters, company: e.target.value })}
              />
            </div>
            <div>
              <label>岗位筛选</label>
              <input
                value={interviewFilters.role}
                onChange={(e) => onInterviewFiltersChange({ ...interviewFilters, role: e.target.value })}
              />
            </div>
          </div>
          <button className="secondary button-compact" onClick={onLoadInterviews}>
            应用筛选
          </button>
          <div className="list" style={{ marginTop: 10 }}>
            {interviews.map((item) => (
              <div className="item" key={item.id}>
                <div>
                  <strong>{item.jobPosting.company}</strong> · {item.jobPosting.role}
                </div>
                <div className="small">轮次: {item.roundName} | 状态: {item.status}</div>
                <div>{item.notes}</div>
                <div className="small">总结: {item.summary ?? '未生成'}</div>
                <div className="inline compact-actions">
                  <select value={item.status} onChange={(e) => onUpdateInterviewStatus(item.id, e.target.value as InterviewRecord['status'])}>
                    <option value="APPLIED">APPLIED</option>
                    <option value="SCREENING">SCREENING</option>
                    <option value="TECHNICAL">TECHNICAL</option>
                    <option value="FINAL">FINAL</option>
                    <option value="OFFER">OFFER</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="WITHDRAWN">WITHDRAWN</option>
                  </select>
                  <button className="warn button-compact" onClick={() => onGenSummary(item.id)}>
                    生成复盘
                  </button>
                </div>
              </div>
            ))}
            {interviews.length === 0 ? <EmptyState title="暂无面试记录" description="保存真实面试或模拟面试沉淀后，这里会出现记录。" /> : null}
          </div>
        </article>
      </div>
    </section>
  );
}
