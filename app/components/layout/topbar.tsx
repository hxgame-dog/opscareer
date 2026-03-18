type WorkspaceView =
  | 'home'
  | 'profile'
  | 'resumes'
  | 'jobs'
  | 'mock'
  | 'applications'
  | 'interviews'
  | 'settings';

type TopbarProps = {
  activeView: WorkspaceView;
  viewMeta: Record<WorkspaceView, { title: string; description: string }>;
  user: {
    name: string;
    email: string;
  };
  onToggleSidebar: () => void;
  contextOpen: boolean;
  onToggleContext: () => void;
  onLogout: () => void;
};

export function Topbar({
  activeView,
  viewMeta,
  user,
  onToggleSidebar,
  contextOpen,
  onToggleContext,
  onLogout
}: TopbarProps) {
  return (
    <section className="workspace-topbar">
      <div>
        <div className="topbar-actions-row">
          <button className="ghost sidebar-toggle" onClick={onToggleSidebar}>
            菜单
          </button>
          <button className="ghost context-toggle" onClick={onToggleContext}>
            {contextOpen ? '收起右栏' : '展开右栏'}
          </button>
        </div>
        <p className="eyebrow">Notion-style workspace</p>
        <h1>{viewMeta[activeView].title}</h1>
        <p className="small">{viewMeta[activeView].description}</p>
      </div>
      <div className="identity-card notion-card">
        <div className="identity-name">{user.name}</div>
        <div className="small">{user.email}</div>
        <button className="secondary" onClick={onLogout}>
          退出登录
        </button>
      </div>
    </section>
  );
}
