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
  PackageCheck,
  Terminal,
  Search,
  Bell,
  Lock,
  FolderOpen,
} from 'lucide-react';
import { WorkspaceTab } from './TopBar';
import {
  AppConfigSectionId,
  DetectedConfigurableSection,
} from '../packages/packageAnalyzer';
import { AppLang, tr } from '../i18n/translations';

export type BuilderSection =
  | 'general'
  | 'appearance'
  | 'devices'
  | 'keybindings'
  | 'panel'
  | 'rules'
  | AppConfigSectionId;

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
  analyzedPackageCount?: number;
  detectedSections?: DetectedConfigurableSection[];
  lang?: AppLang;
}

const APP_SECTION_ICONS: Record<
  AppConfigSectionId,
  React.ComponentType<{ className?: string }>
> = {
  'app-alacritty': Terminal,
  'app-foot': Terminal,
  'app-wofi': Search,
  'app-fuzzel': Search,
  'app-mako': Bell,
  'app-swaylock': Lock,
  'app-gtk': FolderOpen,
};

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
  analyzedPackageCount = 0,
  detectedSections = [],
  lang = 'ru',
}) => {
  const builderSections: Array<{
    id: BuilderSection;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'general', label: tr(lang, 'Переменные и окна', 'Variables & Windows'), icon: Sliders },
    { id: 'appearance', label: tr(lang, 'Отступы и цвета', 'Gaps & Colors'), icon: Palette },
    { id: 'devices', label: tr(lang, 'Мониторы и ввод', 'Displays & Input'), icon: Monitor },
    { id: 'keybindings', label: tr(lang, 'Горячие клавиши', 'Keybindings'), icon: Keyboard },
    { id: 'panel', label: tr(lang, 'Waybar и Swaybar', 'Waybar & Swaybar'), icon: PanelTop },
    { id: 'rules', label: tr(lang, 'Правила и запуск', 'Rules & Autostart'), icon: ListChecks },
  ];

  return (
    <aside className="w-full lg:w-[228px] shrink-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0E131E] flex flex-col justify-between">
      <div className="p-3 space-y-5 overflow-x-auto lg:overflow-y-auto">
        <div>
          <p className="px-2.5 pb-1.5 text-xs font-medium text-slate-400">
            {tr(lang, 'Разделы', 'Sections')}
          </p>
          <div className="flex lg:flex-col gap-1">
            {builderSections.map((sec) => {
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

            {detectedSections.length > 0 && (
              <>
                <div className="hidden lg:block my-1.5 border-t border-slate-800/70" />
                {detectedSections.map((appSec) => {
                  const Icon = APP_SECTION_ICONS[appSec.id];
                  const isActive = activeTab === 'builder' && activeSection === appSec.id;
                  return (
                    <button
                      key={appSec.id}
                      type="button"
                      title={appSec.configPath}
                      onClick={() => {
                        onSelectSection(appSec.id);
                        onSelectTab('builder');
                      }}
                      className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 text-left ${
                        isActive
                          ? 'bg-slate-800 text-sky-300'
                          : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-3.5 h-3.5 shrink-0 text-emerald-400" aria-hidden="true" />
                        <span className="truncate">{appSec.label}</span>
                      </span>
                      <span className="hidden lg:inline text-[10px] font-mono text-slate-500">
                        {appSec.packageName}
                      </span>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        <div className="hidden lg:block border-t border-slate-800/80 pt-4">
          <p className="px-2.5 pb-1.5 text-xs font-medium text-slate-400">
            {tr(lang, 'Версии и пресеты', 'Versions & Presets')}
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
                <span>{tr(lang, 'Git-история', 'Git History')}</span>
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
              <span>{tr(lang, 'Готовые шаблоны', 'Templates')}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab('ecosystem')}
              className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left ${
                activeTab === 'ecosystem'
                  ? 'bg-slate-800 text-sky-300'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <PackageCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{tr(lang, 'Пакеты и среда', 'Packages & Ecosystem')}</span>
              </span>
              {analyzedPackageCount > 0 && (
                <span className="font-mono text-[11px] text-sky-300 tabular-nums">
                  {analyzedPackageCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Git & Validation summary */}
      <div className="hidden lg:block p-3 border-t border-slate-800/80 bg-[#0B0F17]/60 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-400">
          <span>{tr(lang, 'Ветка Git', 'Git Branch')}</span>
          <span className="font-mono text-slate-200 truncate max-w-[115px]">{currentBranch}</span>
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>{tr(lang, 'Состояние', 'Status')}</span>
          {isDirty ? (
            <button
              type="button"
              onClick={() => onSelectTab('git')}
              className="text-amber-400 hover:text-amber-300 font-medium tabular-nums"
            >
              {tr(lang, 'Есть правки', 'Modified')}
            </button>
          ) : (
            <span className="text-emerald-400">{tr(lang, 'Сохранено', 'Clean')}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-slate-400">
          <span>{tr(lang, 'Проверка синтаксиса', 'Syntax Check')}</span>
          <span
            className={`font-mono tabular-nums ${
              diagnosticErrors > 0 ? 'text-rose-400' : 'text-slate-300'
            }`}
          >
            {diagnosticErrors === 0
              ? tr(lang, '0 ошибок', '0 errors')
              : tr(lang, `${diagnosticErrors} ошиб.`, `${diagnosticErrors} err.`)}
          </span>
        </div>
      </div>
    </aside>
  );
};
