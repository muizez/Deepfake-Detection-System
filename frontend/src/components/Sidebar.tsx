import { Icon, type IconName } from './Icon';

export type Page = 'overview' | 'analyze' | 'results' | 'archive';

interface SidebarProps {
  page: Page;
  go: (page: Page) => void;
  open: boolean;
  close: () => void;
  isOnline?: boolean;
}

function Wordmark() {
  return (
    <button className="wordmark">
      <span>D</span>
      <strong>
        DEEP
        <br />
        TRACE
      </strong>
    </button>
  );
}

export function Sidebar({ page, go, open, close, isOnline = true }: SidebarProps) {
  const items: { id: Page | 'settings'; label: string; icon: IconName }[] = [
    { id: 'overview', label: 'Overview', icon: 'grid' },
    { id: 'analyze', label: 'Analyze', icon: 'plus' },
    { id: 'results', label: 'Investigations', icon: 'file' },
    { id: 'archive', label: 'Archive', icon: 'archive' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];

  return (
    <>
      <button
        className={`nav-shade ${open ? 'show' : ''}`}
        onClick={close}
        aria-label="Close menu"
      />
      <aside className={`rail ${open ? 'show' : ''}`}>
        <Wordmark />
        <nav>
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id !== 'settings') {
                  go(item.id);
                }
              }}
              className={page === item.id ? 'active' : ''}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="rail-index">
          <span>
            {String(items.findIndex((item) => item.id === page) + 1).padStart(2, '0')}
          </span>
          <i />
          <span>04</span>
        </div>
        <div className="rail-foot">
          <span className={`live-dot ${isOnline ? '' : 'offline'}`} />
          EFFICIENTNET-B3
          <br />
          {isOnline ? 'OPERATIONAL' : 'OFFLINE'}
        </div>
      </aside>
    </>
  );
}
