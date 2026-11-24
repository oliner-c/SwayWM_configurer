import React from 'react';
import {
  Sliders,
  Palette,
  Monitor,
  Keyboard,
  PanelTop,
  ListChecks,
  GitBranch,
  Layers,
} from 'lucide-react';
import { WorkspaceTab } from './TopBar';

export type BuilderSection =
  | 'general'
  | 'appearance'
  | 'devices'
  | 'keybindings'
  | 'panel'
  | 'rules';

interface SidebarNavProps {
  activeTab: WorkspaceTab;
  activeSection: BuilderSection;
  onSelectSection: (section: BuilderSection) => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  currentBranch: string;
  isDirty: boolean;
  totalAdded: number;
  totalRemoved: number;
  diagnosticErrors: number;
}

const BUILDER_SECTIONS: Array<{
  id: BuilderSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'general', label: 'Переменные и окна', icon: Sliders },
  { id: 'appearance', label: 'Отступы и цвета', icon: Palette },
  { id: 'devices', label: 'Мониторы и ввод', icon: Monitor },
  { id: 'keybindings', label: 'Горячие клавиши', icon: Keyboard },
  { id: 'panel', label: 'Waybar и Swaybar', icon: PanelTop },
  { id: 'rules', label: 'Правила и запуск', icon: ListChecks },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  activeSection,
  onSelectSection,
  onSelectTab,
  currentBranch,
  isDirty,
  totalAdded,
  totalRemoved,
  diagnosticErrors,
}) => {
  return (
    <aside className="w-full lg:w-[228px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0E131E] flex flex-col justify-between">
      <div className="p-3 space-y-5 overflow-x-auto lg:overflow-y-auto">
        <div>
          <p className="px-2.5 pb-1.5 text-xs font-medium text-slate-400">
            Разделы Sway + Waybar
          </p>
          <div className="flex lg:flex-col gap-1">
            {BUILDER_SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === 'builder' && activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    onSelectSection(sec.id);
                    onSelectTab('builder');
                  }}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                    isActive
                      ? 'bg-slate-800 text-sky-300'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:block border-t border-slate-800/80 pt-4">
          <p className="px-2.5 pb-1.5 text-xs font-medium text-slate-400">
            Версии и пресеты
          </p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => onSelectTab('git')}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'git'
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <GitBranch className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Git-история</span>
              </span>
              {isDirty && (
                <span className="font-mono text-[11px] text-amber-400 tabular-nums">
                  +{totalAdded}/-{totalRemoved}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('templates')}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'templates'
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Готовые шаблоны</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Git & Validation summary */}
      <div className="hidden lg:block p-3 border-t border-slate-800/80 bg-[#0B0F17]/60 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>Ветка Git</span>
          <span className="font-mono text-slate-200 truncate max-w-[115px]">{currentBranch}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Состояние</span>
          {isDirty ? (
            <button
              type="button"
              onClick={() => onSelectTab('git')}
              className="text-amber-400 hover:text-amber-300 font-medium tabular-nums"
            >
              Есть правки
            </button>
          ) : (
            <span className="text-emerald-400">Сохранено</span>
          )}
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>Проверка синтаксиса</span>
          <span
            className={`font-mono tabular-nums ${
              diagnosticErrors > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {diagnosticErrors === 0 ? '0 ошибок' : `${diagnosticErrors} ошиб.`}
          </span>
        </div>
      </div>
    </aside>
  );
};
