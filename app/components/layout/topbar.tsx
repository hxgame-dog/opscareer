import { getWorkspaceViewChrome } from '@/lib/workspace-ui';

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
  const chrome = getWorkspaceViewChrome(activeView);

  return (
    <section className="workspace-topbar">
      <div className="topbar-headline">
        <div className="topbar-actions-row">
          <button className="ghost sidebar-toggle topbar-utility" onClick={onToggleSidebar}>
            菜单
          </button>
          <span className={`topbar-chip topbar-chip-${chrome.accent}`}>{chrome.secondaryLabel}</span>
          <button className="ghost context-toggle topbar-utility" onClick={onToggleContext}>
            {contextOpen ? '收起右栏' : '展开上下文'}
          </button>
        </div>
        <p className="eyebrow topbar-eyebrow">{chrome.eyebrow}</p>
        <h1>{viewMeta[activeView].title}</h1>
        <p className="small topbar-description">{viewMeta[activeView].description}</p>
      </div>
      <div className="topbar-right">
        <span className={`topbar-primary topbar-primary-${chrome.accent}`}>
          {chrome.primaryActionLabel}
        </span>
        <div className="identity-card notion-card">
          <div className="identity-avatar">{user.name.slice(0, 1) || 'U'}</div>
          <div className="identity-copy">
            <div className="identity-name">{user.name}</div>
            <div className="small">{user.email}</div>
          </div>
          <button className="secondary topbar-logout" onClick={onLogout}>
            退出
          </button>
        </div>
      </div>
    </section>
  );
}
