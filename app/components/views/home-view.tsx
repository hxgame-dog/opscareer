import { EmptyState } from '@/app/components/ui/empty-state';
import { SectionHeader } from '@/app/components/ui/section-header';
import { StatusBadge } from '@/app/components/ui/status-badge';

type ApplicationCard = {
  id: string;
  status: string;
  priority: string;
  updatedAt: string;
  company: string;
  role: string;
};

type MockInterviewListItem = {
  id: string;
  status: string;
  company: string;
  role: string;
  answeredCount: number;
  questionCount: number;
  overallScore: number | null;
  updatedAt: string;
};

type InterviewRecord = {
  id: string;
  roundName: string;
  status: string;
  summary: string | null;
  jobPosting: {
    company: string;
    role: string;
  };
};

type ReminderItem = {
  id: string;
  title: string;
  detail: string;
  reminderAt: string | null;
  company?: string;
  role?: string;
};

type HomeViewProps = {
  resumeGroupCount: number;
  jdCount: number;
  applicationCount: number;
  activeApplicationCount: number;
  mockInterviewCount: number;
  interviewCount: number;
  upcomingReminders: ReminderItem[];
  logs: string[];
  recentApplications: ApplicationCard[];
  recentMockInterviews: MockInterviewListItem[];
  recentInterviews: InterviewRecord[];
  onGoResumes: () => void;
  onGoJobs: () => void;
  onGoMock: () => void;
  onOpenApplication: (id: string) => void;
  onOpenMockInterview: (id: string) => void;
};

export function HomeView({
  resumeGroupCount,
  jdCount,
  applicationCount,
  activeApplicationCount,
  mockInterviewCount,
  interviewCount,
  upcomingReminders,
  logs,
  recentApplications,
  recentMockInterviews,
  recentInterviews,
  onGoResumes,
  onGoJobs,
  onGoMock,
  onOpenApplication,
  onOpenMockInterview
}: HomeViewProps) {
  const focusItems = [
    resumeGroupCount === 0 ? '先生成第一份简历，建立你的版本基线。' : null,
    jdCount === 0 ? '把正在投递的岗位保存进 JD 库，后续优化会轻松很多。' : null,
    applicationCount === 0 ? '从 JD 库创建第一条投递，工作台才能真正串起来。' : null,
    mockInterviewCount === 0 ? '挑一个目标岗位做一次模拟面试，尽快拿到首轮反馈。' : null
  ].filter(Boolean) as string[];

  return (
    <section className="content-stack">
      <div className="dashboard-kpi-grid">
        <article className="panel metric-panel">
          <div className="eyebrow">Resumes</div>
          <strong>{resumeGroupCount}</strong>
          <span className="small">简历组</span>
        </article>
        <article className="panel metric-panel">
          <div className="eyebrow">Job Postings</div>
          <strong>{jdCount}</strong>
          <span className="small">收藏 JD</span>
        </article>
        <article className="panel metric-panel">
          <div className="eyebrow">Applications</div>
          <strong>{applicationCount}</strong>
          <span className="small">投递总数</span>
        </article>
        <article className="panel metric-panel">
          <div className="eyebrow">In Progress</div>
          <strong>{activeApplicationCount}</strong>
          <span className="small">进行中的投递</span>
        </article>
        <article className="panel metric-panel">
          <div className="eyebrow">Mock</div>
          <strong>{mockInterviewCount}</strong>
          <span className="small">模拟面试</span>
        </article>
        <article className="panel metric-panel">
          <div className="eyebrow">Interviews</div>
          <strong>{interviewCount}</strong>
          <span className="small">面试记录</span>
        </article>
      </div>

      <div className="dashboard-top-grid">
        <article className="panel">
          <SectionHeader eyebrow="Focus" title="今天优先做什么" />
          <div className="list">
            {focusItems.length > 0 ? (
              focusItems.map((item) => (
                <div key={item} className="item small">
                  {item}
                </div>
              ))
            ) : (
              <EmptyState title="基础资料已经齐了" description="建议优先推进进行中的投递和模拟面试。" />
            )}
          </div>
          <div className="inline" style={{ marginTop: 12 }}>
            <button onClick={onGoResumes}>去做简历</button>
            <button className="secondary" onClick={onGoJobs}>打开 JD 库</button>
            <button className="ghost" onClick={onGoMock}>开始模拟面试</button>
          </div>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Reminders" title="待跟进事项" />
          <div className="list">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((item) => (
                <div key={item.id} className="item">
                  <strong>{item.title}</strong>
                  <div className="small">{item.detail}</div>
                  {item.company && item.role ? <div className="small">{item.company} · {item.role}</div> : null}
                  {item.reminderAt ? <div className="timeline-tag timeline-tag-warn">提醒: {new Date(item.reminderAt).toLocaleString()}</div> : null}
                </div>
              ))
            ) : (
              <EmptyState title="当前没有明确提醒" description="打开某条投递，在右侧上下文里添加跟进提醒会显示在这里。" />
            )}
          </div>
        </article>
      </div>

      <div className="dashboard-bottom-grid">
        <article className="panel">
          <SectionHeader eyebrow="Applications" title="最近投递" />
          <div className="list">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <button key={application.id} className="item card-button" onClick={() => onOpenApplication(application.id)}>
                  <strong>{application.company} · {application.role}</strong>
                  <div className="small">
                    <StatusBadge>{application.status}</StatusBadge> <StatusBadge tone="warn">{application.priority}</StatusBadge>{' '}
                    最近更新 {new Date(application.updatedAt).toLocaleString()}
                  </div>
                </button>
              ))
            ) : (
              <EmptyState title="暂无投递记录" description="可以从 JD 库创建第一条投递。" />
            )}
          </div>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Mock Sessions" title="最近模拟面试" />
          <div className="list">
            {recentMockInterviews.length > 0 ? (
              recentMockInterviews.map((session) => (
                <button key={session.id} className="item card-button" onClick={() => onOpenMockInterview(session.id)}>
                  <strong>{session.company} · {session.role}</strong>
                  <div className="small">{session.status} · {session.answeredCount}/{session.questionCount} 题 · {session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'}</div>
                </button>
              ))
            ) : (
              <EmptyState title="暂无模拟面试记录" description="选择一个 JD 开始第一次模拟面试。" />
            )}
          </div>
        </article>

        <article className="panel">
          <SectionHeader eyebrow="Interviews" title="最近面试记录" />
          <div className="list">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((item) => (
                <div key={item.id} className="item">
                  <strong>{item.jobPosting.company} · {item.jobPosting.role}</strong>
                  <div className="small">{item.roundName} · {item.status}</div>
                  <div className="small">{item.summary ?? '还没有生成复盘总结'}</div>
                </div>
              ))
            ) : (
              <EmptyState title="暂无面试记录" description="当你保存真实面试后，这里会出现最近记录。" />
            )}
          </div>
        </article>
      </div>

      <article className="panel">
        <SectionHeader eyebrow="Activity" title="最近活动" />
        <div className="list">
          {logs.length > 0 ? logs.slice(0, 6).map((line) => <div key={line} className="item small">{line}</div>) : <EmptyState title="暂无活动记录" description="开始操作后，最近活动会显示在这里。" />}
        </div>
      </article>
    </section>
  );
}
