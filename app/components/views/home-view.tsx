import { EmptyState } from '@/app/components/ui/empty-state';
import { MetricChip } from '@/app/components/ui/metric-chip';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { StatusBadge } from '@/app/components/ui/status-badge';
import { getHomePrimaryTask } from '@/lib/product-guidance';
import type { DashboardSummary } from '@/types/domain';

type HomeViewProps = {
  dashboard: DashboardSummary;
  logs: string[];
  onGoResumes: () => void;
  onGoJobs: () => void;
  onGoMock: () => void;
  onOpenApplication: (id: string) => void;
  onOpenMockInterview: (id: string) => void;
};

const stageLabels: Record<string, string> = {
  SAVED: '待准备',
  READY: '可投递',
  APPLIED: '已投递',
  SCREENING: '筛选中',
  INTERVIEWING: '面试中',
  OFFER: 'Offer',
  REJECTED: '未通过',
  WITHDRAWN: '已撤回'
};

const priorityLabels: Record<string, string> = {
  HIGH: '高优先级',
  MEDIUM: '中优先级',
  LOW: '低优先级'
};

export function HomeView({ dashboard, logs, onGoResumes, onGoJobs, onGoMock, onOpenApplication, onOpenMockInterview }: HomeViewProps) {
  const primaryTask = getHomePrimaryTask({
    resumeGroupCount: dashboard.counts.resumes,
    jdCount: dashboard.counts.jobs,
    applicationCount: dashboard.counts.applications,
    activeApplicationCount: dashboard.counts.activeApplications,
    mockInterviewCount: dashboard.counts.mockInterviews,
    recentApplications: dashboard.recentApplications.map((item) => ({ id: item.id, company: item.company, role: item.role })),
    recentMockInterviews: dashboard.recentMockInterviews.map((item) => ({ id: item.id, company: item.company, role: item.role }))
  });

  const focusItems = [
    dashboard.counts.resumes === 0 ? '先整理主档并生成第一版简历。' : null,
    dashboard.counts.jobs === 0 ? '至少收藏 3 条目标 JD，后续优化和训练会更顺。' : null,
    dashboard.counts.applications === 0 ? '从岗位库创建第一条投递，形成真正的求职流程闭环。' : null,
    dashboard.reminders[0]
      ? `优先处理提醒：${dashboard.reminders[0].company} · ${dashboard.reminders[0].role}。`
      : dashboard.counts.activeApplications > 0
        ? '挑一条进行中的投递补上下一步动作和提醒。'
        : null,
    dashboard.counts.mockInterviews === 0 ? '用一个目标 JD 开始第一次模拟面试。' : null
  ].filter(Boolean) as string[];

  const handlePrimaryTask = () => {
    if (primaryTask.action === 'resumes') return onGoResumes();
    if (primaryTask.action === 'jobs') return onGoJobs();
    if (primaryTask.action === 'mock') return onGoMock();
    if (primaryTask.action === 'application') return onOpenApplication(primaryTask.targetId);
    if (primaryTask.action === 'mock-session') return onOpenMockInterview(primaryTask.targetId);
  };

  return (
    <section className="content-stack workspace-stage">
      <PanelShell
        eyebrow="Dashboard"
        title="今天先把最重要的一步推进掉。"
        subtitle="工作台把简历、岗位、投递和面试放到一个入口里，方便你快速回到主线。"
        className="home-hero-panel"
      >
        <div className="home-hero-layout">
          <div className="home-hero-copy">
            <div className="home-hero-kicker">Main Focus</div>
            <h2 className="home-hero-title">{primaryTask.title}</h2>
            <p className="home-hero-description">{primaryTask.description}</p>
            <div className="home-hero-actions">
              <button onClick={handlePrimaryTask}>开始这一步</button>
              <button className="secondary" onClick={onGoResumes}>简历中心</button>
              <button className="ghost" onClick={onGoJobs}>岗位库</button>
            </div>
          </div>

          <div className="home-hero-side">
            <div className="home-hero-focus-list">
              {focusItems.length > 0 ? (
                focusItems.slice(0, 3).map((item) => (
                  <div key={item} className="home-hero-focus-item">
                    <strong>下一步</strong>
                    <div className="small">{item}</div>
                  </div>
                ))
              ) : (
                <div className="home-hero-focus-item">
                  <strong>状态良好</strong>
                  <div className="small">基础资料已经齐了，建议继续推进进行中的投递或模拟面试。</div>
                </div>
              )}
            </div>

            <div className="home-hero-reminders">
              <strong>即将跟进</strong>
              {dashboard.reminders.length > 0 ? (
                dashboard.reminders.slice(0, 3).map((item) => (
                  <button key={item.id} className="home-hero-reminder home-hero-reminder-button" onClick={() => onOpenApplication(item.applicationId)}>
                    <div className="small strong">{item.title}</div>
                    <div className="small">{item.company} · {item.role}</div>
                    <div className="small">{item.reminderAt ? new Date(item.reminderAt).toLocaleString() : item.detail}</div>
                  </button>
                ))
              ) : (
                <div className="small">当前没有提醒事项，可以优先把目标岗位推进成投递。</div>
              )}
            </div>
          </div>
        </div>
      </PanelShell>

      <div className="metrics-strip metrics-strip-summary">
        <MetricChip label="Resumes" value={dashboard.counts.resumes} hint="简历组" />
        <MetricChip label="Jobs" value={dashboard.counts.jobs} hint="收藏 JD" />
        <MetricChip label="Applications" value={dashboard.counts.applications} hint="投递总数" />
        <MetricChip label="In Progress" value={dashboard.counts.activeApplications} hint="进行中的投递" />
        <MetricChip label="Mock" value={dashboard.counts.mockInterviews} hint="模拟面试" />
        <MetricChip label="Interviews" value={dashboard.counts.interviews} hint="面试记录" />
      </div>

      <div className="dashboard-results-grid">
        <PanelShell eyebrow="Pipeline" title="投递阶段分布" subtitle="快速判断当前重心应该放在哪个阶段。">
          <div className="dashboard-task-stack dashboard-task-stack-compact">
            {dashboard.stageCounts.filter((item) => item.count > 0).length > 0 ? (
              dashboard.stageCounts.filter((item) => item.count > 0).map((item) => (
                <div key={item.status} className="dashboard-task-card">
                  <strong>{stageLabels[item.status] ?? item.status}</strong>
                  <div className="small">{item.count} 条</div>
                </div>
              ))
            ) : (
              <EmptyState title="暂无投递阶段数据" description="从岗位库创建第一条投递后，这里会出现阶段分布。" />
            )}
          </div>
        </PanelShell>

        <PanelShell eyebrow="Priority" title="优先级盘点" subtitle="先把高优先级机会推进掉，避免注意力分散。">
          <div className="dashboard-task-stack dashboard-task-stack-compact">
            {dashboard.priorityCounts.map((item) => (
              <div key={item.priority} className="dashboard-task-card">
                <strong>{priorityLabels[item.priority] ?? item.priority}</strong>
                <div className="small">{item.count} 条</div>
              </div>
            ))}
          </div>
        </PanelShell>
      </div>

      <div className="dashboard-results-grid">
        <PanelShell eyebrow="Applications" title="最近投递">
          <div className="dashboard-card-list">
            {dashboard.recentApplications.length > 0 ? (
              dashboard.recentApplications.map((application) => (
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

        <PanelShell eyebrow="Job Library" title="最近岗位">
          <div className="dashboard-card-list">
            {dashboard.recentJobs.length > 0 ? (
              dashboard.recentJobs.map((job) => (
                <ResultCard
                  key={job.id}
                  title={`${job.company} · ${job.role}`}
                  subtitle={`更新于 ${new Date(job.updatedAt).toLocaleString()}`}
                  meta={<div className="small">{job.language === 'zh-CN' ? '中文' : 'English'} · {job.saved ? '已收藏' : '未收藏'}</div>}
                  onClick={onGoJobs}
                />
              ))
            ) : (
              <EmptyState title="岗位库还是空的" description="先保存几个目标 JD，后面所有动作都会更顺。" />
            )}
          </div>
        </PanelShell>

        <PanelShell eyebrow="Mock Sessions" title="最近模拟面试">
          <div className="dashboard-card-list">
            {dashboard.recentMockInterviews.length > 0 ? (
              dashboard.recentMockInterviews.map((session) => (
                <ResultCard
                  key={session.id}
                  title={`${session.company} · ${session.role}`}
                  subtitle={`${session.answeredCount}/${session.questionCount} 题`}
                  meta={<div className="small">{session.status} · {session.overallScore !== null ? `总分 ${session.overallScore}` : '尚未完成'}</div>}
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
            {dashboard.recentInterviews.length > 0 ? (
              dashboard.recentInterviews.map((item) => (
                <ResultCard
                  key={item.id}
                  title={`${item.jobPosting.company} · ${item.jobPosting.role}`}
                  subtitle={`${item.roundName} · ${item.status}`}
                  meta={<div className="small">{item.summary ?? (item.scheduledAt ? `安排在 ${new Date(item.scheduledAt).toLocaleString()}` : '还没有生成复盘总结')}</div>}
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
              <div key={line} className="dashboard-activity-item">{line}</div>
            ))
          ) : (
            <EmptyState title="暂无活动记录" description="开始操作后，最近活动会显示在这里。" />
          )}
        </div>
      </PanelShell>
    </section>
  );
}
