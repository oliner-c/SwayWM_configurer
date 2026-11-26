import React from 'react';
import { Download } from 'lucide-react';
import { AppLang, tr } from '../i18n/translations';

export type WorkspaceTab = 'builder' | 'code' | 'ecosystem' | 'git' | 'templates';

interface TopBarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenExport: () => void;
  lang?: AppLang;
  onChangeLang?: (lang: AppLang) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
  lang = 'ru',
  onChangeLang,
}) => {
  const navItems: Array<{ id: WorkspaceTab; label: string }> = [
    { id: 'builder', label: tr(lang, 'Конструктор', 'Builder') },
    { id: 'code', label: tr(lang, 'Редактор кода', 'Code Editor') },
    { id: 'ecosystem', label: tr(lang, 'Пакеты и среда', 'Packages & Ecosystem') },
    { id: 'git', label: tr(lang, 'Git-история', 'Git History') },
    { id: 'templates', label: tr(lang, 'Шаблоны', 'Templates') },
  ];

  return (
    <header className="h-14 border-b border-slate-800/80 bg-[#0B0F17] px-5 flex items-center justify-between gap-4 shrink-0">
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

      {/* Zone 2: Concise single-line nav links */}
      <nav
        aria-label={tr(lang, 'Основная навигация', 'Main navigation')}
        className="hidden md:flex items-center gap-6"
      >
        {navItems.map((item) => {
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

      {/* Zone 3: Language Switcher + Primary Export Action */}
      <div className="flex items-center gap-2.5 shrink-0">
        {onChangeLang && (
          <div
            role="group"
            aria-label={tr(lang, 'Язык интерфейса', 'Interface language')}
            className="flex items-center p-0.5 bg-[#090D14] border border-slate-800 rounded-lg"
          >
            {(['ru', 'en'] as const).map((code) => {
              const selected = lang === code;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onChangeLang(code)}
                  aria-pressed={selected}
                  className={`px-2 py-1 text-[11px] font-semibold uppercase rounded-md transition-colors ${
                    selected
                      ? 'bg-slate-800 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={onOpenExport}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          {tr(lang, 'Экспорт конфигов', 'Export Configs')}
        </button>
      </div>
    </header>
  );
};
