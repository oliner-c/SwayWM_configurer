import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { SwayConfigModel } from '../sway/types';
import { COLOR_THEME_PRESETS } from '../sway/presets';
import { WaybarConfigModel } from '../waybar/types';
import { AVAILABLE_WAYBAR_MODULES, WAYBAR_THEME_PRESETS } from '../waybar/presets';
import { BuilderSection } from './SidebarNav';
import { AppConfigSection } from './AppConfigSection';
import { EcosystemSettings, SystemPalette } from '../ecosystem/ecosystemEngine';
import { AppConfigSectionId, PackageAnalysisResult } from '../packages/packageAnalyzer';
import {
  AppLang,
  PRESET_LOCALE_EN,
  tr,
  WAYBAR_MODULE_DESC_EN,
} from '../i18n/translations';
import { SmartInput } from './SmartInput';
import {
  detectBindingCommandFromKeys,
  detectDisplayScale,
  detectFontFamily,
  detectKeyboardLayouts,
  detectLauncherCommand,
  detectOutputName,
  detectScreenResolution,
  detectSuggestedAutostart,
  detectSuggestedBinding,
  detectSuggestedCustomVar,
  detectSuggestedWindowRule,
  detectTerminalCommand,
  detectWaybarPowerCommand,
} from '../utils/autoDetect';

interface VisualConfiguratorProps {
  section: BuilderSection;
  sway: SwayConfigModel;
  waybar: WaybarConfigModel;
  ecosystem: EcosystemSettings;
  palette: SystemPalette;
  packageAnalysis?: PackageAnalysisResult;
  onUpdateSway: (updater: (prev: SwayConfigModel) => SwayConfigModel) => void;
  onUpdateWaybar: (updater: (prev: WaybarConfigModel) => WaybarConfigModel) => void;
  onUpdateEcosystem: (updater: (prev: EcosystemSettings) => EcosystemSettings) => void;
  onApplySyncedTheme: (themeId: string) => void;
  lang?: AppLang;
}

const inputClass =
  'w-full px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400 transition-colors';
const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

export const VisualConfigurator: React.FC<VisualConfiguratorProps> = ({
  section,
  sway,
  waybar,
  ecosystem,
  palette,
  packageAnalysis,
  onUpdateSway,
  onUpdateWaybar,
  onUpdateEcosystem,
  onApplySyncedTheme,
  lang = 'ru',
}) => {
  const [newVarName, setNewVarName] = useState('browser');
  const [newVarValue, setNewVarValue] = useState('firefox');

  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);

  const [newBindFlags, setNewBindFlags] = useState('');
  const [newBindKeys, setNewBindKeys] = useState('$mod+b');
  const [newBindCmd, setNewBindCmd] = useState('exec firefox');
  const [bindSearch, setBindSearch] = useState('');

  const [newRuleCriteria, setNewRuleCriteria] = useState('[app_id="org.gnome.Calculator"]');
  const [newRuleAction, setNewRuleAction] = useState('floating enable');
  const [newRuleType, setNewRuleType] = useState<'for_window' | 'assign' | 'no_focus'>('for_window');
  const [newExecCmd, setNewExecCmd] = useState('mako');
  const [newExecAlways, setNewExecAlways] = useState(false);

  const [waybarSubTab, setWaybarSubTab] = useState<'layout' | 'modules' | 'style'>('layout');
  const [waybarZoneTarget, setWaybarZoneTarget] = useState<'left' | 'center' | 'right'>('right');

  if (section.startsWith('app-')) {
    return (
      <AppConfigSection
        section={section as AppConfigSectionId}
        sway={sway}
        ecosystem={ecosystem}
        palette={palette}
        packageAnalysis={packageAnalysis}
        onUpdateSway={onUpdateSway}
        onUpdateEcosystem={onUpdateEcosystem}
        lang={lang}
      />
    );
  }

  if (section === 'general') {
    const handleAddCustomVar = (e: React.FormEvent) => {
      e.preventDefault();
      const cleaned = newVarName.trim().replace(/^\$/, '').replace(/\s+/g, '_');
      if (!cleaned || !newVarValue.trim()) return;
      onUpdateSway((prev) => {
        const filtered = prev.variables.custom.filter((v) => v.name !== cleaned);
        return {
          ...prev,
          variables: {
            ...prev.variables,
            custom: [...filtered, { name: cleaned, value: newVarValue.trim() }],
          },
        };
      });
      setNewVarName('');
      setNewVarValue('');
    };

    return (
      <div key="section-general" className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {tr(lang, 'Переменные и поведение окон', 'Variables & Window Behavior')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr(
              lang,
              'Переменные SwayWM, клавиши навигации, рамки, фокус, варпинг курсора и макет рабочих столов.',
              'Core SwayWM variables, navigation keys, tiled/floating borders, focus wrapping, cursor warping, and workspace layout.'
            )}
          </p>
        </div>

        {/* Core Variables */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sway-mod" className={labelClass}>
              {tr(lang, 'Модификатор ($mod)', 'Modifier ($mod)')}
            </label>
            <SmartInput
              id="sway-mod"
              type="text"
              compact
              lang={lang}
              value={sway.variables.mod}
              placeholder="Mod4"
              options={[
                { value: 'Mod4', label: 'Super / Win' },
                { value: 'Mod1', label: 'Alt' },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, mod: raw.trim() || 'Mod4' },
                }))
              }
              onAutoDetect={() => 'Mod4'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-term" className={labelClass}>
              {tr(lang, 'Терминал ($term)', 'Terminal ($term)')}
            </label>
            <SmartInput
              id="sway-term"
              type="text"
              lang={lang}
              value={sway.variables.term}
              placeholder={tr(lang, 'Команда терминала, напр.: alacritty или foot', 'Terminal command, e.g. alacritty or foot')}
              options={['alacritty', 'foot', 'kitty', 'wezterm', 'ghostty']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, term: raw },
                }))
              }
              onAutoDetect={() => detectTerminalCommand(sway, packageAnalysis)}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sway-menu" className={labelClass}>
              {tr(lang, 'Лаунчер приложений ($menu)', 'App Launcher ($menu)')}
            </label>
            <SmartInput
              id="sway-menu"
              type="text"
              lang={lang}
              value={sway.variables.menu}
              placeholder={tr(lang, 'Команда лаунчера, напр.: wofi --show drun', 'Launcher command, e.g. wofi --show drun')}
              options={[
                'wofi --show drun',
                'fuzzel',
                'rofi -show drun',
                'bemenu-run',
                'tofi-drun | xargs swaymsg exec --',
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, menu: raw },
                }))
              }
              onAutoDetect={() => detectLauncherCommand(sway, packageAnalysis)}
              className={inputClass}
            />
          </div>

          {/* Navigation keys */}
          <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { key: 'left', label: '$left', fallback: 'h', alt: 'Left', hint: tr(lang, 'Клавиша: h', 'Key: h') },
                { key: 'down', label: '$down', fallback: 'j', alt: 'Down', hint: tr(lang, 'Клавиша: j', 'Key: j') },
                { key: 'up', label: '$up', fallback: 'k', alt: 'Up', hint: tr(lang, 'Клавиша: k', 'Key: k') },
                { key: 'right', label: '$right', fallback: 'l', alt: 'Right', hint: tr(lang, 'Клавиша: l', 'Key: l') },
              ] as const
            ).map((nav) => (
              <div key={nav.key}>
                <label htmlFor={`sway-nav-${nav.key}`} className={labelClass}>
                  {nav.label}
                </label>
                <SmartInput
                  id={`sway-nav-${nav.key}`}
                  type="text"
                  compact
                  lang={lang}
                  value={sway.variables[nav.key]}
                  placeholder={nav.hint}
                  options={[nav.fallback, nav.alt]}
                  onCommit={(raw) =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      variables: { ...prev.variables, [nav.key]: raw },
                    }))
                  }
                  onAutoDetect={() => nav.fallback}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Custom $variables */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Пользовательские переменные (set $...)', 'Custom Variables (set $...)')}
          </h3>
          <form onSubmit={handleAddCustomVar} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-12 sm:col-span-4">
              <label htmlFor="new-var-name" className={labelClass}>
                {tr(lang, 'Имя (без $)', 'Name (no $)')}
              </label>
              <SmartInput
                id="new-var-name"
                type="text"
                allowEmpty
                compact
                lang={lang}
                value={newVarName}
                options={['browser', 'editor', 'files', 'lock', 'screenshot']}
                onCommit={setNewVarName}
                onAutoDetect={() => {
                  const s = detectSuggestedCustomVar(sway, packageAnalysis);
                  setNewVarValue(s.value);
                  return s.name;
                }}
                placeholder={tr(lang, 'Имя, напр.: browser', 'Name, e.g. browser')}
                className={inputClass}
              />
            </div>
            <div className="col-span-8 sm:col-span-6">
              <label htmlFor="new-var-val" className={labelClass}>
                {tr(lang, 'Значение', 'Value')}
              </label>
              <SmartInput
                id="new-var-val"
                type="text"
                allowEmpty
                compact
                lang={lang}
                value={newVarValue}
                options={['firefox', 'zen-browser', 'nvim', 'thunar', 'swaylock -f']}
                onCommit={setNewVarValue}
                onAutoDetect={() => detectSuggestedCustomVar(sway, packageAnalysis).value}
                placeholder={tr(lang, 'Значение, напр.: firefox', 'Value, e.g. firefox')}
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <button
                type="submit"
                className="w-full py-2 px-3 inline-flex items-center justify-center gap-1 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                {tr(lang, 'Добавить', 'Add')}
              </button>
            </div>
          </form>

          {sway.variables.custom.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {sway.variables.custom.map((v) => (
                <span
                  key={v.name}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-800 bg-[#090D14] text-xs font-mono text-slate-200"
                >
                  <span className="text-emerald-300">${v.name}</span>
                  <span className="text-slate-500">=</span>
                  <span>{v.value}</span>
                  <button
                    type="button"
                    aria-label={tr(lang, `Удалить переменную $${v.name}`, `Remove variable $${v.name}`)}
                    onClick={() =>
                      onUpdateSway((prev) => ({
                        ...prev,
                        variables: {
                          ...prev.variables,
                          custom: prev.variables.custom.filter((item) => item.name !== v.name),
                        },
                      }))
                    }
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Window Borders & Typography */}
        <div className="border-t border-slate-800/80 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sway-font" className={labelClass}>
              {tr(lang, 'Шрифт Pango', 'Pango Font')}
            </label>
            <SmartInput
              id="sway-font"
              type="text"
              lang={lang}
              value={sway.general.font}
              placeholder={tr(lang, 'Шрифт, напр.: JetBrainsMono Nerd Font', 'Font family, e.g. JetBrainsMono Nerd Font')}
              options={[
                'JetBrainsMono Nerd Font',
                'FiraCode Nerd Font',
                'Inter',
                'Iosevka Nerd Font',
                'Noto Sans',
                'monospace',
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, font: raw },
                }))
              }
              onAutoDetect={() => detectFontFamily(sway, packageAnalysis)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-font-size" className={labelClass}>
              {tr(lang, 'Размер шрифта (pt)', 'Font Size (pt)')}
            </label>
            <SmartInput
              id="sway-font-size"
              type="number"
              min={6}
              max={24}
              compact
              lang={lang}
              value={sway.general.fontSize}
              placeholder="10"
              options={['9', '10', '11', '12', '13', '14']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, fontSize: Number(raw) || 10 },
                }))
              }
              onAutoDetect={() => (detectDisplayScale() > 1.25 ? 11 : 10)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-border-style" className={labelClass}>
              {tr(lang, 'Стиль границ окон (default_border)', 'Tiled Border (default_border)')}
            </label>
            <SmartInput
              id="sway-border-style"
              type="text"
              compact
              lang={lang}
              value={sway.general.defaultBorder}
              placeholder="pixel"
              options={[
                { value: 'pixel', label: tr(lang, 'тонкая рамка без заголовка', 'thin border, no titlebar') },
                { value: 'normal', label: tr(lang, 'рамка + заголовок окна', 'border + titlebar') },
                { value: 'none', label: tr(lang, 'без рамок', 'borderless') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    defaultBorder: (raw.trim() || 'pixel') as 'normal' | 'pixel' | 'none',
                  },
                }))
              }
              onAutoDetect={() => 'pixel'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-border-px" className={labelClass}>
              {tr(lang, 'Толщина рамки (px)', 'Border Thickness (px)')}
            </label>
            <SmartInput
              id="sway-border-px"
              type="number"
              min={0}
              max={10}
              compact
              lang={lang}
              disabled={sway.general.defaultBorder === 'none'}
              value={sway.general.borderThickness}
              placeholder="2"
              options={['0', '1', '2', '3', '4']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, borderThickness: Number(raw) || 0 },
                }))
              }
              onAutoDetect={() => (sway.gaps.inner > 0 ? 2 : 1)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-float-border-style" className={labelClass}>
              {tr(lang, 'Рамка плавающих окон (default_floating_border)', 'Floating Border (default_floating_border)')}
            </label>
            <SmartInput
              id="sway-float-border-style"
              type="text"
              compact
              lang={lang}
              value={sway.general.defaultFloatingBorder ?? 'normal'}
              placeholder="normal"
              options={[
                { value: 'normal', label: tr(lang, 'с заголовком', 'with titlebar') },
                { value: 'pixel', label: tr(lang, 'только рамка', 'border only') },
                { value: 'none', label: tr(lang, 'без рамок', 'borderless') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    defaultFloatingBorder: (raw.trim() || 'normal') as 'normal' | 'pixel' | 'none',
                  },
                }))
              }
              onAutoDetect={() => 'normal'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-float-border-px" className={labelClass}>
              {tr(lang, 'Толщина плавающей рамки (px)', 'Floating Border Thickness (px)')}
            </label>
            <SmartInput
              id="sway-float-border-px"
              type="number"
              min={0}
              max={10}
              compact
              lang={lang}
              disabled={sway.general.defaultFloatingBorder === 'none'}
              value={sway.general.floatingBorderThickness ?? 2}
              placeholder="2"
              options={['0', '1', '2', '3', '4']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    floatingBorderThickness: Number(raw) || 0,
                  },
                }))
              }
              onAutoDetect={() => 2}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-hide-edge" className={labelClass}>
              {tr(lang, 'Скрытие границ у края экрана (hide_edge_borders)', 'Hide Edge Borders (hide_edge_borders)')}
            </label>
            <SmartInput
              id="sway-hide-edge"
              type="text"
              compact
              lang={lang}
              value={sway.general.hideEdgeBorders ?? 'none'}
              placeholder="none"
              options={['none', 'smart', 'smart_no_gaps', 'vertical', 'horizontal', 'both']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    hideEdgeBorders: (raw.trim() || 'none') as SwayConfigModel['general']['hideEdgeBorders'],
                  },
                }))
              }
              onAutoDetect={() => 'smart'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-title-align" className={labelClass}>
              {tr(lang, 'Выравнивание заголовка (title_align)', 'Title Alignment (title_align)')}
            </label>
            <SmartInput
              id="sway-title-align"
              type="text"
              compact
              lang={lang}
              value={sway.general.titleAlign}
              placeholder="left"
              options={[
                { value: 'left', label: tr(lang, 'по левому краю', 'left') },
                { value: 'center', label: tr(lang, 'по центру', 'center') },
                { value: 'right', label: tr(lang, 'по правому краю', 'right') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    titleAlign: (raw.trim() || 'left') as 'left' | 'center' | 'right',
                  },
                }))
              }
              onAutoDetect={() => 'left'}
              className={inputClass}
            />
          </div>
        </div>

        {/* Focus, Mouse & Workspace Behavior */}
        <div className="border-t border-slate-800/80 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sway-focus-mouse" className={labelClass}>
              {tr(lang, 'Фокус по курсору (focus_follows_mouse)', 'Focus Follows Mouse')}
            </label>
            <SmartInput
              id="sway-focus-mouse"
              type="text"
              compact
              lang={lang}
              value={sway.general.focusFollowsMouse}
              placeholder="yes"
              options={[
                { value: 'yes', label: tr(lang, 'при входе в окно', 'on enter') },
                { value: 'no', label: tr(lang, 'по клику/клавишам', 'click/key only') },
                { value: 'always', label: tr(lang, 'всегда', 'always') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    focusFollowsMouse: (raw.trim() || 'yes') as 'yes' | 'no' | 'always',
                  },
                }))
              }
              onAutoDetect={() => 'yes'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-focus-wrap" className={labelClass}>
              {tr(lang, 'Переход фокуса по кругу (focus_wrapping)', 'Focus Wrapping')}
            </label>
            <SmartInput
              id="sway-focus-wrap"
              type="text"
              compact
              lang={lang}
              value={sway.general.focusWrapping ?? 'yes'}
              placeholder="yes"
              options={['yes', 'no', 'force', 'workspace']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    focusWrapping: (raw.trim() || 'yes') as 'yes' | 'no' | 'force' | 'workspace',
                  },
                }))
              }
              onAutoDetect={() => 'yes'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-mouse-warp" className={labelClass}>
              {tr(lang, 'Перепрыгивание курсора (mouse_warping)', 'Mouse Warping')}
            </label>
            <SmartInput
              id="sway-mouse-warp"
              type="text"
              compact
              lang={lang}
              value={sway.general.mouseWarping ?? 'output'}
              placeholder="output"
              options={[
                { value: 'output', label: tr(lang, 'между мониторами', 'between displays') },
                { value: 'container', label: tr(lang, 'к окну', 'to focused window') },
                { value: 'none', label: tr(lang, 'отключено', 'disabled') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    mouseWarping: (raw.trim() || 'output') as 'output' | 'container' | 'none',
                  },
                }))
              }
              onAutoDetect={() => 'output'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-float-mod" className={labelClass}>
              {tr(lang, 'Перетаскивание мышью (floating_modifier)', 'Floating Modifier')}
            </label>
            <SmartInput
              id="sway-float-mod"
              type="text"
              compact
              lang={lang}
              value={sway.general.floatingModifier}
              placeholder="$mod normal"
              options={['$mod normal', '$mod inverse', 'none']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, floatingModifier: raw.trim() || '$mod normal' },
                }))
              }
              onAutoDetect={() => '$mod normal'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-ws-layout" className={labelClass}>
              {tr(lang, 'Макет контейнеров (workspace_layout)', 'Default Layout (workspace_layout)')}
            </label>
            <SmartInput
              id="sway-ws-layout"
              type="text"
              compact
              lang={lang}
              value={sway.general.workspaceLayout ?? 'default'}
              placeholder="default"
              options={[
                { value: 'default', label: tr(lang, 'разделение экрана', 'split tiling') },
                { value: 'tabbed', label: tr(lang, 'вкладки', 'tabs') },
                { value: 'stacking', label: tr(lang, 'стек заголовков', 'stacking') },
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    workspaceLayout: (raw.trim() || 'default') as 'default' | 'stacking' | 'tabbed',
                  },
                }))
              }
              onAutoDetect={() => 'default'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-popup-fs" className={labelClass}>
              {tr(lang, 'Всплывающие окна в fullscreen', 'Popup During Fullscreen')}
            </label>
            <SmartInput
              id="sway-popup-fs"
              type="text"
              compact
              lang={lang}
              value={sway.general.popupDuringFullscreen ?? 'smart'}
              placeholder="smart"
              options={['smart', 'ignore', 'leave_fullscreen']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    popupDuringFullscreen: (raw.trim() || 'smart') as 'smart' | 'ignore' | 'leave_fullscreen',
                  },
                }))
              }
              onAutoDetect={() => 'smart'}
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={sway.general.workspaceAutoBackAndForth ?? false}
                onChange={(e) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    general: { ...prev.general, workspaceAutoBackAndForth: e.target.checked },
                  }))
                }
                className="accent-sky-400"
              />
              <span>
                {tr(
                  lang,
                  'workspace_auto_back_and_forth (повторное нажатие возвращает на прошлый стол)',
                  'workspace_auto_back_and_forth (repeat key toggles back to previous workspace)'
                )}
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'appearance') {
    return (
      <div key="section-appearance" className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {tr(lang, 'Отступы и единая палитра', 'Gaps & Unified Palette')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr(
              lang,
              'Изменения отступов и цветовой схемы сразу применяются к окнам Sway и панели Waybar.',
              'Gap sizes and color schemes update Sway windows, Waybar, and live preview in real time.'
            )}
          </p>
        </div>

        {/* Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="gaps-inner" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Внутренние отступы (gaps inner, px)', 'Inner Gaps (gaps inner, px)')}
            </label>
            <SmartInput
              id="gaps-inner"
              type="number"
              min={0}
              max={64}
              compact
              lang={lang}
              value={sway.gaps.inner}
              placeholder="8"
              options={['0', '2', '4', '6', '8', '10', '12', '16', '24']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, inner: Math.max(0, Number(raw) || 0) },
                }))
              }
              onAutoDetect={() => 8}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок внутренних отступов', 'Inner gaps slider')}
              type="range"
              min={0}
              max={32}
              value={sway.gaps.inner}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, inner: Number(e.target.value) },
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="gaps-outer" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Внешние отступы (gaps outer, px)', 'Outer Gaps (gaps outer, px)')}
            </label>
            <SmartInput
              id="gaps-outer"
              type="number"
              min={0}
              max={64}
              compact
              lang={lang}
              value={sway.gaps.outer}
              placeholder="4"
              options={['0', '2', '4', '6', '8', '10', '12', '16', '24']}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, outer: Math.max(0, Number(raw) || 0) },
                }))
              }
              onAutoDetect={() => 4}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок внешних отступов', 'Outer gaps slider')}
              type="range"
              min={0}
              max={32}
              value={sway.gaps.outer}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, outer: Number(e.target.value) },
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div>
            <label htmlFor="smart-gaps" className={labelClass}>
              {tr(lang, 'Умные отступы (smart_gaps)', 'Smart Gaps (smart_gaps)')}
            </label>
            <SmartInput
              id="smart-gaps"
              type="text"
              compact
              lang={lang}
              value={sway.gaps.smartGaps}
              placeholder="on"
              options={[
                { value: 'on', label: tr(lang, 'убирать при 1 окне', 'disable on single window') },
                { value: 'off', label: tr(lang, 'всегда показывать', 'always keep gaps') },
                'inverse_outer',
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: {
                    ...prev.gaps,
                    smartGaps: (raw.trim() || 'on') as 'on' | 'off' | 'inverse_outer',
                  },
                }))
              }
              onAutoDetect={() => 'on'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="smart-borders" className={labelClass}>
              {tr(lang, 'Умные рамки (smart_borders)', 'Smart Borders (smart_borders)')}
            </label>
            <SmartInput
              id="smart-borders"
              type="text"
              compact
              lang={lang}
              value={sway.gaps.smartBorders}
              placeholder="on"
              options={[
                { value: 'on', label: tr(lang, 'скрывать при 1 окне', 'hide on single window') },
                'off',
                'no_gaps',
              ]}
              onCommit={(raw) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: {
                    ...prev.gaps,
                    smartBorders: (raw.trim() || 'on') as 'on' | 'off' | 'no_gaps',
                  },
                }))
              }
              onAutoDetect={() => 'on'}
              className={inputClass}
            />
          </div>
        </div>

        {/* Synchronized Themes */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Синхронизированные темы (Sway + Waybar)', 'Synchronized Themes (Sway + Waybar)')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COLOR_THEME_PRESETS.map((preset) => {
              const enPreset = PRESET_LOCALE_EN[preset.id];
              const presetName = lang === 'en' && enPreset ? enPreset.name : preset.name;
              const presetDesc =
                lang === 'en' && enPreset ? enPreset.description : preset.description;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onApplySyncedTheme(preset.id)}
                  className="p-3 rounded-lg border border-slate-800 bg-[#090D14] hover:border-sky-400/60 text-left transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-100">{presetName}</span>
                    <div className="flex items-center gap-1" aria-hidden="true">
                      <span
                        className="w-3 h-3 rounded-sm border border-white/10"
                        style={{ backgroundColor: preset.wallpaper }}
                      />
                      <span
                        className="w-3 h-3 rounded-sm border border-white/10"
                        style={{ backgroundColor: preset.colors.focused.border }}
                      />
                      <span
                        className="w-3 h-3 rounded-sm border border-white/10"
                        style={{ backgroundColor: preset.colors.urgent.border }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{presetDesc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Granular Window Border Colors (including split indicator) */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Детальные цвета рамок Sway (client.*)', 'Granular Sway Window Colors (client.*)')}
          </h3>
          {(
            [
              { key: 'focused', label: tr(lang, 'Активное окно (client.focused)', 'Focused (client.focused)') },
              {
                key: 'focusedInactive',
                label: tr(lang, 'Неактивное в контейнере (focused_inactive)', 'Focused Inactive (focused_inactive)'),
              },
              { key: 'unfocused', label: tr(lang, 'Окно без фокуса (client.unfocused)', 'Unfocused (client.unfocused)') },
              { key: 'urgent', label: tr(lang, 'Срочное окно (client.urgent)', 'Urgent (client.urgent)') },
            ] as const
          ).map((row) => {
            const set = sway.colors[row.key];
            return (
              <div
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-800/50 last:border-b-0"
              >
                <span className="text-xs text-slate-300">{row.label}</span>
                <div className="flex flex-wrap items-center gap-2.5">
                  {(
                    [
                      { field: 'border', title: tr(lang, 'Рамка', 'Border') },
                      { field: 'background', title: tr(lang, 'Фон', 'Bg') },
                      { field: 'text', title: tr(lang, 'Текст', 'Text') },
                      { field: 'indicator', title: tr(lang, 'Индикатор', 'Split') },
                      { field: 'childBorder', title: tr(lang, 'Граница', 'Child') },
                    ] as const
                  ).map((colField) => {
                    const safeHex = /^#[0-9a-fA-F]{6}$/.test(set[colField.field])
                      ? set[colField.field]
                      : '#38BDF8';
                    return (
                      <label
                        key={colField.field}
                        className="flex items-center gap-1 text-[11px] text-slate-400"
                      >
                        <span>{colField.title}</span>
                        <input
                          type="color"
                          value={safeHex}
                          aria-label={`${row.label} — ${colField.title}`}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            onUpdateSway((prev) => ({
                              ...prev,
                              colors: {
                                ...prev.colors,
                                [row.key]: {
                                  ...prev.colors[row.key],
                                  [colField.field]: val,
                                },
                              },
                            }));
                          }}
                          className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'devices') {
    const keyboard = sway.inputs.find((i) => i.identifier.includes('keyboard'));
    const touchpad = sway.inputs.find((i) => i.identifier.includes('touchpad'));
    const displayOutputs = sway.outputs.filter((o) => o.name !== '*');
    const activeDisplay =
      displayOutputs.find((o) => o.id === selectedOutputId) ??
      displayOutputs[0] ??
      sway.outputs[0];
    const bgOutput = sway.outputs.find((o) => o.background) ?? sway.outputs.find((o) => o.name === '*');

    const updateKeyboard = (patch: Partial<SwayConfigModel['inputs'][number]>) => {
      onUpdateSway((prev) => {
        const hasKb = prev.inputs.some((i) => i.identifier.includes('keyboard'));
        if (hasKb) {
          return {
            ...prev,
            inputs: prev.inputs.map((i) =>
              i.identifier.includes('keyboard') ? { ...i, ...patch } : i
            ),
          };
        }
        return {
          ...prev,
          inputs: [
            ...prev.inputs,
            {
              id: 'kb-1',
              identifier: 'type:keyboard',
              xkbLayout: 'us,ru',
              xkbVariant: '',
              xkbOptions: 'grp:alt_shift_toggle',
              tap: 'disabled',
              naturalScroll: 'disabled',
              accelSpeed: 0,
              ...patch,
            },
          ],
        };
      });
    };

    const updateTouchpad = (patch: Partial<SwayConfigModel['inputs'][number]>) => {
      onUpdateSway((prev) => {
        const hasTp = prev.inputs.some((i) => i.identifier.includes('touchpad'));
        if (hasTp) {
          return {
            ...prev,
            inputs: prev.inputs.map((i) =>
              i.identifier.includes('touchpad') ? { ...i, ...patch } : i
            ),
          };
        }
        return {
          ...prev,
          inputs: [
            ...prev.inputs,
            {
              id: 'tp-1',
              identifier: 'type:touchpad',
              xkbLayout: '',
              xkbVariant: '',
              xkbOptions: '',
              tap: 'enabled',
              naturalScroll: 'enabled',
              accelSpeed: 0,
              ...patch,
            },
          ],
        };
      });
    };

    const updateActiveOutput = (patch: Partial<SwayConfigModel['outputs'][number]>) => {
      onUpdateSway((prev) => {
        if (!activeDisplay || activeDisplay.name === '*') {
          const newId = `out-${Date.now()}`;
          setSelectedOutputId(newId);
          return {
            ...prev,
            outputs: [
              ...prev.outputs,
              {
                id: newId,
                name: 'DP-1',
                resolution: '1920x1080',
                refreshRate: '60Hz',
                position: '0,0',
                scale: 1,
                background: '',
                ...patch,
              },
            ],
          };
        }
        return {
          ...prev,
          outputs: prev.outputs.map((o) =>
            o.id === activeDisplay.id ? { ...o, ...patch } : o
          ),
        };
      });
    };

    const updateBgOutput = (patch: Partial<SwayConfigModel['outputs'][number]>) => {
      onUpdateSway((prev) => {
        const hasStar = prev.outputs.some((o) => o.name === '*');
        if (hasStar) {
          return {
            ...prev,
            outputs: prev.outputs.map((o) => (o.name === '*' ? { ...o, ...patch } : o)),
          };
        }
        return {
          ...prev,
          outputs: [
            {
              id: 'out-bg',
              name: '*',
              resolution: '',
              refreshRate: '',
              position: '',
              scale: 1,
              background: '#0F172A',
              backgroundMode: 'solid_color',
              ...patch,
            },
            ...prev.outputs,
          ],
        };
      });
    };

    return (
      <div key="section-devices" className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {tr(lang, 'Мониторы и устройства ввода', 'Displays & Input Devices')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr(
              lang,
              'Мультимониторная конфигурация, поворот, Adaptive Sync, обои, клавиатура и параметры libinput.',
              'Multi-monitor layout, rotation, Adaptive Sync, wallpapers, keyboard repeat, and libinput pointer tuning.'
            )}
          </p>
        </div>

        {/* Display Outputs */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-200">
              {tr(lang, 'Дисплеи (output)', 'Displays (output)')}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {displayOutputs.map((out) => (
                <button
                  key={out.id}
                  type="button"
                  onClick={() => setSelectedOutputId(out.id)}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                    activeDisplay?.id === out.id
                      ? 'bg-sky-500/15 border-sky-400/50 text-sky-300'
                      : 'bg-[#090D14] border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {out.name || 'output'}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  const nextNum = displayOutputs.length + 1;
                  const newId = `out-${Date.now()}`;
                  const nextName = displayOutputs.some((o) => o.name === 'HDMI-A-1')
                    ? `DP-${nextNum}`
                    : 'HDMI-A-1';
                  onUpdateSway((prev) => ({
                    ...prev,
                    outputs: [
                      ...prev.outputs,
                      {
                        id: newId,
                        name: nextName,
                        resolution: '1920x1080',
                        refreshRate: '60Hz',
                        position: `${displayOutputs.length * 1920},0`,
                        scale: 1,
                        background: '',
                      },
                    ],
                  }));
                  setSelectedOutputId(newId);
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <Plus className="w-3 h-3" aria-hidden="true" />
                <span>{tr(lang, 'Монитор', 'Add output')}</span>
              </button>
              {displayOutputs.length > 1 && activeDisplay && activeDisplay.name !== '*' && (
                <button
                  type="button"
                  aria-label={tr(lang, `Удалить выход ${activeDisplay.name}`, `Remove output ${activeDisplay.name}`)}
                  onClick={() => {
                    onUpdateSway((prev) => ({
                      ...prev,
                      outputs: prev.outputs.filter((o) => o.id !== activeDisplay.id),
                    }));
                    setSelectedOutputId(null);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded border border-slate-800"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div key={activeDisplay?.id ?? 'default'} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="output-name" className={labelClass}>
                {tr(lang, 'Имя выхода (output)', 'Output Name')}
              </label>
              <SmartInput
                id="output-name"
                type="text"
                compact
                lang={lang}
                value={activeDisplay?.name !== '*' ? activeDisplay?.name ?? 'DP-1' : 'DP-1'}
                placeholder={tr(lang, 'Порт, напр.: eDP-1 или DP-1', 'Port, e.g. eDP-1 or DP-1')}
                options={['eDP-1', 'DP-1', 'DP-2', 'HDMI-A-1', 'HDMI-A-2', '*']}
                onCommit={(raw) => updateActiveOutput({ name: raw })}
                onAutoDetect={() => {
                  const idx = Math.max(
                    0,
                    displayOutputs.findIndex((o) => o.id === activeDisplay?.id)
                  );
                  return detectOutputName(packageAnalysis, idx);
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-res" className={labelClass}>
                {tr(lang, 'Разрешение (ШxВ)', 'Resolution (WxH)')}
              </label>
              <SmartInput
                id="output-res"
                type="text"
                allowEmpty
                compact
                lang={lang}
                value={activeDisplay?.name !== '*' ? activeDisplay?.resolution ?? '' : '1920x1080'}
                placeholder="1920x1080"
                options={['1920x1080', '2560x1440', '2560x1600', '3840x2160', '1366x768']}
                onCommit={(raw) => updateActiveOutput({ resolution: raw })}
                onAutoDetect={() => detectScreenResolution()}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-hz" className={labelClass}>
                {tr(lang, 'Частота (Hz)', 'Refresh Rate')}
              </label>
              <SmartInput
                id="output-hz"
                type="text"
                allowEmpty
                compact
                lang={lang}
                placeholder="144Hz"
                value={activeDisplay?.name !== '*' ? activeDisplay?.refreshRate ?? '' : ''}
                options={['60Hz', '75Hz', '120Hz', '144Hz', '165Hz', '240Hz']}
                onCommit={(raw) => updateActiveOutput({ refreshRate: raw })}
                onAutoDetect={() =>
                  (packageAnalysis?.detected.brightnessTools.length ?? 0) > 0 ? '60Hz' : '144Hz'
                }
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-pos" className={labelClass}>
                {tr(lang, 'Позиция (X,Y)', 'Position (X,Y)')}
              </label>
              <SmartInput
                id="output-pos"
                type="text"
                allowEmpty
                compact
                lang={lang}
                placeholder="0,0"
                value={activeDisplay?.name !== '*' ? activeDisplay?.position ?? '0,0' : '0,0'}
                options={['0,0', '1920,0', '2560,0', '0,1080', '-1920,0']}
                onCommit={(raw) => updateActiveOutput({ position: raw })}
                onAutoDetect={() => {
                  const idx = Math.max(
                    0,
                    displayOutputs.findIndex((o) => o.id === activeDisplay?.id)
                  );
                  return `${idx * 1920},0`;
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-scale" className={labelClass}>
                {tr(lang, 'Масштаб (scale)', 'Scale Factor')}
              </label>
              <SmartInput
                id="output-scale"
                type="number"
                step="0.25"
                min={0.5}
                max={3}
                compact
                lang={lang}
                placeholder="1"
                value={activeDisplay?.name !== '*' ? activeDisplay?.scale ?? 1 : 1}
                options={['1', '1.25', '1.5', '1.75', '2']}
                onCommit={(raw) => updateActiveOutput({ scale: Number(raw) || 1 })}
                onAutoDetect={() => detectDisplayScale()}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-transform" className={labelClass}>
                {tr(lang, 'Поворот (transform)', 'Rotation (transform)')}
              </label>
              <SmartInput
                id="output-transform"
                type="text"
                compact
                lang={lang}
                value={activeDisplay?.transform ?? 'normal'}
                placeholder="normal"
                options={[
                  'normal',
                  '90',
                  '180',
                  '270',
                  'flipped',
                  'flipped-90',
                  'flipped-180',
                  'flipped-270',
                ]}
                onCommit={(raw) =>
                  updateActiveOutput({
                    transform: (raw.trim() || 'normal') as SwayConfigModel['outputs'][number]['transform'],
                  })
                }
                onAutoDetect={() => 'normal'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-vrr" className={labelClass}>
                {tr(lang, 'Adaptive Sync (VRR)', 'Adaptive Sync (VRR)')}
              </label>
              <SmartInput
                id="output-vrr"
                type="text"
                compact
                lang={lang}
                value={activeDisplay?.adaptiveSync ?? 'off'}
                placeholder="off"
                options={['off', 'on']}
                onCommit={(raw) =>
                  updateActiveOutput({
                    adaptiveSync: (raw.trim() || 'off') as 'on' | 'off',
                  })
                }
                onAutoDetect={() => 'off'}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="output-bg" className={labelClass}>
                {tr(lang, 'Обои / цвет фона (output * bg)', 'Wallpaper / Background (output * bg)')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-7 flex items-center gap-2">
                  <input
                    type="color"
                    aria-label={tr(lang, 'Цвет фона рабочего стола', 'Desktop background color')}
                    value={
                      bgOutput?.background && /^#[0-9a-fA-F]{6}$/.test(bgOutput.background)
                        ? bgOutput.background
                        : '#0F172A'
                    }
                    onChange={(e) =>
                      updateBgOutput({
                        background: e.target.value.toUpperCase(),
                        backgroundMode: 'solid_color',
                      })
                    }
                    className="w-9 h-9 rounded bg-transparent border border-slate-700 cursor-pointer shrink-0"
                  />
                  <SmartInput
                    id="output-bg"
                    type="text"
                    allowEmpty
                    compact
                    lang={lang}
                    wrapperClassName="flex-1"
                    value={bgOutput?.background ?? '#0F172A'}
                    placeholder={tr(lang, '#HEX цвет или путь к изображению', '#HEX color or image path')}
                    options={[palette.wallpaper, '#0F172A', '#2E3440', '~/Pictures/wallpaper.png']}
                    onCommit={(raw) => updateBgOutput({ background: raw })}
                    onAutoDetect={() => palette.wallpaper}
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-5">
                  <SmartInput
                    type="text"
                    compact
                    lang={lang}
                    ariaLabel={tr(lang, 'Режим обоев', 'Wallpaper mode')}
                    value={bgOutput?.backgroundMode ?? 'solid_color'}
                    placeholder="solid_color"
                    options={['solid_color', 'fill', 'fit', 'stretch', 'center', 'tile']}
                    onCommit={(raw) =>
                      updateBgOutput({
                        backgroundMode: (raw.trim() || 'solid_color') as SwayConfigModel['outputs'][number]['backgroundMode'],
                      })
                    }
                    onAutoDetect={() => 'solid_color'}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Клавиатура (input type:keyboard)', 'Keyboard (input type:keyboard)')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="xkb-layout" className={labelClass}>
                {tr(lang, 'Раскладки (xkb_layout)', 'Layouts (xkb_layout)')}
              </label>
              <SmartInput
                id="xkb-layout"
                type="text"
                compact
                lang={lang}
                value={keyboard?.xkbLayout ?? 'us,ru'}
                placeholder="us,ru"
                options={['us,ru', 'us', 'us,de', 'us,ua', 'us,ru,ua']}
                onCommit={(raw) => updateKeyboard({ xkbLayout: raw })}
                onAutoDetect={() => detectKeyboardLayouts(lang)}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="xkb-variant" className={labelClass}>
                {tr(lang, 'Вариант (xkb_variant)', 'Variant (xkb_variant)')}
              </label>
              <SmartInput
                id="xkb-variant"
                type="text"
                allowEmpty
                compact
                lang={lang}
                placeholder={tr(lang, 'Напр.: ,typewriter', 'e.g. ,typewriter')}
                value={keyboard?.xkbVariant ?? ''}
                options={[
                  { value: '', label: tr(lang, 'по умолчанию', 'default') },
                  ',typewriter',
                  'dvorak',
                  'colemak',
                ]}
                onCommit={(raw) => updateKeyboard({ xkbVariant: raw })}
                onAutoDetect={() => (keyboard?.xkbLayout?.includes(',') ? ',' : '')}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="xkb-options" className={labelClass}>
                {tr(lang, 'Переключение (xkb_options)', 'Toggle (xkb_options)')}
              </label>
              <SmartInput
                id="xkb-options"
                type="text"
                allowEmpty
                compact
                lang={lang}
                value={keyboard?.xkbOptions ?? 'grp:alt_shift_toggle'}
                placeholder="grp:alt_shift_toggle"
                options={[
                  { value: 'grp:alt_shift_toggle', label: 'Alt + Shift' },
                  { value: 'grp:caps_toggle', label: 'Caps Lock' },
                  { value: 'grp:win_space_toggle', label: 'Win + Space' },
                  { value: 'grp:ctrl_shift_toggle', label: 'Ctrl + Shift' },
                  { value: 'grp:alt_shift_toggle,caps:escape', label: 'Alt+Shift + Caps=Esc' },
                ]}
                onCommit={(raw) => updateKeyboard({ xkbOptions: raw })}
                onAutoDetect={() => 'grp:alt_shift_toggle'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="kb-repeat-delay" className={labelClass}>
                {tr(lang, 'Задержка повтора (repeat_delay мс)', 'Repeat Delay (ms)')}
              </label>
              <SmartInput
                id="kb-repeat-delay"
                type="number"
                min={100}
                max={1000}
                step={25}
                compact
                lang={lang}
                placeholder="300"
                value={keyboard?.repeatDelay ?? 300}
                options={['200', '250', '300', '400', '600']}
                onCommit={(raw) =>
                  updateKeyboard({ repeatDelay: Number(raw) || 300 })
                }
                onAutoDetect={() => 300}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="kb-repeat-rate" className={labelClass}>
                {tr(lang, 'Скорость повтора (repeat_rate /с)', 'Repeat Rate (/s)')}
              </label>
              <SmartInput
                id="kb-repeat-rate"
                type="number"
                min={10}
                max={120}
                step={5}
                compact
                lang={lang}
                placeholder="35"
                value={keyboard?.repeatRate ?? 35}
                options={['25', '35', '45', '60', '80']}
                onCommit={(raw) =>
                  updateKeyboard({ repeatRate: Number(raw) || 35 })
                }
                onAutoDetect={() => 35}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="kb-numlock" className={labelClass}>
                {tr(lang, 'NumLock при старте (xkb_numlock)', 'Initial NumLock')}
              </label>
              <SmartInput
                id="kb-numlock"
                type="text"
                compact
                lang={lang}
                value={keyboard?.xkbNumlock ?? 'disabled'}
                placeholder="disabled"
                options={['disabled', 'enabled']}
                onCommit={(raw) =>
                  updateKeyboard({ xkbNumlock: (raw.trim() || 'disabled') as 'enabled' | 'disabled' })
                }
                onAutoDetect={() => 'disabled'}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Touchpad & Pointer */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Тачпад и указатель (input type:touchpad)', 'Touchpad & Pointer (input type:touchpad)')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="touchpad-tap" className={labelClass}>
                {tr(lang, 'Клик касанием (tap)', 'Tap to Click (tap)')}
              </label>
              <SmartInput
                id="touchpad-tap"
                type="text"
                compact
                lang={lang}
                value={touchpad?.tap ?? 'enabled'}
                placeholder="enabled"
                options={['enabled', 'disabled']}
                onCommit={(raw) =>
                  updateTouchpad({ tap: (raw.trim() || 'enabled') as 'enabled' | 'disabled' })
                }
                onAutoDetect={() => 'enabled'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="touchpad-scroll" className={labelClass}>
                {tr(lang, 'Natural Scroll', 'Natural Scroll')}
              </label>
              <SmartInput
                id="touchpad-scroll"
                type="text"
                compact
                lang={lang}
                value={touchpad?.naturalScroll ?? 'enabled'}
                placeholder="enabled"
                options={['enabled', 'disabled']}
                onCommit={(raw) =>
                  updateTouchpad({ naturalScroll: (raw.trim() || 'enabled') as 'enabled' | 'disabled' })
                }
                onAutoDetect={() => 'enabled'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="touchpad-dwt" className={labelClass}>
                {tr(lang, 'Откл. при печати (dwt)', 'Disable While Typing (dwt)')}
              </label>
              <SmartInput
                id="touchpad-dwt"
                type="text"
                compact
                lang={lang}
                value={touchpad?.dwt ?? 'enabled'}
                placeholder="enabled"
                options={['enabled', 'disabled']}
                onCommit={(raw) =>
                  updateTouchpad({ dwt: (raw.trim() || 'enabled') as 'enabled' | 'disabled' })
                }
                onAutoDetect={() => 'enabled'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="touchpad-middle" className={labelClass}>
                {tr(lang, 'Средняя кнопка (middle_emulation)', 'Middle Click Emulation')}
              </label>
              <SmartInput
                id="touchpad-middle"
                type="text"
                compact
                lang={lang}
                value={touchpad?.middleEmulation ?? 'enabled'}
                placeholder="enabled"
                options={['enabled', 'disabled']}
                onCommit={(raw) =>
                  updateTouchpad({ middleEmulation: (raw.trim() || 'enabled') as 'enabled' | 'disabled' })
                }
                onAutoDetect={() => 'enabled'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="touchpad-accel-prof" className={labelClass}>
                {tr(lang, 'Профиль ускорения (accel_profile)', 'Acceleration Profile')}
              </label>
              <SmartInput
                id="touchpad-accel-prof"
                type="text"
                compact
                lang={lang}
                value={touchpad?.accelProfile ?? 'adaptive'}
                placeholder="adaptive"
                options={['adaptive', 'flat']}
                onCommit={(raw) =>
                  updateTouchpad({ accelProfile: (raw.trim() || 'adaptive') as 'adaptive' | 'flat' })
                }
                onAutoDetect={() => 'adaptive'}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="touchpad-accel" className="block text-xs font-medium text-slate-300">
                {tr(lang, 'Скорость (pointer_accel)', 'Pointer Speed')}
              </label>
              <SmartInput
                id="touchpad-accel"
                type="number"
                min={-1}
                max={1}
                step={0.1}
                compact
                lang={lang}
                placeholder="0"
                value={Number((touchpad?.accelSpeed ?? 0).toFixed(1))}
                options={['-0.5', '-0.2', '0', '0.2', '0.4', '0.6', '0.8']}
                onCommit={(raw) => {
                  const num = Number(raw);
                  if (!Number.isNaN(num)) {
                    updateTouchpad({ accelSpeed: Math.min(1, Math.max(-1, num)) });
                  }
                }}
                onAutoDetect={() => 0}
                className={inputClass}
              />
              <input
                aria-label={tr(lang, 'Ползунок скорости указателя', 'Pointer acceleration slider')}
                type="range"
                min={-1}
                max={1}
                step={0.1}
                value={touchpad?.accelSpeed ?? 0}
                onChange={(e) => updateTouchpad({ accelSpeed: Number(e.target.value) })}
                className="w-full accent-sky-400"
              />
            </div>

            <div>
              <label htmlFor="touchpad-scroll-method" className={labelClass}>
                {tr(lang, 'Метод прокрутки (scroll_method)', 'Scroll Method')}
              </label>
              <SmartInput
                id="touchpad-scroll-method"
                type="text"
                compact
                lang={lang}
                value={touchpad?.scrollMethod ?? 'two_finger'}
                placeholder="two_finger"
                options={['two_finger', 'edge', 'on_button_down', 'none']}
                onCommit={(raw) =>
                  updateTouchpad({
                    scrollMethod: (raw.trim() || 'two_finger') as SwayConfigModel['inputs'][number]['scrollMethod'],
                  })
                }
                onAutoDetect={() => 'two_finger'}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="touchpad-scroll-factor" className={labelClass}>
                {tr(lang, 'Множитель прокрутки (scroll_factor)', 'Scroll Factor')}
              </label>
              <SmartInput
                id="touchpad-scroll-factor"
                type="number"
                min={0.2}
                max={3}
                step={0.1}
                compact
                lang={lang}
                placeholder="1.0"
                value={touchpad?.scrollFactor ?? 1}
                options={['0.5', '0.8', '1', '1.2', '1.5', '2']}
                onCommit={(raw) =>
                  updateTouchpad({ scrollFactor: Number(raw) || 1 })
                }
                onAutoDetect={() => 1}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'keybindings') {
    const filtered = sway.keybindings.filter(
      (kb) =>
        kb.keys.toLowerCase().includes(bindSearch.toLowerCase()) ||
        kb.command.toLowerCase().includes(bindSearch.toLowerCase())
    );

    const handleAddBinding = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBindKeys.trim() || !newBindCmd.trim()) return;
      onUpdateSway((prev) => ({
        ...prev,
        keybindings: [
          ...prev.keybindings,
          {
            id: `bind-${Date.now()}`,
            ...(newBindFlags ? { flags: newBindFlags } : {}),
            keys: newBindKeys.trim(),
            command: newBindCmd.trim(),
          },
        ],
      }));
      setNewBindKeys('');
      setNewBindCmd('');
      setNewBindFlags('');
    };

    const quickRecipes: Array<{ label: string; flags?: string; keys: string; command: string }> = [
      {
        label: tr(lang, '+ Громкость (wpctl)', '+ Volume (wpctl)'),
        flags: '--locked',
        keys: 'XF86AudioRaiseVolume',
        command: 'exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+',
      },
      {
        label: tr(lang, '+ Яркость (brightnessctl)', '+ Brightness'),
        keys: 'XF86MonBrightnessUp',
        command: 'exec brightnessctl set +5%',
      },
      {
        label: tr(lang, '+ Скриншот области (satty)', '+ Area Screenshot (satty)'),
        keys: '$mod+Shift+s',
        command: 'exec grim -g "$(slurp)" - | satty --filename -',
      },
      {
        label: tr(lang, '+ Блокировка (swaylock)', '+ Lock Screen'),
        keys: '$mod+Escape',
        command: 'exec swaylock -f',
      },
      {
        label: tr(lang, '+ Буфер обмена (cliphist)', '+ Clipboard (cliphist)'),
        keys: '$mod+v',
        command: 'exec cliphist list | wofi --dmenu | cliphist decode | wl-copy',
      },
    ];

    return (
      <div key="section-keybindings" className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {tr(lang, 'Горячие клавиши (bindsym)', 'Keybindings (bindsym)')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                `Всего ${sway.keybindings.length} комбинаций. Поддерживаются флаги (--locked, --inhibited) и быстрые рецепты.`,
                `${sway.keybindings.length} bindings configured. Supports Sway flags (--locked, --inhibited) and inline editing.`
              )}
            </p>
          </div>
          <SmartInput
            type="search"
            allowEmpty
            compact
            lang={lang}
            wrapperClassName="w-64"
            ariaLabel={tr(lang, 'Поиск горячих клавиш', 'Search keybindings')}
            placeholder={tr(lang, 'Фильтр по клавише или команде...', 'Filter keys or commands...')}
            value={bindSearch}
            options={['$mod', 'exec', 'workspace', 'move', 'XF86']}
            onCommit={setBindSearch}
            onAutoDetect={() => '$mod'}
            className="px-3 py-1.5 text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Quick recipe chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {quickRecipes.map((rec) => (
            <button
              key={rec.keys}
              type="button"
              onClick={() => {
                setNewBindFlags(rec.flags ?? '');
                setNewBindKeys(rec.keys);
                setNewBindCmd(rec.command);
              }}
              className="px-2.5 py-1 text-[11px] font-medium rounded-md border border-slate-800 bg-[#090D14] text-slate-300 hover:border-sky-400/50 hover:text-sky-300 transition-colors"
            >
              {rec.label}
            </button>
          ))}
        </div>

        {/* Add Keybinding Form */}
        <form onSubmit={handleAddBinding} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 sm:col-span-3">
            <label htmlFor="new-bind-flags" className={labelClass}>
              {tr(lang, 'Флаг', 'Flag')}
            </label>
            <SmartInput
              id="new-bind-flags"
              type="text"
              allowEmpty
              compact
              lang={lang}
              value={newBindFlags}
              placeholder={tr(lang, 'Без флага', 'None')}
              options={[
                { value: '', label: tr(lang, 'без флага', 'none') },
                '--locked',
                '--inhibited',
                '--no-repeat',
                '--release',
              ]}
              onCommit={setNewBindFlags}
              onAutoDetect={() => ''}
              className={inputClass}
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <label htmlFor="new-bind-keys" className={labelClass}>
              {tr(lang, 'Комбинация', 'Keys')}
            </label>
            <SmartInput
              id="new-bind-keys"
              type="text"
              allowEmpty
              compact
              lang={lang}
              placeholder="$mod+Shift+x"
              value={newBindKeys}
              options={[
                '$mod+b',
                '$mod+e',
                '$mod+Shift+s',
                '$mod+Escape',
                '$mod+v',
                'XF86AudioRaiseVolume',
              ]}
              onCommit={setNewBindKeys}
              onAutoDetect={() => {
                const s = detectSuggestedBinding(sway, packageAnalysis);
                setNewBindFlags(s.flags);
                setNewBindCmd(s.command);
                return s.keys;
              }}
              className={inputClass}
            />
          </div>
          <div className="col-span-9 sm:col-span-4">
            <label htmlFor="new-bind-cmd" className={labelClass}>
              {tr(lang, 'Команда Sway', 'Sway Command')}
            </label>
            <SmartInput
              id="new-bind-cmd"
              type="text"
              allowEmpty
              compact
              lang={lang}
              placeholder="exec firefox"
              value={newBindCmd}
              options={[
                'exec firefox',
                'exec thunar',
                'exec swaylock -f',
                'exec grim -g "$(slurp)" - | wl-copy',
                'kill',
                'floating toggle',
              ]}
              onCommit={setNewBindCmd}
              onAutoDetect={() =>
                newBindKeys.trim()
                  ? detectBindingCommandFromKeys(newBindKeys, sway, packageAnalysis)
                  : detectSuggestedBinding(sway, packageAnalysis).command
              }
              className={inputClass}
            />
          </div>
          <div className="col-span-3 sm:col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 inline-flex items-center justify-center gap-1 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              {tr(lang, 'Добавить', 'Add')}
            </button>
          </div>
        </form>

        {/* Editable Table of keybindings */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden divide-y divide-slate-800/70">
          {filtered.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 text-center">
              {tr(lang, 'Комбинации не найдены.', 'No matching keybindings.')}
            </div>
          ) : (
            filtered.map((kb) => (
              <div
                key={kb.id}
                className="px-3 py-2 flex items-center justify-between gap-2 bg-[#090D14] hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {kb.flags && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 shrink-0">
                      {kb.flags}
                    </span>
                  )}
                  <span className="font-mono text-xs text-sky-300 w-36 shrink-0 truncate">
                    {kb.keys}
                  </span>
                  <SmartInput
                    type="text"
                    compact
                    lang={lang}
                    wrapperClassName="flex-1 min-w-0"
                    ariaLabel={tr(lang, `Команда для ${kb.keys}`, `Command for ${kb.keys}`)}
                    placeholder={tr(lang, 'Команда Sway, напр.: exec foot', 'Sway command, e.g. exec foot')}
                    value={kb.command}
                    options={[
                      'exec $term',
                      'exec $menu',
                      'kill',
                      'floating toggle',
                      'fullscreen',
                      'reload',
                      'split toggle',
                    ]}
                    onCommit={(command) => {
                      onUpdateSway((prev) => ({
                        ...prev,
                        keybindings: prev.keybindings.map((item) =>
                          item.id === kb.id ? { ...item, command } : item
                        ),
                      }));
                    }}
                    onAutoDetect={() => detectBindingCommandFromKeys(kb.keys, sway, packageAnalysis)}
                    className="bg-transparent font-mono text-xs text-slate-300 focus:text-slate-100 focus:outline-none border-b border-transparent focus:border-sky-400 py-0.5"
                  />
                </div>
                <button
                  type="button"
                  aria-label={tr(lang, `Удалить комбинацию ${kb.keys}`, `Delete binding ${kb.keys}`)}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      keybindings: prev.keybindings.filter((item) => item.id !== kb.id),
                    }))
                  }
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === 'panel') {
    const panelEngine = !sway.bar.enabled
      ? 'none'
      : sway.bar.swaybarCommand === 'waybar'
      ? 'waybar'
      : 'swaybar';

    const toggleModuleInZone = (zone: 'left' | 'center' | 'right', modId: string) => {
      onUpdateWaybar((prev) => {
        const key =
          zone === 'left' ? 'modulesLeft' : zone === 'center' ? 'modulesCenter' : 'modulesRight';
        const list = prev[key];
        const exists = list.includes(modId);
        return {
          ...prev,
          [key]: exists ? list.filter((m) => m !== modId) : [...list, modId],
        };
      });
    };

    const moveModuleInZone = (zone: 'left' | 'center' | 'right', index: number, dir: -1 | 1) => {
      onUpdateWaybar((prev) => {
        const key =
          zone === 'left' ? 'modulesLeft' : zone === 'center' ? 'modulesCenter' : 'modulesRight';
        const list = [...prev[key]];
        const targetIdx = index + dir;
        if (targetIdx < 0 || targetIdx >= list.length) return prev;
        const [item] = list.splice(index, 1);
        list.splice(targetIdx, 0, item);
        return { ...prev, [key]: list };
      });
    };

    const activeZoneKey =
      waybarZoneTarget === 'left'
        ? 'modulesLeft'
        : waybarZoneTarget === 'center'
        ? 'modulesCenter'
        : 'modulesRight';
    const activeZoneList = waybar[activeZoneKey];

    return (
      <div key="section-panel" className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {tr(lang, 'Панель состояния: Waybar и Swaybar', 'Status Bar: Waybar & Swaybar')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Глубокая настройка макета, порядка модулей, интервалов, порогов и CSS-стиля.',
                'Fine-grained control over bar geometry, module order, intervals, thresholds, and CSS styling.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#090D14] border border-slate-800 rounded-lg">
            {(
              [
                { id: 'waybar', label: 'Waybar' },
                { id: 'swaybar', label: 'Swaybar' },
                { id: 'none', label: tr(lang, 'Без панели', 'Disabled') },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === 'none') {
                    onUpdateSway((prev) => ({ ...prev, bar: { ...prev.bar, enabled: false } }));
                  } else {
                    onUpdateSway((prev) => ({
                      ...prev,
                      bar: { ...prev.bar, enabled: true, swaybarCommand: opt.id },
                    }));
                    if (opt.id === 'waybar') {
                      onUpdateWaybar((prev) => ({ ...prev, enabled: true }));
                    }
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  panelEngine === opt.id
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {panelEngine === 'waybar' && (
          <div className="space-y-5">
            {/* Waybar Sub-tabs */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-3" role="tablist">
              {(
                [
                  { id: 'layout', label: tr(lang, 'Макет и зоны', 'Layout & Zones') },
                  { id: 'modules', label: tr(lang, 'Модули и параметры', 'Modules & Params') },
                  { id: 'style', label: tr(lang, 'Стиль и цвета', 'Style & Colors') },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={waybarSubTab === tab.id}
                  onClick={() => setWaybarSubTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    waybarSubTab === tab.id
                      ? 'bg-slate-800 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {waybarSubTab === 'layout' && (
              <div key="waybar-layout" className="space-y-5">
                {/* Geometry */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label htmlFor="wb-pos" className={labelClass}>
                      {tr(lang, 'Позиция', 'Position')}
                    </label>
                    <SmartInput
                      id="wb-pos"
                      type="text"
                      compact
                      lang={lang}
                      value={waybar.position}
                      placeholder="top"
                      options={[
                        { value: 'top', label: tr(lang, 'сверху', 'top') },
                        { value: 'bottom', label: tr(lang, 'снизу', 'bottom') },
                      ]}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          position: (raw.trim() || 'top') as 'top' | 'bottom',
                        }))
                      }
                      onAutoDetect={() => 'top'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-layer" className={labelClass}>
                      {tr(lang, 'Слой (layer)', 'Layer')}
                    </label>
                    <SmartInput
                      id="wb-layer"
                      type="text"
                      compact
                      lang={lang}
                      value={waybar.layer}
                      placeholder="top"
                      options={['top', 'bottom', 'overlay']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          layer: (raw.trim() || 'top') as 'top' | 'bottom' | 'overlay',
                        }))
                      }
                      onAutoDetect={() => 'top'}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-height" className={labelClass}>
                      {tr(lang, 'Высота (px)', 'Height (px)')}
                    </label>
                    <SmartInput
                      id="wb-height"
                      type="number"
                      min={20}
                      max={64}
                      compact
                      lang={lang}
                      placeholder="32"
                      value={waybar.height}
                      options={['26', '28', '32', '36', '40', '44']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, height: Number(raw) || 32 }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 36 : 32)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-spacing" className={labelClass}>
                      {tr(lang, 'Интервал (spacing)', 'Spacing (px)')}
                    </label>
                    <SmartInput
                      id="wb-spacing"
                      type="number"
                      min={0}
                      max={24}
                      compact
                      lang={lang}
                      placeholder="6"
                      value={waybar.spacing}
                      options={['0', '4', '6', '8', '10', '12']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, spacing: Number(raw) || 0 }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 8 : 6)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-margin-top" className={labelClass}>
                      {waybar.position === 'top'
                        ? tr(lang, 'Отступ сверху', 'Margin Top')
                        : tr(lang, 'Отступ снизу', 'Margin Bottom')}
                    </label>
                    <SmartInput
                      id="wb-margin-top"
                      type="number"
                      min={0}
                      max={24}
                      compact
                      lang={lang}
                      placeholder="8"
                      value={waybar.position === 'top' ? waybar.marginTop : waybar.marginBottom}
                      options={['0', '4', '6', '8', '12']}
                      onCommit={(raw) => {
                        const val = Number(raw) || 0;
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          marginTop: prev.position === 'top' ? val : prev.marginTop,
                          marginBottom: prev.position === 'bottom' ? val : prev.marginBottom,
                        }));
                      }}
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 8 : 0)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-margin-left" className={labelClass}>
                      {tr(lang, 'Отступ слева', 'Margin Left')}
                    </label>
                    <SmartInput
                      id="wb-margin-left"
                      type="number"
                      min={0}
                      max={32}
                      compact
                      lang={lang}
                      placeholder="12"
                      value={waybar.marginLeft}
                      options={['0', '6', '8', '12', '16']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          marginLeft: Number(raw) || 0,
                        }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 12 : 0)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-margin-right" className={labelClass}>
                      {tr(lang, 'Отступ справа', 'Margin Right')}
                    </label>
                    <SmartInput
                      id="wb-margin-right"
                      type="number"
                      min={0}
                      max={32}
                      compact
                      lang={lang}
                      placeholder="12"
                      value={waybar.marginRight}
                      options={['0', '6', '8', '12', '16']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          marginRight: Number(raw) || 0,
                        }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 12 : 0)}
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-end pb-1">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={waybar.reloadStyleOnChange ?? true}
                        onChange={(e) =>
                          onUpdateWaybar((prev) => ({
                            ...prev,
                            reloadStyleOnChange: e.target.checked,
                          }))
                        }
                        className="accent-sky-400"
                      />
                      <span>reload_style_on_change</span>
                    </label>
                  </div>
                </div>

                {/* Zone Ordering & Toggle */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold text-slate-200">
                      {tr(lang, 'Модули Waybar по зонам и порядок', 'Waybar Modules & Ordering')}
                    </h3>
                    <div className="flex items-center gap-1 p-0.5 bg-[#090D14] border border-slate-800 rounded-md">
                      {(
                        [
                          { id: 'left', label: tr(lang, 'Слева', 'Left') },
                          { id: 'center', label: tr(lang, 'Центр', 'Center') },
                          { id: 'right', label: tr(lang, 'Справа', 'Right') },
                        ] as const
                      ).map((z) => (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => setWaybarZoneTarget(z.id)}
                          className={`px-2.5 py-1 text-xs rounded transition-colors ${
                            waybarZoneTarget === z.id
                              ? 'bg-slate-800 text-sky-300 font-medium'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {z.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Active Zone Ordered Strip */}
                  <div className="p-2.5 rounded-lg border border-slate-800 bg-[#090D14] flex flex-wrap items-center gap-1.5">
                    {activeZoneList.length === 0 ? (
                      <span className="text-xs text-slate-500">
                        {tr(lang, 'В этой зоне нет модулей.', 'No modules in this zone.')}
                      </span>
                    ) : (
                      activeZoneList.map((modId, idx) => (
                        <div
                          key={`${modId}-${idx}`}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-xs font-mono text-sky-200"
                        >
                          <button
                            type="button"
                            disabled={idx === 0}
                            aria-label={tr(lang, `Сдвинуть ${modId} влево`, `Move ${modId} left`)}
                            onClick={() => moveModuleInZone(waybarZoneTarget, idx, -1)}
                            className="text-slate-400 hover:text-slate-100 disabled:opacity-30"
                          >
                            <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <span>{modId}</span>
                          <button
                            type="button"
                            disabled={idx === activeZoneList.length - 1}
                            aria-label={tr(lang, `Сдвинуть ${modId} вправо`, `Move ${modId} right`)}
                            onClick={() => moveModuleInZone(waybarZoneTarget, idx, 1)}
                            className="text-slate-400 hover:text-slate-100 disabled:opacity-30"
                          >
                            <ArrowRight className="w-3 h-3" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            aria-label={tr(lang, `Убрать ${modId}`, `Remove ${modId}`)}
                            onClick={() => toggleModuleInZone(waybarZoneTarget, modId)}
                            className="text-slate-400 hover:text-rose-400 ml-0.5"
                          >
                            <X className="w-3 h-3" aria-hidden="true" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {AVAILABLE_WAYBAR_MODULES.map((mod) => {
                      const activeInZone = activeZoneList.includes(mod.id);
                      const desc =
                        lang === 'en' && WAYBAR_MODULE_DESC_EN[mod.id]
                          ? WAYBAR_MODULE_DESC_EN[mod.id]
                          : mod.description;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleModuleInZone(waybarZoneTarget, mod.id)}
                          className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                            activeInZone
                              ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
                              : 'bg-[#090D14] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                          }`}
                        >
                          <div className="font-mono text-xs truncate">{mod.label}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">{desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {waybarSubTab === 'modules' && (
              <div key="waybar-modules" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wb-fmt-clock" className={labelClass}>
                    clock.format
                  </label>
                  <SmartInput
                    id="wb-fmt-clock"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="{:%I:%M %p}"
                    value={waybar.clockFormat}
                    options={['{:%H:%M}', '{:%I:%M %p}', '{:%d.%m %H:%M}', '{:%a %d %b %H:%M}']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, clockFormat: raw }))
                    }
                    onAutoDetect={() => (lang === 'en' ? '{:%I:%M %p}' : '{:%H:%M}')}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-fmt-ws" className={labelClass}>
                    sway/workspaces.format
                  </label>
                  <SmartInput
                    id="wb-fmt-ws"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="{name}"
                    value={waybar.workspaceFormat ?? '{name}'}
                    options={['{name}', '{icon}', '{index}: {name}']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, workspaceFormat: raw }))
                    }
                    onAutoDetect={() => '{name}'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-win-len" className={labelClass}>
                    sway/window.max-length
                  </label>
                  <SmartInput
                    id="wb-win-len"
                    type="number"
                    min={10}
                    max={120}
                    compact
                    lang={lang}
                    placeholder="42"
                    value={waybar.windowMaxLength ?? 42}
                    options={['24', '32', '42', '56', '80']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        windowMaxLength: Number(raw) || 42,
                      }))
                    }
                    onAutoDetect={() => 42}
                    className={inputClass}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={waybar.disableWorkspaceScroll}
                      onChange={(e) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          disableWorkspaceScroll: e.target.checked,
                        }))
                      }
                      className="accent-sky-400"
                    />
                    <span>sway/workspaces.disable-scroll</span>
                  </label>
                </div>

                <div>
                  <label htmlFor="wb-fmt-cpu" className={labelClass}>
                    cpu.format
                  </label>
                  <SmartInput
                    id="wb-fmt-cpu"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="CPU {usage}%"
                    value={waybar.cpuFormat}
                    options={['CPU {usage}%', ' {usage}%', '{usage}%']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, cpuFormat: raw }))
                    }
                    onAutoDetect={() => 'CPU {usage}%'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-int-cpu" className={labelClass}>
                    {tr(lang, 'cpu.interval (сек)', 'cpu.interval (sec)')}
                  </label>
                  <SmartInput
                    id="wb-int-cpu"
                    type="number"
                    min={1}
                    max={60}
                    compact
                    lang={lang}
                    placeholder="5"
                    value={waybar.cpuInterval ?? 5}
                    options={['1', '2', '5', '10']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        cpuInterval: Number(raw) || 5,
                      }))
                    }
                    onAutoDetect={() => 2}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wb-fmt-mem" className={labelClass}>
                    memory.format
                  </label>
                  <SmartInput
                    id="wb-fmt-mem"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="󰍛 {used:0.1f}gb"
                    value={waybar.memoryFormat}
                    options={['󰍛 {used:0.1f}gb', 'RAM {percentage}%', '{used:0.1f}G / {total:0.1f}G']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, memoryFormat: raw }))
                    }
                    onAutoDetect={() => '󰍛 {used:0.1f}gb'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-int-mem" className={labelClass}>
                    {tr(lang, 'memory.interval (сек)', 'memory.interval (sec)')}
                  </label>
                  <SmartInput
                    id="wb-int-mem"
                    type="number"
                    min={1}
                    max={60}
                    compact
                    lang={lang}
                    placeholder="5"
                    value={waybar.memoryInterval ?? 5}
                    options={['2', '5', '10', '15']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        memoryInterval: Number(raw) || 5,
                      }))
                    }
                    onAutoDetect={() => 5}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wb-fmt-temp" className={labelClass}>
                    temperature.format
                  </label>
                  <SmartInput
                    id="wb-fmt-temp"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="{temperatureC}°C"
                    value={waybar.temperatureFormat ?? '{temperatureC}°C'}
                    options={['{temperatureC}°C', ' {temperatureC}°C', '{temperatureC}°']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, temperatureFormat: raw }))
                    }
                    onAutoDetect={() => '{temperatureC}°C'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-crit-temp" className={labelClass}>
                    temperature.critical-threshold (°C)
                  </label>
                  <SmartInput
                    id="wb-crit-temp"
                    type="number"
                    min={50}
                    max={110}
                    compact
                    lang={lang}
                    placeholder="85"
                    value={waybar.temperatureCriticalThreshold ?? 85}
                    options={['75', '80', '85', '90', '95']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        temperatureCriticalThreshold: Number(raw) || 85,
                      }))
                    }
                    onAutoDetect={() => 85}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wb-fmt-wifi" className={labelClass}>
                    network.format-wifi
                  </label>
                  <SmartInput
                    id="wb-fmt-wifi"
                    type="text"
                    compact
                    lang={lang}
                    placeholder=" {essid}"
                    value={waybar.networkFormatWifi}
                    options={[' {essid}', ' {signalStrength}%', '{essid} ({signalStrength}%)']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, networkFormatWifi: raw }))
                    }
                    onAutoDetect={() => ' {essid}'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-fmt-eth" className={labelClass}>
                    network.format-ethernet
                  </label>
                  <SmartInput
                    id="wb-fmt-eth"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="ETH {ipaddr}"
                    value={waybar.networkFormatEthernet ?? 'ETH {ipaddr}'}
                    options={['ETH {ipaddr}', '󰈀 {ipaddr}/{cidr}', 'connected']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, networkFormatEthernet: raw }))
                    }
                    onAutoDetect={() => 'ETH {ipaddr}'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wb-fmt-vol" className={labelClass}>
                    pulseaudio.format
                  </label>
                  <SmartInput
                    id="wb-fmt-vol"
                    type="text"
                    compact
                    lang={lang}
                    placeholder=" {volume}%"
                    value={waybar.pulseaudioFormat}
                    options={[' {volume}%', 'VOL {volume}%', '{icon} {volume}%']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, pulseaudioFormat: raw }))
                    }
                    onAutoDetect={() => ' {volume}%'}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-step-vol" className={labelClass}>
                    pulseaudio.scroll-step (%)
                  </label>
                  <SmartInput
                    id="wb-step-vol"
                    type="number"
                    min={1}
                    max={20}
                    compact
                    lang={lang}
                    placeholder="5"
                    value={waybar.pulseaudioScrollStep ?? 5}
                    options={['1', '2', '5', '10']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        pulseaudioScrollStep: Number(raw) || 5,
                      }))
                    }
                    onAutoDetect={() => 5}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="wb-fmt-bat" className={labelClass}>
                    battery.format
                  </label>
                  <SmartInput
                    id="wb-fmt-bat"
                    type="text"
                    compact
                    lang={lang}
                    placeholder="{capacity}% {icon}"
                    value={waybar.batteryFormat}
                    options={['{capacity}% {icon}', '{icon} {capacity}%', '{capacity}%']}
                    onCommit={(raw) =>
                      onUpdateWaybar((prev) => ({ ...prev, batteryFormat: raw }))
                    }
                    onAutoDetect={() => '{capacity}% {icon}'}
                    className={inputClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="wb-bat-warn" className={labelClass}>
                      battery.warning
                    </label>
                    <SmartInput
                      id="wb-bat-warn"
                      type="number"
                      min={5}
                      max={60}
                      compact
                      lang={lang}
                      placeholder="30"
                      value={waybar.batteryWarning ?? 30}
                      options={['20', '25', '30', '40']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          batteryWarning: Number(raw) || 30,
                        }))
                      }
                      onAutoDetect={() => 30}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="wb-bat-crit" className={labelClass}>
                      battery.critical
                    </label>
                    <SmartInput
                      id="wb-bat-crit"
                      type="number"
                      min={2}
                      max={30}
                      compact
                      lang={lang}
                      placeholder="15"
                      value={waybar.batteryCritical ?? 15}
                      options={['5', '10', '15', '20']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          batteryCritical: Number(raw) || 15,
                        }))
                      }
                      onAutoDetect={() => 15}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wb-tray-size" className={labelClass}>
                    tray.icon-size / spacing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <SmartInput
                      id="wb-tray-size"
                      type="number"
                      min={10}
                      max={28}
                      compact
                      lang={lang}
                      ariaLabel="tray.icon-size"
                      placeholder="16"
                      value={waybar.trayIconSize ?? 16}
                      options={['14', '16', '18', '20', '22']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          trayIconSize: Number(raw) || 16,
                        }))
                      }
                      onAutoDetect={() => (detectDisplayScale() > 1.25 ? 20 : 16)}
                      className={inputClass}
                    />
                    <SmartInput
                      type="number"
                      min={0}
                      max={20}
                      compact
                      lang={lang}
                      ariaLabel="tray.spacing"
                      placeholder="6"
                      value={waybar.traySpacing ?? 6}
                      options={['2', '4', '6', '8', '10']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          traySpacing: Number(raw) || 0,
                        }))
                      }
                      onAutoDetect={() => 6}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wb-launcher-cmd" className={labelClass}>
                    custom/launcher (format / on-click)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <SmartInput
                      type="text"
                      compact
                      lang={lang}
                      ariaLabel="custom/launcher.format"
                      placeholder="󰣇"
                      value={waybar.launcherFormat ?? '󰣇'}
                      options={['󰣇', '', '', 'Apps']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, launcherFormat: raw }))
                      }
                      onAutoDetect={() => '󰣇'}
                      className={inputClass}
                    />
                    <SmartInput
                      id="wb-launcher-cmd"
                      type="text"
                      compact
                      lang={lang}
                      wrapperClassName="col-span-3"
                      placeholder="wofi --show drun"
                      value={waybar.launcherCommand ?? 'wofi --show drun'}
                      options={['wofi --show drun', 'fuzzel', 'rofi -show drun', 'bemenu-run']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, launcherCommand: raw }))
                      }
                      onAutoDetect={() => detectLauncherCommand(sway, packageAnalysis)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="wb-power-cmd" className={labelClass}>
                    custom/power (format / on-click)
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <SmartInput
                      type="text"
                      compact
                      lang={lang}
                      ariaLabel="custom/power.format"
                      placeholder="⏻"
                      value={waybar.powerFormat ?? '⏻'}
                      options={['⏻', '󰐥', '']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, powerFormat: raw }))
                      }
                      onAutoDetect={() => '⏻'}
                      className={inputClass}
                    />
                    <SmartInput
                      id="wb-power-cmd"
                      type="text"
                      compact
                      lang={lang}
                      wrapperClassName="col-span-3"
                      placeholder="swaylock -f"
                      value={waybar.powerCommand ?? 'swaylock -f'}
                      options={['swaylock -f', 'wlogout', 'systemctl suspend', 'swaymsg exit']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({ ...prev, powerCommand: raw }))
                      }
                      onAutoDetect={() => detectWaybarPowerCommand(packageAnalysis)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {waybarSubTab === 'style' && (
              <div key="waybar-style" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="w-60">
                    <SmartInput
                      id="wb-bar-mode"
                      type="text"
                      compact
                      lang={lang}
                      ariaLabel={tr(lang, 'Режим компоновки Waybar', 'Waybar Layout Mode')}
                      value={waybar.style.barMode || 'bar'}
                      placeholder="islands"
                      options={[
                        { value: 'bar', label: tr(lang, 'Цельная панель', 'Unified Bar') },
                        { value: 'islands', label: tr(lang, 'Островки-капсулы', 'Floating Islands') },
                      ]}
                      onCommit={(raw) => {
                        const mode = (raw.trim() || 'bar') as 'bar' | 'islands';
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: {
                            ...prev.style,
                            barMode: mode,
                            background:
                              mode === 'islands'
                                ? 'transparent'
                                : prev.style.background === 'transparent'
                                ? '#0F172A'
                                : prev.style.background,
                            islandBg: prev.style.islandBg || '#2C3438',
                            barRadius:
                              mode === 'islands'
                                ? Math.max(prev.style.barRadius, 18)
                                : prev.style.barRadius,
                          },
                        }));
                      }}
                      onAutoDetect={() => 'islands'}
                      className={inputClass}
                    />
                  </div>

                  <select
                    aria-label={tr(lang, 'Пресет цветов Waybar', 'Waybar Color Preset')}
                    onChange={(e) => {
                      const p = WAYBAR_THEME_PRESETS[e.target.value];
                      if (p) {
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          height: p.height,
                          marginTop: p.marginTop,
                          marginLeft: p.marginLeft,
                          marginRight: p.marginRight,
                          spacing: p.spacing,
                          ...(p.modulesLeft ? { modulesLeft: [...p.modulesLeft] } : {}),
                          ...(p.modulesCenter ? { modulesCenter: [...p.modulesCenter] } : {}),
                          ...(p.modulesRight ? { modulesRight: [...p.modulesRight] } : {}),
                          ...(p.clockFormat ? { clockFormat: p.clockFormat } : {}),
                          ...(p.memoryFormat ? { memoryFormat: p.memoryFormat } : {}),
                          ...(p.networkFormatWifi ? { networkFormatWifi: p.networkFormatWifi } : {}),
                          ...(p.pulseaudioFormat ? { pulseaudioFormat: p.pulseaudioFormat } : {}),
                          ...(p.batteryFormat ? { batteryFormat: p.batteryFormat } : {}),
                          style: { ...p.style },
                        }));
                      }
                    }}
                    defaultValue=""
                    className="px-2.5 py-1.5 text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="" disabled>
                      {tr(lang, 'Применить палитру Waybar...', 'Apply Waybar palette...')}
                    </option>
                    <option value="sway-cobalt">Wayland Cobalt</option>
                    <option value="catppuccin-mocha">Catppuccin Mocha</option>
                    <option value="nord-frost">Nord Frost</option>
                    <option value="gruvbox-dark">Gruvbox Dark</option>
                    <option value="sage-dark">{tr(lang, 'Шалфей · Dark', 'Sage · Dark')}</option>
                    <option value="sage-light">{tr(lang, 'Шалфей · Light', 'Sage · Light')}</option>
                  </select>
                </div>

                {/* CSS Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label htmlFor="wb-css-font" className={labelClass}>
                      font-family (style.css)
                    </label>
                    <SmartInput
                      id="wb-css-font"
                      type="text"
                      compact
                      lang={lang}
                      placeholder="JetBrainsMono Nerd Font"
                      value={waybar.style.fontFamily}
                      options={[
                        'JetBrainsMono Nerd Font',
                        'FiraCode Nerd Font',
                        'Inter',
                        'Iosevka Nerd Font',
                        'monospace',
                      ]}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, fontFamily: raw },
                        }))
                      }
                      onAutoDetect={() => detectFontFamily(sway, packageAnalysis)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="wb-css-fontsize" className={labelClass}>
                      font-size (px)
                    </label>
                    <SmartInput
                      id="wb-css-fontsize"
                      type="number"
                      min={9}
                      max={20}
                      compact
                      lang={lang}
                      placeholder="12"
                      value={waybar.style.fontSize}
                      options={['11', '12', '13', '14', '15']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, fontSize: Number(raw) || 12 },
                        }))
                      }
                      onAutoDetect={() => (detectDisplayScale() > 1.25 ? 14 : 12)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-bar-radius" className={labelClass}>
                      {tr(lang, 'Скругление панели (px)', 'Bar Radius (px)')}
                    </label>
                    <SmartInput
                      id="wb-bar-radius"
                      type="number"
                      min={0}
                      max={24}
                      compact
                      lang={lang}
                      placeholder="18"
                      value={waybar.style.barRadius}
                      options={['0', '6', '10', '14', '18', '22']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, barRadius: Number(raw) || 0 },
                        }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 20 : 0)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-mod-radius" className={labelClass}>
                      {tr(lang, 'Скругление модулей (px)', 'Module Radius (px)')}
                    </label>
                    <SmartInput
                      id="wb-mod-radius"
                      type="number"
                      min={0}
                      max={24}
                      compact
                      lang={lang}
                      placeholder="14"
                      value={waybar.style.borderRadius}
                      options={['0', '6', '10', '14', '18']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, borderRadius: Number(raw) || 0 },
                        }))
                      }
                      onAutoDetect={() => (waybar.style.barMode === 'islands' ? 14 : 6)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-border-width" className={labelClass}>
                      {tr(lang, 'Толщина рамки (px)', 'Border Width (px)')}
                    </label>
                    <SmartInput
                      id="wb-border-width"
                      type="number"
                      min={0}
                      max={4}
                      compact
                      lang={lang}
                      placeholder="1"
                      value={waybar.style.borderWidth ?? 1}
                      options={['0', '1', '2', '3']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, borderWidth: Number(raw) || 0 },
                        }))
                      }
                      onAutoDetect={() => 1}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-pad-x" className={labelClass}>
                      {tr(lang, 'Гориз. отступ модулей (px)', 'Module Padding X (px)')}
                    </label>
                    <SmartInput
                      id="wb-pad-x"
                      type="number"
                      min={2}
                      max={20}
                      compact
                      lang={lang}
                      placeholder="9"
                      value={waybar.style.modulePaddingX ?? 9}
                      options={['4', '6', '8', '9', '12', '16']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, modulePaddingX: Number(raw) || 8 },
                        }))
                      }
                      onAutoDetect={() => 9}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="wb-pad-y" className={labelClass}>
                      {tr(lang, 'Верт. отступ модулей (px)', 'Module Padding Y (px)')}
                    </label>
                    <SmartInput
                      id="wb-pad-y"
                      type="number"
                      min={0}
                      max={12}
                      compact
                      lang={lang}
                      placeholder="2"
                      value={waybar.style.modulePaddingY ?? 2}
                      options={['0', '2', '4', '6']}
                      onCommit={(raw) =>
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, modulePaddingY: Number(raw) || 0 },
                        }))
                      }
                      onAutoDetect={() => 2}
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Color Pickers */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                  {(
                    [
                      {
                        field: waybar.style.barMode === 'islands' ? 'islandBg' : 'background',
                        label:
                          waybar.style.barMode === 'islands'
                            ? tr(lang, 'Фон островков', 'Island Bg')
                            : tr(lang, 'Фон панели', 'Bar Bg'),
                        fallback: '#2C3438',
                      },
                      { field: 'moduleBg', label: tr(lang, 'Фон модулей', 'Module Bg'), fallback: '#1E293B' },
                      { field: 'mutedPillBg', label: tr(lang, 'Неактив. слоты', 'Muted Pill'), fallback: '#3A4246' },
                      { field: 'textColor', label: tr(lang, 'Текст модулей', 'Text Color'), fallback: '#E2E8F0' },
                      { field: 'windowTextColor', label: tr(lang, 'Текст окна', 'Window Text'), fallback: '#D8DDD9' },
                      { field: 'accentColor', label: tr(lang, 'Акцент / фокус', 'Accent Color'), fallback: '#D0C4A8' },
                      { field: 'accentTextColor', label: tr(lang, 'Текст акцента', 'Accent Text'), fallback: '#1C2124' },
                      { field: 'borderColor', label: tr(lang, 'Рамка панели', 'Border Color'), fallback: '#334155' },
                      { field: 'urgentColor', label: tr(lang, 'Срочный цвет', 'Urgent Color'), fallback: '#EF4444' },
                    ] as const
                  ).map((item) => {
                    const rawVal = waybar.style[item.field] || item.fallback;
                    const hexVal = /^#[0-9a-fA-F]{6}$/.test(rawVal) ? rawVal : item.fallback;
                    return (
                      <label
                        key={item.field}
                        className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800 bg-[#090D14] text-xs text-slate-300"
                      >
                        <span className="truncate mr-2">{item.label}</span>
                        <input
                          type="color"
                          value={hexVal}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            onUpdateWaybar((prev) => ({
                              ...prev,
                              style: { ...prev.style, [item.field]: val },
                            }));
                          }}
                          className="w-6 h-6 bg-transparent border border-slate-700 rounded cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {panelEngine === 'swaybar' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sb-pos" className={labelClass}>
                {tr(lang, 'Позиция Swaybar', 'Swaybar Position')}
              </label>
              <SmartInput
                id="sb-pos"
                type="text"
                compact
                lang={lang}
                value={sway.bar.position}
                placeholder="top"
                options={['top', 'bottom']}
                onCommit={(raw) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, position: (raw.trim() || 'top') as 'top' | 'bottom' },
                  }))
                }
                onAutoDetect={() => 'top'}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="sb-height" className={labelClass}>
                {tr(lang, 'Высота (px)', 'Height (px)')}
              </label>
              <SmartInput
                id="sb-height"
                type="number"
                min={18}
                max={50}
                compact
                lang={lang}
                placeholder="28"
                value={sway.bar.height}
                options={['22', '24', '28', '32', '36']}
                onCommit={(raw) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, height: Number(raw) || 26 },
                  }))
                }
                onAutoDetect={() => 28}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="sb-font" className={labelClass}>
                {tr(lang, 'Шрифт (font)', 'Font')}
              </label>
              <SmartInput
                id="sb-font"
                type="text"
                compact
                lang={lang}
                placeholder="JetBrains Mono 10"
                value={sway.bar.font}
                options={[
                  'JetBrainsMono Nerd Font 10',
                  'JetBrains Mono 10',
                  'monospace 10',
                  'Inter 10',
                ]}
                onCommit={(raw) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, font: raw },
                  }))
                }
                onAutoDetect={() => `${detectFontFamily(sway, packageAnalysis)} ${sway.general.fontSize}`}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="sb-tray" className={labelClass}>
                tray_output
              </label>
              <SmartInput
                id="sb-tray"
                type="text"
                compact
                lang={lang}
                placeholder="primary"
                value={sway.bar.trayOutput}
                options={['primary', '*', 'none']}
                onCommit={(raw) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, trayOutput: raw },
                  }))
                }
                onAutoDetect={() => 'primary'}
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sb-cmd" className={labelClass}>
                status_command
              </label>
              <SmartInput
                id="sb-cmd"
                type="text"
                lang={lang}
                placeholder="while date +'%d.%m.%Y %H:%M'; do sleep 1; done"
                value={sway.bar.statusCommand}
                options={[
                  "while date +'%d.%m.%Y %H:%M'; do sleep 1; done",
                  'i3status',
                  'waybar',
                ]}
                onCommit={(raw) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, statusCommand: raw },
                  }))
                }
                onAutoDetect={() => "while date +'%d.%m.%Y %H:%M'; do sleep 1; done"}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {panelEngine === 'none' && (
          <div className="p-4 border border-slate-800 rounded-lg bg-[#090D14] text-xs text-slate-400">
            {tr(
              lang,
              'Панель отключена. Вы можете включить Waybar или встроенный Swaybar переключателем выше.',
              'Status bar disabled. Enable Waybar or built-in Swaybar using the toggle above.'
            )}
          </div>
        )}
      </div>
    );
  }

  // section === 'rules'
  const rulePresets: Array<{
    label: string;
    type: 'for_window' | 'assign' | 'no_focus';
    criteria: string;
    action: string;
  }> = [
    {
      label: tr(lang, '+ Плавающие диалоги', '+ Floating dialogs'),
      type: 'for_window',
      criteria: '[window_role="dialog"]',
      action: 'floating enable',
    },
    {
      label: tr(lang, '+ Браузер на стол 2', '+ Browser -> WS 2'),
      type: 'assign',
      criteria: '[app_id="firefox"]',
      action: 'workspace number 2',
    },
    {
      label: 'no_focus pop-up',
      type: 'no_focus',
      criteria: '[window_role="pop-up"]',
      action: '',
    },
  ];

  const execPresets = [
    'mako',
    'wl-paste --watch cliphist store',
    'nm-applet --indicator',
    'blueman-applet',
    'wlsunset -l 55.7 -L 37.6',
  ];

  return (
    <div key="section-rules" className="p-5 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-slate-100">
          {tr(lang, 'Правила окон и автозапуск', 'Window Rules & Autostart')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {tr(
            lang,
            'Правила for_window / assign / no_focus и фоновые службы через exec / exec_always.',
            'Configure for_window / assign / no_focus directives and exec / exec_always startup daemons.'
          )}
        </p>
      </div>

      {/* Add Rule */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Правила окон', 'Window Rules')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {rulePresets.map((rp) => (
              <button
                key={rp.label}
                type="button"
                onClick={() => {
                  setNewRuleType(rp.type);
                  setNewRuleCriteria(rp.criteria);
                  setNewRuleAction(rp.action);
                }}
                className="px-2 py-1 text-[11px] rounded border border-slate-800 bg-[#090D14] text-slate-300 hover:border-sky-400/50 hover:text-sky-300"
              >
                {rp.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 sm:col-span-3">
            <label htmlFor="rule-type" className={labelClass}>
              {tr(lang, 'Директива', 'Directive')}
            </label>
            <SmartInput
              id="rule-type"
              type="text"
              compact
              lang={lang}
              value={newRuleType}
              placeholder="for_window"
              options={['for_window', 'assign', 'no_focus']}
              onCommit={(raw) =>
                setNewRuleType((raw.trim() || 'for_window') as 'for_window' | 'assign' | 'no_focus')
              }
              onAutoDetect={() => 'for_window'}
              className={inputClass}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <label htmlFor="rule-criteria" className={labelClass}>
              {tr(lang, 'Критерий', 'Criteria')}
            </label>
            <SmartInput
              id="rule-criteria"
              type="text"
              allowEmpty
              compact
              lang={lang}
              placeholder='[app_id="pavucontrol"]'
              value={newRuleCriteria}
              options={[
                '[app_id="org.gnome.Calculator"]',
                '[app_id="pavucontrol"]',
                '[app_id="blueman-manager"]',
                '[window_role="dialog"]',
                '[app_id="firefox"]',
              ]}
              onCommit={setNewRuleCriteria}
              onAutoDetect={() => {
                const s = detectSuggestedWindowRule(sway, packageAnalysis);
                setNewRuleType(s.type);
                setNewRuleAction(s.action);
                return s.criteria;
              }}
              className={inputClass}
            />
          </div>
          <div className="col-span-9 sm:col-span-3">
            <label htmlFor="rule-action" className={labelClass}>
              {tr(lang, 'Действие', 'Action')}
            </label>
            <SmartInput
              id="rule-action"
              type="text"
              allowEmpty
              compact
              lang={lang}
              disabled={newRuleType === 'no_focus'}
              placeholder="floating enable"
              value={newRuleType === 'no_focus' ? '' : newRuleAction}
              options={[
                'floating enable',
                'floating enable, resize set 900 600',
                'workspace number 2',
                'inhibit_idle fullscreen',
                'border pixel 2',
              ]}
              onCommit={setNewRuleAction}
              onAutoDetect={() =>
                newRuleType === 'assign' ? 'workspace number 2' : 'floating enable'
              }
              className={inputClass}
            />
          </div>
          <div className="col-span-3 sm:col-span-2">
            <button
              type="button"
              onClick={() => {
                if (!newRuleCriteria.trim()) return;
                onUpdateSway((prev) => ({
                  ...prev,
                  rules: [
                    ...prev.rules,
                    {
                      id: `rule-${Date.now()}`,
                      type: newRuleType,
                      criteria: newRuleCriteria.trim(),
                      action: newRuleType === 'no_focus' ? '' : newRuleAction.trim(),
                    },
                  ],
                }));
              }}
              className="w-full py-2 px-3 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
            >
              {tr(lang, 'Добавить', 'Add')}
            </button>
          </div>
        </div>

        <div className="border border-slate-800/80 rounded-lg divide-y divide-slate-800/70">
          {sway.rules.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">
              {tr(lang, 'Правила окон пока не добавлены.', 'No window rules added yet.')}
            </div>
          ) : (
            sway.rules.map((r) => (
              <div
                key={r.id}
                className="px-3 py-2 flex items-center justify-between gap-2 bg-[#090D14] text-xs font-mono"
              >
                <div className="truncate text-slate-300">
                  <span className="text-sky-400">{r.type}</span> {r.criteria} {r.action}
                </div>
                <button
                  type="button"
                  aria-label={tr(lang, `Удалить правило ${r.criteria}`, `Delete rule ${r.criteria}`)}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      rules: prev.rules.filter((item) => item.id !== r.id),
                    }))
                  }
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Autostart */}
      <div className="border-t border-slate-800/80 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Автозапуск программ', 'Startup Daemons (exec)')}
          </h3>
          <div className="flex flex-wrap gap-1">
            {execPresets.map((cmd) => (
              <button
                key={cmd}
                type="button"
                onClick={() => setNewExecCmd(cmd)}
                className="px-2 py-0.5 text-[11px] font-mono rounded border border-slate-800 bg-[#090D14] text-slate-400 hover:text-sky-300"
              >
                {cmd.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="exec-cmd" className={labelClass}>
              {tr(lang, 'Команда', 'Command')}
            </label>
            <SmartInput
              id="exec-cmd"
              type="text"
              allowEmpty
              lang={lang}
              placeholder={tr(lang, 'Команда автозапуска, напр.: mako', 'Startup command, e.g. mako')}
              value={newExecCmd}
              options={execPresets}
              onCommit={setNewExecCmd}
              onAutoDetect={() => detectSuggestedAutostart(sway, packageAnalysis)}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 py-2 px-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newExecAlways}
              onChange={(e) => setNewExecAlways(e.target.checked)}
              className="accent-sky-400"
            />
            <span>exec_always</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (!newExecCmd.trim()) return;
              onUpdateSway((prev) => ({
                ...prev,
                autostart: [
                  ...prev.autostart,
                  { id: `exec-${Date.now()}`, always: newExecAlways, command: newExecCmd.trim() },
                ],
              }));
              setNewExecCmd('');
            }}
            className="py-2 px-4 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
          >
            {tr(lang, 'Добавить', 'Add')}
          </button>
        </div>

        <div className="border border-slate-800/80 rounded-lg divide-y divide-slate-800/70">
          {sway.autostart.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">
              {tr(lang, 'Список автозапуска пуст.', 'No startup commands configured.')}
            </div>
          ) : (
            sway.autostart.map((a) => (
              <div
                key={a.id}
                className="px-3 py-2 flex items-center justify-between gap-2 bg-[#090D14] text-xs font-mono"
              >
                <div className="truncate text-slate-300">
                  <span className="text-sky-400">{a.always ? 'exec_always' : 'exec'}</span>{' '}
                  {a.command}
                </div>
                <button
                  type="button"
                  aria-label={tr(lang, `Удалить автозапуск ${a.command}`, `Delete autostart ${a.command}`)}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      autostart: prev.autostart.filter((item) => item.id !== a.id),
                    }))
                  }
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
