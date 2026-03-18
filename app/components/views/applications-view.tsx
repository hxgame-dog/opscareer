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
    <section className="content-stack">
      <article className="panel panel-tight">
        <div className="database-header database-header-compact">
          <div>
            <div className="eyebrow">Applications</div>
            <h2>投递视图</h2>
          </div>
          <div className="tool-tabs applications-view-tabs">
            <button
              type="button"
              className={`tool-tab ${applicationView === 'board' ? 'tool-tab-active' : ''}`}
              onClick={() => onApplicationViewChange('board')}
            >
              阶段看板
            </button>
            <button
              type="button"
              className={`tool-tab ${applicationView === 'list' ? 'tool-tab-active' : ''}`}
              onClick={() => onApplicationViewChange('list')}
            >
              公司/岗位视图
            </button>
          </div>
        </div>
        <div className="grid-5 applications-filter-grid">
          <div>
            <label>状态</label>
            <select
              value={applicationFilters.status}
              onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, status: e.target.value })}
            >
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
            <input
              value={applicationFilters.company}
              onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, company: e.target.value })}
            />
          </div>
          <div>
            <label>岗位</label>
            <input
              value={applicationFilters.role}
              onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, role: e.target.value })}
            />
          </div>
          <div>
            <label>优先级</label>
            <select
              value={applicationFilters.priority}
              onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, priority: e.target.value })}
            >
              <option value="">全部</option>
              <option value="LOW">LOW</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="HIGH">HIGH</option>
            </select>
          </div>
          <div>
            <label>关键词</label>
            <input value={applicationFilters.q} onChange={(e) => onApplicationFiltersChange({ ...applicationFilters, q: e.target.value })} />
          </div>
        </div>
        <button className="secondary button-compact" onClick={onLoadApplications}>
          应用筛选
        </button>

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
                  onDragLeave={() => onDragTargetStatusChange(dragTargetStatus === column.status ? '' : dragTargetStatus)}
                  onDrop={(event) => {
                    event.preventDefault();
                    const applicationId = event.dataTransfer.getData('text/plain');
                    const application = applicationBoard.flatMap((item) => item.items).find((item) => item.id === applicationId);
                    if (application) {
                      onMoveApplicationByDrag(application, column.status);
                    } else {
                      onDraggingApplicationIdChange('');
                      onDragTargetStatusChange('');
                    }
                  }}
                >
                  <div className="board-header">
                    <strong>{column.status}</strong>
                    <span className="small">{column.items.length}</span>
                  </div>
                  <div className="list">
                    {column.items.map((application) => (
                      <div
                        key={application.id}
                        className={`item board-card applications-board-card ${draggingApplicationId === application.id ? 'board-card-dragging' : ''}`}
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', application.id);
                          event.dataTransfer.effectAllowed = 'move';
                          onDraggingApplicationIdChange(application.id);
                        }}
                        onDragEnd={() => {
                          onDraggingApplicationIdChange('');
                          onDragTargetStatusChange('');
                        }}
                      >
                        <strong>
                          {application.company} · {application.role}
                        </strong>
                        <div className="small applications-card-meta">
                          {application.priority} · {application.resumeLabel ?? '未绑定简历'}
                        </div>
                        <div className="small applications-card-meta applications-card-meta-secondary">
                          面试 {application.interviewCount} 轮 · 更新于 {new Date(application.updatedAt).toLocaleDateString()}
                        </div>
                        <div className="inline compact-actions applications-card-actions">
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
                          <button className="secondary button-compact" onClick={() => onOpenApplication(application.id)}>
                            详情
                          </button>
                        </div>
                      </div>
                    ))}
                    {column.items.length === 0 ? <div className="item small">暂无投递</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="list applications-list" style={{ marginTop: 12 }}>
            {applications.map((application) => (
              <div key={application.id} className="item application-list-card">
                <div className="application-list-main">
                  <strong>
                    {application.company} · {application.role}
                  </strong>
                  <div className="small">
                    {application.status} · {application.priority} · {application.resumeLabel ?? '未绑定简历'}
                  </div>
                  <div className="small applications-card-meta-secondary">
                    面试 {application.interviewCount} 轮 · 更新于 {new Date(application.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="inline compact-actions application-list-actions">
                  <button className="secondary button-compact" onClick={() => onOpenApplication(application.id)}>
                    打开详情
                  </button>
                  <button className="danger button-compact" onClick={() => onDeleteApplication(application)}>
                    删除投递
                  </button>
                </div>
              </div>
            ))}
            {applications.length === 0 ? <div className="item small">暂无投递记录</div> : null}
          </div>
        )}
      </article>

      {selectedApplication ? (
        <div className="item small applications-side-note">
          已在右侧打开投递详情。你可以在那里编辑状态、维护时间线和创建面试。
        </div>
      ) : null}
    </section>
  );
}
