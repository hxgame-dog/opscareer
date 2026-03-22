import { ActionBar } from '@/app/components/ui/action-bar';
import { EmptyState } from '@/app/components/ui/empty-state';
import { FilterRail } from '@/app/components/ui/filter-rail';
import { NextStepPanel } from '@/app/components/ui/next-step-panel';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { SearchBar } from '@/app/components/ui/search-bar';
import { ToolbarTabs } from '@/app/components/ui/toolbar-tabs';
import { applicationStatuses } from '@/lib/applications';
import { getApplicationNextRecommendation } from '@/lib/product-guidance';
import type {
  ApplicationBoardColumn,
  ApplicationCard,
  ApplicationDetail,
  ApplicationPriority,
  ApplicationStatus
} from '@/types/domain';

type ApplicationsViewProps = {
  applicationView: 'board' | 'list';
  applicationFilters: {
    status: string;
    company: string;
    role: string;
    priority: string;
    q: string;
  };
  applicationBoard: ApplicationBoardColumn[];
  applications: ApplicationCard[];
  selectedApplication: ApplicationDetail | null;
  draggingApplicationId: string;
  dragTargetStatus: ApplicationStatus | '';
  onApplicationViewChange: (view: 'board' | 'list') => void;
  onApplicationFiltersChange: (filters: {
    status: string;
    company: string;
    role: string;
    priority: string;
    q: string;
  }) => void;
  onLoadApplications: () => void;
  onOpenApplication: (id: string) => void;
  onGoJobs: () => void;
  onStartMockInterviewWithApplication: (application: ApplicationDetail) => void;
  onUpdateApplication: (id: string, payload: {
    status?: ApplicationStatus;
    priority?: ApplicationPriority;
    resumeId?: string | null;
    notes?: string;
    source?: string | null;
    appliedAt?: string | null;
  }) => void;
  onDeleteApplication: (application: ApplicationCard | ApplicationDetail) => void;
  onMoveApplicationByDrag: (application: ApplicationCard, status: ApplicationStatus) => void;
  onDraggingApplicationIdChange: (value: string) => void;
  onDragTargetStatusChange: (value: ApplicationStatus | '') => void;
};

export function ApplicationsView({
  applicationView,
  applicationFilters,
  applicationBoard,
  applications,
  selectedApplication,
  draggingApplicationId,
  dragTargetStatus,
  onApplicationViewChange,
  onApplicationFiltersChange,
  onLoadApplications,
  onOpenApplication,
  onGoJobs,
  onStartMockInterviewWithApplication,
  onUpdateApplication,
  onDeleteApplication,
  onMoveApplicationByDrag,
  onDraggingApplicationIdChange,
  onDragTargetStatusChange
}: ApplicationsViewProps) {
  const nextRecommendation = getApplicationNextRecommendation({
    hasSelectedApplication: Boolean(selectedApplication),
    status: selectedApplication?.status,
    interviewCount: selectedApplication?.interviews.length
  });

  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Application Pipeline"
        title="按阶段推进每一次投递"
        description="把视图切换、筛选和结果区放在同一个安静的任务平面里，只保留推进真正需要的信息。"
        accent="warn"
        meta={
          <>
            <span className="timeline-tag">Board / List</span>
            <span className="timeline-tag">状态推进</span>
          </>
        }
        actions={
          <ActionBar
            left={
              <ToolbarTabs
                value={applicationView}
                items={[
                  { id: 'board', label: '阶段看板' },
                  { id: 'list', label: '公司 / 岗位' }
                ]}
                onChange={onApplicationViewChange}
              />
            }
            right={<button className="secondary" onClick={onLoadApplications}>刷新视图</button>}
          />
        }
      />

      <NextStepPanel
        title={nextRecommendation.title}
        description={nextRecommendation.description}
        actions={
          selectedApplication ? (
            <div className="next-step-actions">
              {(selectedApplication.status === 'SAVED' || selectedApplication.status === 'READY') ? (
                <button
                  onClick={() =>
                    onUpdateApplication(selectedApplication.id, {
                      status: 'APPLIED',
                      appliedAt: selectedApplication.appliedAt ?? new Date().toISOString()
                    })
                  }
                >
                  标记已投递
                </button>
              ) : null}
              {(selectedApplication.status === 'APPLIED' ||
                selectedApplication.status === 'SCREENING' ||
                selectedApplication.status === 'INTERVIEWING') ? (
                <button className="secondary" onClick={() => onStartMockInterviewWithApplication(selectedApplication)}>
                  模拟面试
                </button>
              ) : null}
              <button className="ghost" onClick={() => onOpenApplication(selectedApplication.id)}>
                打开详情
              </button>
              {(selectedApplication.status === 'OFFER' ||
                selectedApplication.status === 'REJECTED' ||
                selectedApplication.status === 'WITHDRAWN') ? (
                <button className="secondary" onClick={onGoJobs}>
                  回到岗位库
                </button>
              ) : null}
            </div>
          ) : null
        }
        tags={
          selectedApplication
            ? [
                `${selectedApplication.company} · ${selectedApplication.role}`,
                selectedApplication.status,
                `面试 ${selectedApplication.interviews.length} 轮`
              ]
            : ['请选择一条投递', '选中后出现推荐动作']
        }
      />

      <div className="applications-stage-layout">
        <FilterRail title="筛选条件">
          <div className="applications-filter-stack">
            <div>
              <label>状态</label>
              <select value={applicationFilters.status} onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, status: e.target.value })}>
                <option value="">全部</option>
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>公司</label>
              <input value={applicationFilters.company} onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, company: e.target.value })} />
            </div>
            <div>
              <label>岗位</label>
              <input value={applicationFilters.role} onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, role: e.target.value })} />
            </div>
            <div>
              <label>优先级</label>
              <select value={applicationFilters.priority} onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, priority: e.target.value })}>
                <option value="">全部</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>
            <SearchBar label="关键词" value={applicationFilters.q} placeholder="公司、岗位、备注" onChange={(value) => onApplicationFiltersChange({ ...applicationFilters, q: value })} />
            <button onClick={onLoadApplications}>应用筛选</button>
          </div>
        </FilterRail>

        <PanelShell
          eyebrow="Results"
          title={applicationView === 'board' ? '阶段看板' : '公司 / 岗位列表'}
          subtitle={selectedApplication ? `当前打开 ${selectedApplication.company} · ${selectedApplication.role}` : '从这里选择一个投递进入右侧详情'}
          className="applications-results-panel"
        >
          {applicationView === 'board' ? (
            <div className="board-scroll">
              <div className="board-grid applications-board-grid">
                {applicationBoard.map((column) => (
                  <div
                    key={column.status}
                    className={`board-column applications-board-column ${dragTargetStatus === column.status ? 'board-column-active' : ''}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                      if (draggingApplicationId) onDragTargetStatusChange(column.status);
                    }}
                    onDrop={(event) => {
                      event.preventDefault();
                      const applicationId = event.dataTransfer.getData('text/plain');
                      const application = applicationBoard.flatMap((item) => item.items).find((item) => item.id === applicationId);
                      if (application) onMoveApplicationByDrag(application, column.status);
                    }}
                  >
                    <div className="board-header">
                      <strong>{column.status}</strong>
                      <span className="small">{column.items.length}</span>
                    </div>
                    <div className="dashboard-card-list">
                      {column.items.length > 0 ? (
                        column.items.map((application) => (
                          <div
                            key={application.id}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData('text/plain', application.id);
                              onDraggingApplicationIdChange(application.id);
                            }}
                            onDragEnd={() => {
                              onDraggingApplicationIdChange('');
                              onDragTargetStatusChange('');
                            }}
                          >
                            <ResultCard
                              title={`${application.company} · ${application.role}`}
                              subtitle={application.resumeLabel ?? '未绑定简历'}
                              meta={
                                <>
                                  <div className="small">{application.priority} · 面试 {application.interviewCount} 轮</div>
                                  <div className="small">更新于 {new Date(application.updatedAt).toLocaleDateString()}</div>
                                </>
                              }
                              active={selectedApplication?.id === application.id}
                              onClick={() => onOpenApplication(application.id)}
                              actions={
                                <select
                                  value={application.status}
                                  onChange={(e) =>
                                    onUpdateApplication(application.id, {
                                      status: e.target.value as ApplicationStatus,
                                      appliedAt: e.target.value === 'APPLIED' ? new Date().toISOString() : undefined
                                    })
                                  }
                                >
                                  {applicationStatuses.map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>
                              }
                            />
                          </div>
                        ))
                      ) : (
                        <div className="item small">暂无投递</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="dashboard-card-list">
              {applications.length > 0 ? (
                applications.map((application) => (
                  <ResultCard
                    key={application.id}
                    title={`${application.company} · ${application.role}`}
                    subtitle={`${application.status} · ${application.priority}`}
                    meta={
                      <div className="small">
                        {application.resumeLabel ?? '未绑定简历'} · 面试 {application.interviewCount} 轮 · 更新于{' '}
                        {new Date(application.updatedAt).toLocaleDateString()}
                      </div>
                    }
                    active={selectedApplication?.id === application.id}
                    onClick={() => onOpenApplication(application.id)}
                    actions={
                      <div className="inline compact-actions">
                        <button className="secondary button-compact" onClick={() => onOpenApplication(application.id)}>
                          打开详情
                        </button>
                        <button className="danger button-compact" onClick={() => onDeleteApplication(application)}>
                          删除
                        </button>
                      </div>
                    }
                  />
                ))
              ) : (
                <EmptyState title="暂无投递记录" description="从 JD 库创建投递后，这里会形成你的投递漏斗。" />
              )}
            </div>
          )}
        </PanelShell>
      </div>
    </section>
  );
}
