import type { WorkspaceNavigationItem, WorkspaceView } from '@/lib/workspace-ui';

type SidebarProps = {
  activeView: WorkspaceView;
  sidebarOpen: boolean;
  navigation: ReadonlyArray<WorkspaceNavigationItem>;
  user: {
    name: string;
    email: string;
  };
  onSelect: (view: WorkspaceView) => void;
};

function SidebarIcon({ icon }: { icon: WorkspaceNavigationItem['icon'] }) {
  const commonProps = {
    width: 16,
    height: 16,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const
  };

  switch (icon) {
    case 'home':
      return (
        <svg {...commonProps}>
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V20h14V9.5" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'resume':
      return (
        <svg {...commonProps}>
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
          <path d="M10 12h6M10 16h6" />
        </svg>
      );
    case 'job':
      return (
        <svg {...commonProps}>
          <path d="M4 8h16v11H4z" />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          <path d="M4 12h16" />
        </svg>
      );
    case 'mock':
      return (
        <svg {...commonProps}>
          <rect x="8" y="3.5" width="8" height="12" rx="4" />
          <path d="M6 11.5a6 6 0 0 0 12 0" />
          <path d="M12 17.5V21" />
        </svg>
      );
    case 'application':
      return (
        <svg {...commonProps}>
          <path d="M4 6h16v12H4z" />
          <path d="m8 10 3 3 5-5" />
        </svg>
      );
    case 'interview':
      return (
        <svg {...commonProps}>
          <path d="M5 6h14v9H9l-4 4z" />
          <path d="M9 10h6" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.3.7a7.7 7.7 0 0 0-1.7-1L14.5 3h-5L9 5.7a7.7 7.7 0 0 0-1.7 1L5 6 3 9.5 5.1 11a7 7 0 0 0 0 2L3 14.5 5 18l2.3-.7a7.7 7.7 0 0 0 1.7 1l.5 2.7h5l.5-2.7a7.7 7.7 0 0 0 1.7-1L19 18l2-3.5-2.1-1.5c.1-.3.1-.6.1-1Z" />
        </svg>
      );
  }
}

export function Sidebar({ activeView, sidebarOpen, navigation, user, onSelect }: SidebarProps) {
  return (
    <aside className={`workspace-sidebar ${sidebarOpen ? 'workspace-sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <div className="eyebrow">OpsCareer</div>
        <strong>Workspace</strong>
      </div>
      <nav className="sidebar-nav">
        {navigation.map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeView === item.id ? 'sidebar-link-active' : ''}`}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <span className="sidebar-link-marker" aria-hidden="true" />
            <span className="sidebar-link-icon" aria-hidden="true">
              <SidebarIcon icon={item.icon} />
            </span>
            <span className="sidebar-link-copy">
              <span className="sidebar-link-label">{item.label}</span>
              <span className="sidebar-link-hint">{item.hint}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-footer-name">{user.name}</div>
        <div className="small">{user.email}</div>
      </div>
    </aside>
  );
}
