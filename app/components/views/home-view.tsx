import { EmptyState } from '@/app/components/ui/empty-state';
import { ActionBar } from '@/app/components/ui/action-bar';
import { MetricChip } from '@/app/components/ui/metric-chip';
import { PageHeader } from '@/app/components/ui/page-header';
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
      <PageHeader
        eyebrow="Action Home"
        title="今天推进什么"
        description="把最重要的动作集中在一个入口区里，少看噪音，多做推进。"
        accent="indigo"
        meta={
          <>
            <span className="timeline-tag">任务执行台</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <SearchBar
                label="快速入口"
                value=""
                placeholder="搜索简历、JD、公司或下一步动作"
                onChange={() => {}}
              />
            }
            right={
              <div className="inline compact-actions">
                <button onClick={onGoResumes}>去做简历</button>
                <button className="secondary" onClick={onGoJobs}>打开 JD 库</button>
                <button className="ghost" onClick={onGoMock}>开始模拟面试</button>
              </div>
            }
          />
        }
      />

      <div className="metrics-strip">
        <MetricChip label="Resumes" value={resumeGroupCount} hint="简历组" />
        <MetricChip label="Job Postings" value={jdCount} hint="收藏 JD" />
        <MetricChip label="Applications" value={applicationCount} hint="投递总数" />
        <MetricChip label="In Progress" value={activeApplicationCount} hint="进行中的投递" />
        <MetricChip label="Mock" value={mockInterviewCount} hint="模拟面试" />
        <MetricChip label="Interviews" value={interviewCount} hint="面试记录" />
      </div>

      <div className="dashboard-hero-grid">
        <PanelShell
          eyebrow="Focus"
          title="今日优先任务"
          subtitle="把今天最值得推进的事情放在一个明确主区。"
        >
          <div className="dashboard-task-stack">
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

        <PanelShell eyebrow="Reminders" title="即将跟进" subtitle="从投递详情同步过来的提醒和下一步动作。">
          <div className="dashboard-reminder-stack">
            {upcomingReminders.length > 0 ? (
              upcomingReminders.map((item) => (
                <ResultCard
                  key={item.id}
                  title={item.title}
                  subtitle={item.company && item.role ? `${item.company} · ${item.role}` : undefined}
                  meta={
                    <>
                      <div className="small">{item.detail}</div>
                      {item.reminderAt ? (
                        <div className="timeline-tag timeline-tag-warn">
                          提醒 {new Date(item.reminderAt).toLocaleString()}
                        </div>
                      ) : null}
                    </>
                  }
                />
              ))
            ) : (
              <EmptyState title="当前没有明确提醒" description="在投递详情里添加提醒后，这里会自动出现。" />
            )}
          </div>
        </PanelShell>
      </div>

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
