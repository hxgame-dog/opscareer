import { ActionBar } from '@/app/components/ui/action-bar';
import { EmptyState } from '@/app/components/ui/empty-state';
import { FilterRail } from '@/app/components/ui/filter-rail';
import { PageHeader } from '@/app/components/ui/page-header';
import { PanelShell } from '@/app/components/ui/panel-shell';
import { ResultCard } from '@/app/components/ui/result-card';
import { SearchBar } from '@/app/components/ui/search-bar';
import { ToolbarTabs } from '@/app/components/ui/toolbar-tabs';
import { applicationStatuses } from '@/lib/applications';
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
  onUpdateApplication,
  onDeleteApplication,
  onMoveApplicationByDrag,
  onDraggingApplicationIdChange,
  onDragTargetStatusChange
}: ApplicationsViewProps) {
  return (
    <section className="content-stack workspace-stage">
      <PageHeader
        eyebrow="Pipeline Board"
        title="按阶段推进每一次投递"
        description="把视图切换、筛选和结果区放在同一个任务平面上，专注推进，而不是被信息拖住。"
        accent="amber"
        meta={
          <>
            <span className="timeline-tag">Board / List</span>
            <span className="timeline-tag">状态推进</span>
            <span className="timeline-tag">右侧详情</span>
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
