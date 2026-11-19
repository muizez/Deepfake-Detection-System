import { Upload } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'workbench', label: 'Workbench' },
  { id: 'benchmarks', label: 'Benchmarks' },
  { id: 'methodology', label: 'Methodology' },
  { id: 'history', label: 'History' },
];

export function TopBar({ activeTab, onSelectTab, onTriggerUpload, historyCount }) {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-sm border-b border-slate-800">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        <a
          href="#workbench"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('workbench');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        >
          DEKHTE HAIN
        </a>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            const label =
              item.id === 'history' && historyCount > 0
                ? `${item.label} (${historyCount})`
                : item.label;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2 text-sm font-medium whitespace-nowrap shrink-0 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded ${
                  isActive
                    ? 'text-slate-50'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-blue-500"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span>Upload Video</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-1 px-4 pb-2 overflow-x-auto border-t border-slate-800/80 bg-slate-950"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const label =
            item.id === 'history' && historyCount > 0
              ? `${item.label} (${historyCount})`
              : item.label;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap shrink-0 rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-slate-50 font-semibold'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}
