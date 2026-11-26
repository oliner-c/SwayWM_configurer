import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { SwayConfigModel } from '../sway/types';
import {
  EcosystemSettings,
  generateAlacrittyToml,
  generateFootIni,
  generateFuzzelIni,
  generateGtkSettingsIni,
  generateMakoConfig,
  generateSwaylockConfig,
  generateWofiConfig,
  generateWofiCss,
  SystemPalette,
} from '../ecosystem/ecosystemEngine';
import { AppConfigSectionId, PackageAnalysisResult } from '../packages/packageAnalyzer';
import { AppLang, tr } from '../i18n/translations';
import { SmartInput } from './SmartInput';
import {
  detectCursorTheme,
  detectDisplayScale,
  detectGtkTheme,
  detectIconTheme,
} from '../utils/autoDetect';

interface AppConfigSectionProps {
  section: AppConfigSectionId;
  sway: SwayConfigModel;
  ecosystem: EcosystemSettings;
  palette: SystemPalette;
  packageAnalysis?: PackageAnalysisResult;
  onUpdateSway: (updater: (prev: SwayConfigModel) => SwayConfigModel) => void;
  onUpdateEcosystem: (updater: (prev: EcosystemSettings) => EcosystemSettings) => void;
  lang?: AppLang;
}

const inputClass =
  'w-full px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400 transition-colors';
const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

export const AppConfigSection: React.FC<AppConfigSectionProps> = ({
  section,
  sway,
  ecosystem,
  palette,
  packageAnalysis,
  onUpdateSway,
  onUpdateEcosystem,
  lang = 'ru',
}) => {
  const [wofiTab, setWofiTab] = useState<'style' | 'config'>('style');
  const [copiedAppConfig, setCopiedAppConfig] = useState(false);

  const copyConfigText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAppConfig(true);
      setTimeout(() => setCopiedAppConfig(false), 1800);
    } catch {
      // Ignore clipboard restrictions
    }
  };

  const downloadConfigText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const colorModeControl = (
    <div>
      <label htmlFor="app-color-mode" className={labelClass}>
        {tr(lang, 'Тональность приложения', 'Color Mode')}
      </label>
      <SmartInput
        id="app-color-mode"
        type="text"
        compact
        lang={lang}
        value={ecosystem.colorMode}
        placeholder="auto"
        options={[
          { value: 'auto', label: tr(lang, 'Авто (из темы)', 'Auto (from theme)') },
          { value: 'dark', label: tr(lang, 'Тёмная палитра', 'Dark palette') },
          { value: 'light', label: tr(lang, 'Светлая палитра', 'Light palette') },
        ]}
        onCommit={(raw) =>
          onUpdateEcosystem((prev) => ({
            ...prev,
            colorMode: (raw.trim() || 'auto') as EcosystemSettings['colorMode'],
          }))
        }
        onAutoDetect={() => 'auto'}
        className={inputClass}
      />
    </div>
  );

  const renderConfigOutput = (pathHint: string, downloadName: string, content: string) => (
    <div className="border border-slate-800 rounded-lg overflow-hidden bg-[#090D14]">
      <div className="px-3 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-[#0B0F17]">
        <span className="font-mono text-xs text-slate-300">{pathHint}</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => copyConfigText(content)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            {copiedAppConfig ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>{tr(lang, 'Скопировано', 'Copied')}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{tr(lang, 'Копировать', 'Copy')}</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => downloadConfigText(downloadName, content)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{tr(lang, 'Скачать', 'Download')}</span>
          </button>
        </div>
      </div>
      <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
        {content}
      </pre>
    </div>
  );

  if (section === 'app-alacritty' || section === 'app-foot') {
    const isAlacritty = section === 'app-alacritty';
    const targetTerm = isAlacritty ? 'alacritty' : 'foot';
    const isPrimaryInSway = sway.variables.term.trim().toLowerCase() === targetTerm;
    const generated = isAlacritty
      ? generateAlacrittyToml(palette, ecosystem)
      : generateFootIni(palette, ecosystem);

    return (
      <div key={section} className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {isAlacritty
                ? tr(lang, 'Alacritty — терминал', 'Alacritty Terminal')
                : tr(lang, 'Foot — Wayland-терминал', 'Foot Wayland Terminal')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                `Шрифт (${palette.fontFamily} ${palette.fontSize}pt) и палитра наследуются из темы Sway + Waybar.`,
                `Font (${palette.fontFamily} ${palette.fontSize}pt) and 16-color palette are inherited from Sway + Waybar.`
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdateSway((prev) => ({
                ...prev,
                variables: { ...prev.variables, term: targetTerm },
              }));
              onUpdateEcosystem((prev) => ({ ...prev, terminalApp: targetTerm }));
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isPrimaryInSway
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-sky-400/50 bg-sky-400/15 text-sky-300 hover:bg-sky-400/25'
            }`}
          >
            {isPrimaryInSway
              ? tr(lang, `Основной $term в Sway (${targetTerm})`, `Primary $term in Sway (${targetTerm})`)
              : tr(lang, `Сделать основным $term (${targetTerm})`, `Set as primary $term (${targetTerm})`)}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="app-term-opacity" className="text-xs font-medium text-slate-300">
                {tr(lang, 'Прозрачность фона (%)', 'Background Opacity (%)')}
              </label>
            </div>
            <SmartInput
              id="app-term-opacity"
              type="number"
              min={50}
              max={100}
              step={1}
              compact
              lang={lang}
              value={Math.round(ecosystem.terminalOpacity * 100)}
              placeholder="95"
              options={[
                { value: '80', label: '0.80' },
                { value: '85', label: '0.85' },
                { value: '90', label: '0.90' },
                { value: '92', label: '0.92' },
                { value: '95', label: '0.95' },
                { value: '100', label: tr(lang, 'непрозрачно', 'opaque') },
              ]}
              onCommit={(raw) => {
                const pct = Math.min(100, Math.max(50, Number(raw) || 95));
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalOpacity: pct / 100,
                }));
              }}
              onAutoDetect={() => 95}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок прозрачности терминала', 'Terminal opacity slider')}
              type="range"
              min={65}
              max={100}
              value={Math.round(ecosystem.terminalOpacity * 100)}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalOpacity: Number(e.target.value) / 100,
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="app-term-padding" className="text-xs font-medium text-slate-300">
                {tr(lang, 'Внутренний отступ (px)', 'Inner Padding (px)')}
              </label>
            </div>
            <SmartInput
              id="app-term-padding"
              type="number"
              min={0}
              max={48}
              step={1}
              compact
              lang={lang}
              value={ecosystem.terminalPadding}
              placeholder="12"
              options={['0', '4', '8', '10', '12', '16', '20', '24']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalPadding: Math.max(0, Number(raw) || 0),
                }))
              }
              onAutoDetect={() => 12}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок отступа терминала', 'Terminal padding slider')}
              type="range"
              min={0}
              max={32}
              value={ecosystem.terminalPadding}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalPadding: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          {colorModeControl}

          <div>
            <label htmlFor="app-term-cursor" className={labelClass}>
              {tr(lang, 'Форма курсора', 'Cursor Shape')}
            </label>
            <SmartInput
              id="app-term-cursor"
              type="text"
              compact
              lang={lang}
              value={ecosystem.terminalCursorStyle ?? 'Block'}
              placeholder="Block"
              options={[
                { value: 'Block', label: tr(lang, 'блок', 'block') },
                { value: 'Beam', label: tr(lang, 'линия |', 'beam |') },
                { value: 'Underline', label: tr(lang, 'подчёркивание', 'underline') },
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalCursorStyle: (raw.trim() || 'Block') as 'Block' | 'Underline' | 'Beam',
                }))
              }
              onAutoDetect={() => 'Block'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="app-term-blink" className={labelClass}>
              {tr(lang, 'Мигание курсора', 'Cursor Blinking')}
            </label>
            <SmartInput
              id="app-term-blink"
              type="text"
              compact
              lang={lang}
              value={ecosystem.terminalCursorBlink ?? 'On'}
              placeholder="On"
              options={[
                { value: 'On', label: tr(lang, 'включено', 'enabled') },
                { value: 'Off', label: tr(lang, 'статичный', 'static') },
                ...(isAlacritty
                  ? [{ value: 'Always', label: tr(lang, 'всегда', 'always') }]
                  : []),
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalCursorBlink: (raw.trim() || 'On') as 'On' | 'Off' | 'Always',
                }))
              }
              onAutoDetect={() => 'On'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="app-term-scrollback" className={labelClass}>
              {tr(lang, 'Буфер прокрутки (строк)', 'Scrollback History (lines)')}
            </label>
            <SmartInput
              id="app-term-scrollback"
              type="number"
              min={1000}
              max={100000}
              step={1000}
              lang={lang}
              value={ecosystem.terminalScrollback ?? 10000}
              placeholder={tr(lang, 'Строк истории, напр.: 10000', 'History lines, e.g. 10000')}
              options={['2000', '5000', '10000', '20000', '50000']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  terminalScrollback: Number(raw) || 10000,
                }))
              }
              onAutoDetect={() => 10000}
              className={inputClass}
            />
          </div>

          {isAlacritty && (
            <div>
              <label htmlFor="app-term-decorations" className={labelClass}>
                {tr(lang, 'Системные рамки (decorations)', 'Window Decorations')}
              </label>
              <SmartInput
                id="app-term-decorations"
                type="text"
                compact
                lang={lang}
                value={ecosystem.terminalDecorations ?? 'None'}
                placeholder="None"
                options={[
                  { value: 'None', label: tr(lang, 'для Sway', 'tiling') },
                  { value: 'Full', label: tr(lang, 'с заголовком', 'titlebar') },
                ]}
                onCommit={(raw) =>
                  onUpdateEcosystem((prev) => ({
                    ...prev,
                    terminalDecorations: (raw.trim() || 'None') as 'None' | 'Full',
                  }))
                }
                onAutoDetect={() => 'None'}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {renderConfigOutput(
          isAlacritty ? '~/.config/alacritty/alacritty.toml' : '~/.config/foot/foot.ini',
          isAlacritty ? 'alacritty.toml' : 'foot.ini',
          generated
        )}
      </div>
    );
  }

  if (section === 'app-wofi' || section === 'app-fuzzel') {
    const isWofi = section === 'app-wofi';
    const targetMenu = isWofi ? 'wofi --show drun' : 'fuzzel';
    const isPrimaryInSway = sway.variables.menu.toLowerCase().includes(isWofi ? 'wofi' : 'fuzzel');
    const generated = isWofi
      ? wofiTab === 'style'
        ? generateWofiCss(palette, ecosystem)
        : generateWofiConfig(ecosystem)
      : generateFuzzelIni(palette, ecosystem);
    const pathHint = isWofi
      ? wofiTab === 'style'
        ? '~/.config/wofi/style.css'
        : '~/.config/wofi/config'
      : '~/.config/fuzzel/fuzzel.ini';
    const downloadName = isWofi
      ? wofiTab === 'style'
        ? 'wofi-style.css'
        : 'wofi-config'
      : 'fuzzel.ini';

    return (
      <div key={section} className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {isWofi
                ? tr(lang, 'Wofi — меню запуска приложений', 'Wofi Application Launcher')
                : tr(lang, 'Fuzzel — Wayland-лаунчер', 'Fuzzel Wayland Launcher')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Геометрия, колонки, иконки и цвета синхронизированы с Waybar и Sway.',
                'Geometry, columns, icons, and accent colors stay synced with Waybar and Sway.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onUpdateSway((prev) => ({
                ...prev,
                variables: { ...prev.variables, menu: targetMenu },
              }));
              onUpdateEcosystem((prev) => ({
                ...prev,
                launcherApp: isWofi ? 'wofi' : 'fuzzel',
              }));
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isPrimaryInSway
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-sky-400/50 bg-sky-400/15 text-sky-300 hover:bg-sky-400/25'
            }`}
          >
            {isPrimaryInSway
              ? tr(lang, `Основной $menu в Sway (${isWofi ? 'wofi' : 'fuzzel'})`, `Primary $menu in Sway (${isWofi ? 'wofi' : 'fuzzel'})`)
              : tr(lang, `Сделать основным $menu (${targetMenu})`, `Set as primary $menu (${targetMenu})`)}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="app-ui-radius" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Скругление (px)', 'Corner Radius (px)')}
            </label>
            <SmartInput
              id="app-ui-radius"
              type="number"
              min={0}
              max={24}
              compact
              lang={lang}
              value={ecosystem.uiCornerRadius}
              placeholder="12"
              options={['0', '4', '8', '12', '16', '20', '24']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiCornerRadius: Math.max(0, Number(raw) || 0),
                }))
              }
              onAutoDetect={() => 12}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок скругления', 'Corner radius slider')}
              type="range"
              min={0}
              max={24}
              value={ecosystem.uiCornerRadius}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiCornerRadius: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-ui-border" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Толщина рамки (px)', 'Border Width (px)')}
            </label>
            <SmartInput
              id="app-ui-border"
              type="number"
              min={0}
              max={8}
              compact
              lang={lang}
              value={ecosystem.uiBorderWidth ?? 2}
              placeholder="2"
              options={['0', '1', '2', '3', '4']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiBorderWidth: Math.max(0, Number(raw) || 0),
                }))
              }
              onAutoDetect={() => 2}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок толщины рамки', 'Border width slider')}
              type="range"
              min={0}
              max={5}
              value={ecosystem.uiBorderWidth ?? 2}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiBorderWidth: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          {colorModeControl}

          <div>
            <label htmlFor="app-launcher-prompt" className={labelClass}>
              {tr(lang, 'Текст строки поиска (prompt)', 'Search Prompt Text')}
            </label>
            <SmartInput
              id="app-launcher-prompt"
              type="text"
              allowEmpty
              lang={lang}
              value={ecosystem.launcherPrompt ?? ''}
              placeholder={tr(lang, 'Приглашение ввода, напр.: Поиск...', 'Prompt text, e.g. Search apps...')}
              options={[
                tr(lang, 'Запуск приложения...', 'Search apps...'),
                tr(lang, 'Поиск...', 'Search...'),
                'drun ›',
                'Apps:',
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({ ...prev, launcherPrompt: raw }))
              }
              onAutoDetect={() => tr(lang, 'Запуск приложения...', 'Search apps...')}
              className={inputClass}
            />
          </div>

          {isWofi && (
            <>
              <div>
                <label htmlFor="app-wofi-location" className={labelClass}>
                  {tr(lang, 'Позиция окна (location)', 'Window Location')}
                </label>
                <SmartInput
                  id="app-wofi-location"
                  type="text"
                  compact
                  lang={lang}
                  value={ecosystem.launcherLocation ?? 'center'}
                  placeholder="center"
                  options={[
                    { value: 'center', label: tr(lang, 'по центру', 'center') },
                    { value: 'top', label: tr(lang, 'сверху', 'top') },
                    { value: 'top_left', label: tr(lang, 'слева сверху', 'top-left') },
                    { value: 'bottom', label: tr(lang, 'снизу', 'bottom') },
                  ]}
                  onCommit={(raw) =>
                    onUpdateEcosystem((prev) => ({
                      ...prev,
                      launcherLocation: (raw.trim() || 'center') as EcosystemSettings['launcherLocation'],
                    }))
                  }
                  onAutoDetect={() => 'center'}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="app-wofi-cols" className={labelClass}>
                  {tr(lang, 'Колонки (columns)', 'Columns')}
                </label>
                <SmartInput
                  id="app-wofi-cols"
                  type="number"
                  min={1}
                  max={4}
                  compact
                  lang={lang}
                  value={ecosystem.launcherColumns ?? 1}
                  placeholder="1"
                  options={[
                    { value: '1', label: tr(lang, '1 колонка', '1 column') },
                    { value: '2', label: tr(lang, '2 колонки', '2 columns') },
                    { value: '3', label: tr(lang, '3 колонки', '3 columns') },
                  ]}
                  onCommit={(raw) =>
                    onUpdateEcosystem((prev) => ({
                      ...prev,
                      launcherColumns: Math.max(1, Number(raw) || 1),
                    }))
                  }
                  onAutoDetect={() => 1}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="app-wofi-width" className={labelClass}>
                  {tr(lang, 'Ширина (px)', 'Width (px)')}
                </label>
                <SmartInput
                  id="app-wofi-width"
                  type="number"
                  min={320}
                  max={1000}
                  step={20}
                  compact
                  lang={lang}
                  value={ecosystem.launcherWidth ?? 520}
                  placeholder="520"
                  options={['420', '520', '640', '760']}
                  onCommit={(raw) =>
                    onUpdateEcosystem((prev) => ({
                      ...prev,
                      launcherWidth: Number(raw) || 520,
                    }))
                  }
                  onAutoDetect={() => ((ecosystem.launcherColumns ?? 1) > 1 ? 640 : 520)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="app-wofi-height" className={labelClass}>
                  {tr(lang, 'Высота (px)', 'Height (px)')}
                </label>
                <SmartInput
                  id="app-wofi-height"
                  type="number"
                  min={200}
                  max={720}
                  step={20}
                  compact
                  lang={lang}
                  value={ecosystem.launcherHeight ?? 340}
                  placeholder="340"
                  options={['280', '340', '420', '520']}
                  onCommit={(raw) =>
                    onUpdateEcosystem((prev) => ({
                      ...prev,
                      launcherHeight: Number(raw) || 340,
                    }))
                  }
                  onAutoDetect={() => 340}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div className="flex items-end pb-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ecosystem.launcherShowIcons ?? true}
                onChange={(e) =>
                  onUpdateEcosystem((prev) => ({
                    ...prev,
                    launcherShowIcons: e.target.checked,
                  }))
                }
                className="accent-sky-400"
              />
              <span>{tr(lang, 'Показывать иконки программ', 'Show application icons')}</span>
            </label>
          </div>
        </div>

        {isWofi && (
          <div className="flex items-center gap-1 p-1 bg-[#090D14] border border-slate-800 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setWofiTab('style')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                wofiTab === 'style'
                  ? 'bg-slate-800 text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              wofi/style.css
            </button>
            <button
              type="button"
              onClick={() => setWofiTab('config')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                wofiTab === 'config'
                  ? 'bg-slate-800 text-sky-300 font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              wofi/config
            </button>
          </div>
        )}

        {renderConfigOutput(pathHint, downloadName, generated)}
      </div>
    );
  }

  if (section === 'app-mako') {
    const hasMakoExec = sway.autostart.some((a) => a.command.includes('mako'));
    const generated = generateMakoConfig(palette, ecosystem);

    return (
      <div key={section} className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {tr(lang, 'Mako — уведомления Wayland', 'Mako Wayland Notifications')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Позиция на экране, таймаут, лимит уведомлений и цвета под тему панели.',
                'Anchor corner, timeout, visible stack limit, and panel-matched colors.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (hasMakoExec) return;
              onUpdateSway((prev) => ({
                ...prev,
                autostart: [
                  ...prev.autostart,
                  { id: `exec-mako-${Date.now()}`, always: false, command: 'mako' },
                ],
              }));
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              hasMakoExec
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-sky-400/50 bg-sky-400/15 text-sky-300 hover:bg-sky-400/25'
            }`}
          >
            {hasMakoExec
              ? tr(lang, 'Автозапуск mako добавлен', 'mako autostart added')
              : tr(lang, 'Добавить exec mako в Sway', 'Add exec mako to Sway')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="app-mako-anchor" className={labelClass}>
              {tr(lang, 'Позиция (anchor)', 'Anchor Position')}
            </label>
            <SmartInput
              id="app-mako-anchor"
              type="text"
              compact
              lang={lang}
              value={ecosystem.makoAnchor ?? 'top-right'}
              placeholder="top-right"
              options={[
                { value: 'top-right', label: tr(lang, 'правый верх', 'top right') },
                { value: 'top-left', label: tr(lang, 'левый верх', 'top left') },
                { value: 'top-center', label: tr(lang, 'центр сверху', 'top center') },
                { value: 'bottom-right', label: tr(lang, 'правый низ', 'bottom right') },
                { value: 'bottom-left', label: tr(lang, 'левый низ', 'bottom left') },
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  makoAnchor: (raw.trim() || 'top-right') as EcosystemSettings['makoAnchor'],
                }))
              }
              onAutoDetect={() => 'top-right'}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="app-mako-timeout" className={labelClass}>
              {tr(lang, 'Таймаут скрытия (мс)', 'Default Timeout (ms)')}
            </label>
            <SmartInput
              id="app-mako-timeout"
              type="number"
              min={0}
              max={30000}
              step={500}
              compact
              lang={lang}
              value={ecosystem.makoTimeout ?? 5000}
              placeholder="5000"
              options={[
                { value: '3000', label: '3s' },
                { value: '5000', label: '5s' },
                { value: '8000', label: '8s' },
                { value: '10000', label: '10s' },
                { value: '0', label: tr(lang, 'не скрывать', 'persistent') },
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  makoTimeout: Number(raw) || 0,
                }))
              }
              onAutoDetect={() => 5000}
              className={inputClass}
            />
          </div>

          {colorModeControl}

          <div>
            <label htmlFor="app-mako-width" className={labelClass}>
              {tr(lang, 'Ширина карточки (px)', 'Popup Width (px)')}
            </label>
            <SmartInput
              id="app-mako-width"
              type="number"
              min={220}
              max={600}
              step={10}
              compact
              lang={lang}
              value={ecosystem.makoWidth ?? 340}
              placeholder="340"
              options={['280', '320', '340', '400', '480']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  makoWidth: Number(raw) || 340,
                }))
              }
              onAutoDetect={() => 340}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="app-mako-max" className={labelClass}>
              {tr(lang, 'Макс. видимых (max-visible)', 'Max Visible')}
            </label>
            <SmartInput
              id="app-mako-max"
              type="number"
              min={1}
              max={12}
              compact
              lang={lang}
              value={ecosystem.makoMaxVisible ?? 5}
              placeholder="5"
              options={['3', '5', '7', '10']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  makoMaxVisible: Number(raw) || 5,
                }))
              }
              onAutoDetect={() => 5}
              className={inputClass}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-mako-radius" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Скругление (px)', 'Corner Radius (px)')}
            </label>
            <SmartInput
              id="app-mako-radius"
              type="number"
              min={0}
              max={24}
              compact
              lang={lang}
              value={ecosystem.uiCornerRadius}
              placeholder="12"
              options={['0', '4', '8', '12', '16', '20']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiCornerRadius: Math.max(0, Number(raw) || 0),
                }))
              }
              onAutoDetect={() => 12}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок скругления Mako', 'Mako corner radius slider')}
              type="range"
              min={0}
              max={24}
              value={ecosystem.uiCornerRadius}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  uiCornerRadius: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>
        </div>

        {renderConfigOutput('~/.config/mako/config', 'mako-config', generated)}
      </div>
    );
  }

  if (section === 'app-swaylock') {
    const generated = generateSwaylockConfig(palette, ecosystem);
    return (
      <div key={section} className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {tr(lang, 'Swaylock — экран блокировки', 'Swaylock Screen Locker')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Размеры кольца индикатора, эффекты (для swaylock-effects) и цветовая схема.',
                'Indicator ring geometry, blur/clock flags (for swaylock-effects), and unified palette.'
              )}
            </p>
          </div>
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090D14] text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={ecosystem.includeSwaylock}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({ ...prev, includeSwaylock: e.target.checked }))
              }
              className="accent-sky-400"
            />
            <span>{tr(lang, 'Включать в экспорт', 'Include in export')}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="app-lock-radius" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Радиус кольца (px)', 'Ring Radius (px)')}
            </label>
            <SmartInput
              id="app-lock-radius"
              type="number"
              min={40}
              max={180}
              step={5}
              compact
              lang={lang}
              value={ecosystem.swaylockRadius ?? 90}
              placeholder="90"
              options={['60', '80', '90', '100', '120', '140']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  swaylockRadius: Math.max(40, Number(raw) || 90),
                }))
              }
              onAutoDetect={() => 90}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок радиуса кольца', 'Ring radius slider')}
              type="range"
              min={50}
              max={150}
              value={ecosystem.swaylockRadius ?? 90}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  swaylockRadius: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="app-lock-thick" className="block text-xs font-medium text-slate-300">
              {tr(lang, 'Толщина кольца (px)', 'Ring Thickness (px)')}
            </label>
            <SmartInput
              id="app-lock-thick"
              type="number"
              min={2}
              max={24}
              compact
              lang={lang}
              value={ecosystem.swaylockThickness ?? 8}
              placeholder="8"
              options={['4', '6', '8', '10', '12', '16']}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  swaylockThickness: Math.max(2, Number(raw) || 8),
                }))
              }
              onAutoDetect={() => 8}
              className={inputClass}
            />
            <input
              aria-label={tr(lang, 'Ползунок толщины кольца', 'Ring thickness slider')}
              type="range"
              min={3}
              max={20}
              value={ecosystem.swaylockThickness ?? 8}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  swaylockThickness: Number(e.target.value),
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          {colorModeControl}

          <div>
            <label htmlFor="app-lock-blur" className={labelClass}>
              {tr(lang, 'Размытие (swaylock-effects)', 'Effect Blur (swaylock-effects)')}
            </label>
            <SmartInput
              id="app-lock-blur"
              type="text"
              allowEmpty
              lang={lang}
              placeholder={tr(lang, 'Радиусxпроходы, напр.: 7x5', 'Radiusxpasses, e.g. 7x5')}
              value={ecosystem.swaylockEffectBlur ?? ''}
              options={[
                { value: '', label: tr(lang, 'без размытия', 'no blur') },
                '5x3',
                '7x5',
                '10x5',
                '12x6',
              ]}
              onCommit={(raw) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  swaylockEffectBlur: raw,
                }))
              }
              onAutoDetect={() => '7x5'}
              className={inputClass}
            />
          </div>

          <div className="flex items-end pb-1 sm:col-span-2">
            <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ecosystem.swaylockShowClock ?? false}
                onChange={(e) =>
                  onUpdateEcosystem((prev) => ({
                    ...prev,
                    swaylockShowClock: e.target.checked,
                  }))
                }
                className="accent-sky-400"
              />
              <span>
                {tr(
                  lang,
                  'Показывать часы внутри кольца (clock для swaylock-effects)',
                  'Show clock inside ring (clock flag for swaylock-effects)'
                )}
              </span>
            </label>
          </div>
        </div>

        {renderConfigOutput('~/.config/swaylock/config', 'swaylock-config', generated)}
      </div>
    );
  }

  // section === 'app-gtk'
  const generatedGtk = generateGtkSettingsIni(palette, ecosystem);
  return (
    <div key={section} className="p-5 space-y-5 overflow-y-auto h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            GTK 3/4 (Thunar, Pavucontrol, Blueman)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr(
              lang,
              'Единая тема окон, иконок, размера курсора, скроллинга и анимаций для GTK-программ.',
              'Unified GTK theme, icons, cursor size, overlay scrollbars, and animations.'
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#090D14] text-xs text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={ecosystem.includeGtk}
            onChange={(e) =>
              onUpdateEcosystem((prev) => ({ ...prev, includeGtk: e.target.checked }))
            }
            className="accent-sky-400"
          />
          <span>{tr(lang, 'Включать в экспорт', 'Include in export')}</span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {colorModeControl}

        <div>
          <label htmlFor="app-gtk-theme" className={labelClass}>
            {tr(lang, 'Тема GTK (gtk-theme-name)', 'GTK Theme (gtk-theme-name)')}
          </label>
          <SmartInput
            id="app-gtk-theme"
            type="text"
            lang={lang}
            value={ecosystem.gtkTheme}
            placeholder={tr(lang, 'Имя темы, напр.: Adwaita-dark', 'Theme name, e.g. Adwaita-dark')}
            options={[
              'Adwaita-dark',
              'Adwaita',
              'Nordic',
              'Arc-Dark',
              'Catppuccin-Mocha-Standard-Blue-Dark',
              'Gruvbox-Dark',
            ]}
            onCommit={(raw) =>
              onUpdateEcosystem((prev) => ({ ...prev, gtkTheme: raw }))
            }
            onAutoDetect={() => detectGtkTheme(palette)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="app-icon-theme" className={labelClass}>
            {tr(lang, 'Иконки (gtk-icon-theme-name)', 'Icon Theme (gtk-icon-theme-name)')}
          </label>
          <SmartInput
            id="app-icon-theme"
            type="text"
            lang={lang}
            value={ecosystem.iconTheme}
            placeholder={tr(lang, 'Иконки, напр.: Papirus-Dark', 'Icon theme, e.g. Papirus-Dark')}
            options={[
              'Papirus-Dark',
              'Papirus',
              'Adwaita',
              'Nordzy-dark',
              'Tela-dark',
              'Colloid-dark',
            ]}
            onCommit={(raw) =>
              onUpdateEcosystem((prev) => ({ ...prev, iconTheme: raw }))
            }
            onAutoDetect={() => detectIconTheme(palette, packageAnalysis)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="app-cursor-theme" className={labelClass}>
            {tr(lang, 'Курсор (gtk-cursor-theme-name)', 'Cursor Theme (gtk-cursor-theme-name)')}
          </label>
          <SmartInput
            id="app-cursor-theme"
            type="text"
            lang={lang}
            value={ecosystem.cursorTheme}
            placeholder={tr(lang, 'Курсор, напр.: Bibata-Modern-Classic', 'Cursor theme, e.g. Adwaita')}
            options={[
              'Bibata-Modern-Classic',
              'Bibata-Modern-Ice',
              'Adwaita',
              'breeze_cursors',
              'Nordzy-cursors',
            ]}
            onCommit={(raw) =>
              onUpdateEcosystem((prev) => ({ ...prev, cursorTheme: raw }))
            }
            onAutoDetect={() => detectCursorTheme(packageAnalysis)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="app-cursor-size" className={labelClass}>
            {tr(lang, 'Размер курсора (px)', 'Cursor Size (px)')}
          </label>
          <SmartInput
            id="app-cursor-size"
            type="number"
            min={16}
            max={64}
            step={2}
            compact
            lang={lang}
            value={ecosystem.gtkCursorSize ?? 24}
            placeholder="24"
            options={['16', '20', '24', '32', '48']}
            onCommit={(raw) =>
              onUpdateEcosystem((prev) => ({
                ...prev,
                gtkCursorSize: Number(raw) || 24,
              }))
            }
            onAutoDetect={() => (detectDisplayScale() > 1.25 ? 32 : 24)}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col justify-end gap-2 pb-1">
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ecosystem.gtkAnimations ?? true}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({ ...prev, gtkAnimations: e.target.checked }))
              }
              className="accent-sky-400"
            />
            <span>{tr(lang, 'Анимации GTK', 'GTK Animations')}</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={ecosystem.gtkOverlayScrolling ?? true}
              onChange={(e) =>
                onUpdateEcosystem((prev) => ({
                  ...prev,
                  gtkOverlayScrolling: e.target.checked,
                }))
              }
              className="accent-sky-400"
            />
            <span>{tr(lang, 'Overlay-скроллбары', 'Overlay Scrollbars')}</span>
          </label>
        </div>
      </div>

      {renderConfigOutput('~/.config/gtk-3.0/settings.ini', 'gtk-settings.ini', generatedGtk)}
    </div>
  );
};
