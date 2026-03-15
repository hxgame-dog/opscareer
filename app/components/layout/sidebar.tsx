type WorkspaceView =
  | 'home'
  | 'profile'
  | 'resumes'
  | 'jobs'
  | 'mock'
  | 'applications'
  | 'interviews'
  | 'settings';

type SidebarProps = {
  activeView: WorkspaceView;
  sidebarOpen: boolean;
  navigation: ReadonlyArray<{ id: WorkspaceView; label: string; hint: string }>;
  user: {
    name: string;
    email: string;
  };
  onSelect: (view: WorkspaceView) => void;
};

export function Sidebar({ activeView, sidebarOpen, navigation, user, onSelect }: SidebarProps) {
  return (
    <aside className={`workspace-sidebar ${sidebarOpen ? 'workspace-sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="eyebrow">OpsCareer</div>
        <strong>AI Workspace</strong>
      </div>
      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeView === item.id ? 'sidebar-link-active' : ''}`}
            onClick={() => onSelect(item.id)}
          >
            <span>{item.label}</span>
            <span className="small">{item.hint}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="small">{user.name}</div>
        <div className="small">{user.email}</div>
      </div>
    </aside>
  );
}
