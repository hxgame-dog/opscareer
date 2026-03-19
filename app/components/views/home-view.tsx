import { EmptyState } from '@/app/components/ui/empty-state';
import { MetricChip } from '@/app/components/ui/metric-chip';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { SearchBar } from '@/app/components/ui/search-bar';
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
    resumeGroupCount === 0 ? '先生成第一份简历，建立版本基线。' : null,
    jdCount === 0 ? '保存目标岗位到 JD 库，后续优化和模拟面试都会复用。' : null,
    applicationCount === 0 ? '从 JD 库创建第一条投递，让整个工作台真正串起来。' : null,
    mockInterviewCount === 0 ? '挑一个目标岗位做一次模拟面试，先拿到第一轮反馈。' : null
  ].filter(Boolean) as string[];

  return (
    <section className="content-stack workspace-stage">
      <PanelShell
        eyebrow="Workspace"
        title="今天从一件最重要的事开始。"
        subtitle="把当前最值得推进的简历、岗位和投递集中在一个更安静的主工作区里。"
        className="home-hero-panel"
      >
        <div className="home-hero-layout">
          <div className="home-hero-copy">
            <div className="home-hero-kicker">Today</div>
            <h2 className="home-hero-title">从简历、岗位到投递，继续往前推进。</h2>
            <p className="home-hero-description">
              这里放你今天真正需要打开的内容，而不是把所有模块平均铺开。
            </p>
            <div className="home-hero-actions">
              <button onClick={onGoResumes}>去做简历</button>
              <button className="secondary" onClick={onGoJobs}>打开 JD 库</button>
              <button className="ghost" onClick={onGoMock}>开始模拟面试</button>
            </div>
          </div>

          <div className="home-hero-side">
            <SearchBar
              label="快速入口"
              value=""
              placeholder="搜索简历、JD、公司或下一步动作"
              onChange={() => {}}
            />

            <div className="home-hero-focus-list">
              {focusItems.length > 0 ? (
                focusItems.slice(0, 2).map((item) => (
                  <div key={item} className="home-hero-focus-item">
                    <strong>下一步</strong>
                    <div className="small">{item}</div>
                  </div>
                ))
              ) : (
                <div className="home-hero-focus-item">
                  <strong>状态良好</strong>
                  <div className="small">基础资料已经齐了，建议继续推进正在进行中的投递。</div>
                </div>
              )}
            </div>

            <div className="home-hero-reminders">
              <strong>即将跟进</strong>
              {upcomingReminders.length > 0 ? (
                upcomingReminders.slice(0, 2).map((item) => (
                  <div key={item.id} className="home-hero-reminder">
                    <div className="small strong">{item.title}</div>
                    <div className="small">
                      {item.company && item.role ? `${item.company} · ${item.role}` : item.detail}
                    </div>
                  </div>
                ))
              ) : (
                <div className="small">当前没有需要立刻跟进的提醒，可以优先推进主任务。</div>
              )}
            </div>
          </div>
        </div>
      </PanelShell>

      <div className="metrics-strip metrics-strip-summary">
        <MetricChip label="Resumes" value={resumeGroupCount} hint="简历组" />
        <MetricChip label="Job Postings" value={jdCount} hint="收藏 JD" />
        <MetricChip label="Applications" value={applicationCount} hint="投递总数" />
        <MetricChip label="In Progress" value={activeApplicationCount} hint="进行中的投递" />
        <MetricChip label="Mock" value={mockInterviewCount} hint="模拟面试" />
        <MetricChip label="Interviews" value={interviewCount} hint="面试记录" />
      </div>

      <PanelShell eyebrow="Focus" title="今日推进" subtitle="保留一块完整的待办视图，但不再让它抢走首屏主舞台。">
        <div className="dashboard-task-stack dashboard-task-stack-compact">
          {focusItems.length > 0 ? (
            focusItems.map((item) => (
              <div key={item} className="dashboard-task-card">
                <strong>下一步</strong>
                <div className="small">{item}</div>
              </div>
            ))
          ) : (
            <EmptyState title="基础资料已经齐了" description="建议优先推进进行中的投递和模拟面试。" />
          )}
        </div>
      </PanelShell>

      <div className="dashboard-results-grid">
        <PanelShell eyebrow="Applications" title="最近投递">
          <div className="dashboard-card-list">
            {recentApplications.length > 0 ? (
              recentApplications.map((application) => (
                <ResultCard
                  key={application.id}
                  title={`${application.company} · ${application.role}`}
                  subtitle={`更新于 ${new Date(application.updatedAt).toLocaleString()}`}
                  meta={
                    <>
                      <StatusBadge>{application.status}</StatusBadge>{' '}
                      <StatusBadge tone="warn">{application.priority}</StatusBadge>
                    </>
                  }
                  onClick={() => onOpenApplication(application.id)}
                />
              ))
            ) : (
              <EmptyState title="暂无投递记录" description="可以从 JD 库创建第一条投递。" />
            )}
          </div>
        </PanelShell>

        <PanelShell eyebrow="Mock Sessions" title="最近模拟面试">
          <div className="dashboard-card-list">
            {recentMockInterviews.length > 0 ? (
              recentMockInterviews.map((session) => (
                <ResultCard
                  key={session.id}
                  title={`${session.company} · ${session.role}`}
                  subtitle={`${session.answeredCount}/${session.questionCount} 题`}
                  meta={
                    <div className="small">
                      {session.status} · {session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'}
                    </div>
                  }
                  onClick={() => onOpenMockInterview(session.id)}
                />
              ))
            ) : (
              <EmptyState title="暂无模拟面试记录" description="选择一个 JD 开始第一次模拟面试。" />
            )}
          </div>
        </PanelShell>

        <PanelShell eyebrow="Interviews" title="最近面试记录">
          <div className="dashboard-card-list">
            {recentInterviews.length > 0 ? (
              recentInterviews.map((item) => (
                <ResultCard
                  key={item.id}
                  title={`${item.jobPosting.company} · ${item.jobPosting.role}`}
                  subtitle={`${item.roundName} · ${item.status}`}
                  meta={<div className="small">{item.summary ?? '还没有生成复盘总结'}</div>}
                />
              ))
            ) : (
              <EmptyState title="暂无面试记录" description="当你保存真实面试后，这里会出现最近记录。" />
            )}
          </div>
        </PanelShell>
      </div>

      <PanelShell eyebrow="Activity" title="最近活动" subtitle="帮助你快速回忆刚刚做了什么。">
        <div className="dashboard-activity-list">
          {logs.length > 0 ? (
            logs.slice(0, 6).map((line) => (
              <div key={line} className="dashboard-activity-item">
                {line}
              </div>
            ))
          ) : (
            <EmptyState title="暂无活动记录" description="开始操作后，最近活动会显示在这里。" />
          )}
        </div>
      </PanelShell>
    </section>
  );
}
