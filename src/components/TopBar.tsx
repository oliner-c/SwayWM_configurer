import React from 'react';
import { Download } from 'lucide-react';

export type WorkspaceTab = 'builder' | 'code' | 'git' | 'templates';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenExport: () => void;
}

const NAV_ITEMS: Array<{ id: WorkspaceTab; label: string }> = [
  { id: 'builder', label: 'Конструктор' },
  { id: 'code', label: 'Редактор кода' },
  { id: 'git', label: 'Git-история' },
  { id: 'templates', label: 'Шаблоны' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
}) => {
  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0B0F17] px-5 flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#top"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('builder');
        }}
        className="text-lg font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded"
      >
        SwayForge
      </a>

      {/* Zone 2: 4 concise single-line nav links */}
      <nav aria-label="Основная навигация" className="hidden md:flex items-center gap-6">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded ${
                isActive
                  ? 'text-sky-400'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-sky-400"
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          Экспорт конфигов
        </button>
      </div>
    </header>
  );
};
