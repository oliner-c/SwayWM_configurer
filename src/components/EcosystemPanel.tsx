import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileCode2,
  Info,
  Layers,
  LocateFixed,
  PackageCheck,
  RefreshCw,
  Terminal,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  PackageAnalysisResult,
  SAMPLE_ARCH_SWAY_PACKAGES,
} from '../packages/packageAnalyzer';
import {
  EcosystemFileId,
  EcosystemSettings,
  GeneratedEcosystemFile,
  SystemPalette,
} from '../ecosystem/ecosystemEngine';
import { ANALYZER_FINDING_EN, AppLang, tr } from '../i18n/translations';
import { SmartInput } from './SmartInput';
import {
  detectCursorTheme,
  detectGtkTheme,
  detectIconTheme,
} from '../utils/autoDetect';

interface EcosystemPanelProps {
  packageListRaw: string;
  onChangePackageListRaw: (raw: string) => void;
  analysis: PackageAnalysisResult;
  ecosystem: EcosystemSettings;
  onUpdateEcosystem: (updater: (prev: EcosystemSettings) => EcosystemSettings) => void;
  palette: SystemPalette;
  generatedFiles: GeneratedEcosystemFile[];
  onSyncSwayWithPackages: (analysis: PackageAnalysisResult) => void;
  onOpenExport: () => void;
  lang?: AppLang;
}

export const EcosystemPanel: React.FC<EcosystemPanelProps> = ({
  packageListRaw,
  onChangePackageListRaw,
  analysis,
  ecosystem,
  onUpdateEcosystem,
  palette,
  generatedFiles,
  onSyncSwayWithPackages,
  onOpenExport,
  lang = 'ru',
}) => {
  const [subTab, setSubTab] = useState<'packages' | 'unified'>('packages');
  const [selectedMissingIds, setSelectedMissingIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activeFileId, setActiveFileId] = useState<EcosystemFileId | null>(null);

  const activeFile = useMemo(() => {
    if (generatedFiles.length === 0) return null;
    return generatedFiles.find((f) => f.id === activeFileId) ?? generatedFiles[0];
  }, [generatedFiles, activeFileId]);

  const isMissingSelected = (id: string, priority: 'required' | 'recommended' | 'optional') => {
    if (id in selectedMissingIds) return selectedMissingIds[id];
    return priority !== 'optional';
  };

  const selectedInstallCommand = useMemo(() => {
    const pkgs = analysis.missing
      .filter((item) => isMissingSelected(item.id, item.priority))
      .map((item) => item.packageName);
    if (pkgs.length === 0) {
      return tr(
        lang,
        '# Выберите пакеты выше, чтобы сформировать команду установки',
        '# Select packages above to generate the pacman install command'
      );
    }
    return `sudo pacman -S ${pkgs.join(' ')}`;
  }, [analysis.missing, selectedMissingIds, lang]);

  const copyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Clipboard fallback ignored in restricted frames
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleUploadPackageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangePackageListRaw(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const inputClass =
    'w-full px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

  return (
    <div className="flex flex-col h-full bg-[#0E131E]">
      {/* Header + Sub-tabs */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-800/80 space-y-3 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              {tr(lang, 'Пакеты и единая экосистема', 'Packages & Unified Ecosystem')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Анализ установленных пакетов (лишние / недостающие) и настройка терминала, лаунчера, уведомлений, блокировки и GTK в одном стиле со Sway.',
                'Audit installed packages (redundant / missing) and keep terminal, launcher, notifications, lockscreen, and GTK visually unified with Sway.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
            {tr(lang, 'Скачать единую сборку', 'Download Full Bundle')}
          </button>
        </div>

        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label={tr(lang, 'Разделы пакетов и экосистемы', 'Package and ecosystem tabs')}
        >
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'packages'}
            onClick={() => setSubTab('packages')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              subTab === 'packages'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{tr(lang, 'Анализ пакетов', 'Package Audit')}</span>
            {analysis.totalPackages > 0 && (
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                ({analysis.totalPackages})
              </span>
            )}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subTab === 'unified'}
            onClick={() => setSubTab('unified')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              subTab === 'unified'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-3.5 h-3.5" aria-hidden="true" />
            <span>
              {tr(lang, 'Единый стиль системы', 'Unified System Style')} ({generatedFiles.length})
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {subTab === 'packages' ? (
          <>
            {/* Package Input Box */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-[#090D14] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label htmlFor="pkg-list-input" className="text-xs font-semibold text-slate-100">
                    {tr(lang, 'Список установленных пакетов', 'Installed Packages List')}
                  </label>
                  <p className="text-[11px] text-slate-400">
                    {tr(lang, 'Выполните', 'Run')}{' '}
                    <code className="text-sky-300">pacman -Qq &gt; packages.txt</code>{' '}
                    {tr(lang, 'или', 'or')} <code className="text-sky-300">pacman -Q</code>{' '}
                    {tr(lang, 'и вставьте список ниже.', 'and paste the output below.')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onChangePackageListRaw(SAMPLE_ARCH_SWAY_PACKAGES);
                      setSyncNotice(null);
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition-colors"
                  >
                    <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tr(lang, 'Авто (пример Arch)', 'Auto (Arch profile)')}</span>
                  </button>
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{tr(lang, 'Файл .txt', '.txt File')}</span>
                    <input
                      type="file"
                      accept=".txt,.list,.log,*"
                      onChange={handleUploadPackageFile}
                      className="sr-only"
                    />
                  </label>
                  {packageListRaw.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onChangePackageListRaw('');
                        setSyncNotice(null);
                      }}
                      aria-label={tr(lang, 'Очистить список пакетов', 'Clear package list')}
                      className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-800/70 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <textarea
                id="pkg-list-input"
                rows={5}
                value={packageListRaw}
                onChange={(e) => {
                  onChangePackageListRaw(e.target.value);
                  setSyncNotice(null);
                }}
                placeholder={tr(
                  lang,
                  'Вставьте вывод pacman -Qq (по одному пакету в строке), например: alacritty, waybar, wofi, mako...',
                  'Paste pacman -Qq output (one package per line), e.g.: alacritty, waybar, wofi, mako...'
                )}
                data-testid="package-list-textarea"
                className="w-full p-3 font-mono text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>

            {analysis.totalPackages === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-[#090D14]/60 text-center space-y-2">
                <p className="text-sm font-medium text-slate-200">
                  {tr(lang, 'Вставьте список пакетов для аудита', 'Paste your package list to start auditing')}
                </p>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {tr(
                    lang,
                    'Анализатор найдёт дублирующие программы и недостающие компоненты Sway/Waybar, а затем добавит найденные приложения в боковую панель конструктора.',
                    'The analyzer detects duplicate stacks and missing Sway/Waybar dependencies, then exposes detected apps right in the builder sidebar.'
                  )}
                </p>
              </div>
            ) : (
              <>
                {/* Metrics Strip */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-[#090D14]">
                    <div className="text-[11px] text-slate-400">
                      {tr(lang, 'Распознано пакетов', 'Packages Parsed')}
                    </div>
                    <div
                      data-testid="pkg-total-count"
                      className="text-lg font-semibold font-mono text-slate-100 tabular-nums mt-0.5"
                    >
                      {analysis.totalPackages}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-[#090D14]">
                    <div className="text-[11px] text-slate-400">
                      {tr(lang, 'Лишние / дубли', 'Redundant / Dupes')}
                    </div>
                    <div
                      data-testid="pkg-redundant-count"
                      className="text-lg font-semibold font-mono text-amber-300 tabular-nums mt-0.5"
                    >
                      {analysis.redundant.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-slate-800/80 bg-[#090D14]">
                    <div className="text-[11px] text-slate-400">
                      {tr(lang, 'Не хватает', 'Missing')}
                    </div>
                    <div
                      data-testid="pkg-missing-count"
                      className="text-lg font-semibold font-mono text-sky-300 tabular-nums mt-0.5"
                    >
                      {analysis.missing.length}
                    </div>
                  </div>
                </div>

                {/* Sync Sway + Ecosystem Action Banner */}
                <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-500/5 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-semibold text-slate-100">
                      {tr(lang, 'Обнаруженная основа рабочего стола', 'Detected Desktop Stack')}
                    </div>
                    <div className="text-xs text-slate-300 font-mono">
                      {tr(lang, 'Терминал:', 'Terminal:')}{' '}
                      <span className="text-sky-300">{analysis.recommendedTerm}</span> ·{' '}
                      {tr(lang, 'Меню:', 'Launcher:')}{' '}
                      <span className="text-sky-300">{analysis.recommendedMenu}</span> ·{' '}
                      {tr(lang, 'Шрифт:', 'Font:')}{' '}
                      <span className="text-sky-300">{analysis.recommendedFont}</span>
                    </div>
                    {syncNotice && <div className="text-xs text-emerald-400">{syncNotice}</div>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onSyncSwayWithPackages(analysis);
                      setSyncNotice(
                        tr(
                          lang,
                          'SwayWM и единые конфиги приложений обновлены под ваши пакеты',
                          'SwayWM and unified app configs synced to your installed packages'
                        )
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors shrink-0"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    {tr(lang, 'Синхронизировать Sway под пакеты', 'Sync Sway to Packages')}
                  </button>
                </div>

                {/* Missing Packages Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200">
                      {tr(
                        lang,
                        `Чего не хватает для связки SwayWM + Waybar (${analysis.missing.length})`,
                        `Missing for SwayWM + Waybar (${analysis.missing.length})`
                      )}
                    </h3>
                  </div>

                  {analysis.missing.length === 0 ? (
                    <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs text-emerald-300">
                      {tr(
                        lang,
                        'Все рекомендуемые пакеты для SwayWM и Waybar уже установлены.',
                        'All recommended SwayWM and Waybar companion packages are installed.'
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {analysis.missing.map((item) => {
                          const checked = isMissingSelected(item.id, item.priority);
                          const priorityLabel =
                            item.priority === 'required'
                              ? tr(lang, 'Важно', 'Required')
                              : item.priority === 'recommended'
                              ? tr(lang, 'Рекомендуется', 'Recommended')
                              : tr(lang, 'Опционально', 'Optional');
                          const priorityColor =
                            item.priority === 'required'
                              ? 'text-rose-300'
                              : item.priority === 'recommended'
                              ? 'text-sky-300'
                              : 'text-slate-400';

                          const localized =
                            lang === 'en' ? ANALYZER_FINDING_EN[item.id] : undefined;
                          const title = localized?.title ?? item.title;
                          const reason = localized?.reason ?? item.reason;

                          return (
                            <label
                              key={item.id}
                              className="p-3 rounded-lg border border-slate-800/80 bg-[#090D14] flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedMissingIds((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.checked,
                                  }))
                                }
                                className="mt-0.5 accent-sky-400"
                              />
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-slate-100">
                                    {title}
                                  </span>
                                  <span className={`text-[11px] font-medium ${priorityColor}`}>
                                    {priorityLabel}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-400">{reason}</p>
                                <div className="text-[11px] font-mono text-slate-500">
                                  {tr(lang, 'Пакет:', 'Package:')}{' '}
                                  <span className="text-slate-300">{item.packageName}</span>
                                  {item.alternatives && item.alternatives.length > 0
                                    ? ` (${tr(lang, 'альтернативы:', 'alternatives:')} ${item.alternatives.join(', ')})`
                                    : ''}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>

                      {/* Install Command */}
                      <div className="p-3 rounded-lg border border-slate-800 bg-[#090D14] flex items-center justify-between gap-3">
                        <code
                          data-testid="pacman-install-cmd"
                          className="font-mono text-xs text-emerald-300 truncate"
                        >
                          {selectedInstallCommand}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyText('install-cmd', selectedInstallCommand)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors shrink-0"
                        >
                          {copiedId === 'install-cmd' ? (
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
                      </div>
                    </>
                  )}
                </div>

                {/* Redundant / Overlapping Packages Section */}
                <div className="border-t border-slate-800/80 pt-5 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200">
                    {tr(
                      lang,
                      `Лишние и дублирующиеся пакеты (${analysis.redundant.length})`,
                      `Redundant & Overlapping Packages (${analysis.redundant.length})`
                    )}
                  </h3>

                  {analysis.redundant.length === 0 ? (
                    <div className="p-3.5 rounded-lg border border-slate-800 bg-[#090D14] text-xs text-slate-400">
                      {tr(
                        lang,
                        'Конфликтующих или дублирующихся пакетов не обнаружено.',
                        'No conflicting or duplicate packages detected.'
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {analysis.redundant.map((item) => {
                        const localized =
                          lang === 'en' ? ANALYZER_FINDING_EN[item.id] : undefined;
                        const title = localized?.title ?? item.title;
                        const reason = localized?.reason ?? item.reason;
                        const recommendation = localized?.recommendation ?? item.recommendation;

                        return (
                          <div
                            key={item.id}
                            className="p-3.5 rounded-lg border border-slate-800/80 bg-[#090D14] space-y-1.5"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                                {item.severity === 'warning' ? (
                                  <AlertTriangle
                                    className="w-3.5 h-3.5 text-amber-400 shrink-0"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <Info
                                    className="w-3.5 h-3.5 text-sky-400 shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                                <span>{title}</span>
                              </div>
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {tr(lang, 'Найдено:', 'Matched:')}{' '}
                              {item.matchedPackages.join(', ')}
                            </div>
                            <p className="text-xs text-slate-300">{reason}</p>
                            <p className="text-xs text-slate-400">{recommendation}</p>
                            {item.removeCommand && (
                              <div className="pt-1 flex items-center justify-between gap-2">
                                <code className="font-mono text-[11px] text-amber-300 truncate">
                                  {item.removeCommand}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyText(item.id, item.removeCommand!)}
                                  className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors shrink-0"
                                >
                                  {copiedId === item.id
                                    ? tr(lang, 'Скопировано', 'Copied')
                                    : tr(lang, 'Копировать', 'Copy')}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            {/* Unified Look Visual Showcase */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">
                  {tr(lang, 'Визуальная согласованность всей системы', 'Unified System Visual Preview')}
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {palette.isDark
                    ? tr(lang, 'Тёмная схема', 'Dark scheme')
                    : tr(lang, 'Светлая схема', 'Light scheme')}{' '}
                  · {palette.fontFamily}
                </span>
              </div>

              <div
                data-testid="unified-ecosystem-preview"
                style={{ backgroundColor: palette.wallpaper }}
                className="p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {/* Mini Terminal */}
                <div
                  style={{
                    backgroundColor: palette.bg,
                    color: palette.fg,
                    borderColor: palette.border,
                    opacity: ecosystem.terminalOpacity,
                    borderRadius: `${Math.min(ecosystem.uiCornerRadius, 12)}px`,
                    fontFamily: palette.fontFamily,
                  }}
                  className="p-3 border text-[11px] font-mono space-y-1.5 shadow-md"
                >
                  <div
                    className="flex items-center justify-between text-[10px]"
                    style={{ color: palette.mutedFg }}
                  >
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3" aria-hidden="true" />
                      {ecosystem.terminalApp}
                    </span>
                    <span>opacity {ecosystem.terminalOpacity.toFixed(2)}</span>
                  </div>
                  <div>
                    <span style={{ color: palette.accent }}>~</span> $ pacman -Q | wc -l
                  </div>
                  <div style={{ color: palette.mutedFg }}>
                    {analysis.totalPackages > 0 ? analysis.totalPackages : 1156} packages · theme synced
                  </div>
                </div>

                {/* Mini Launcher */}
                <div
                  style={{
                    backgroundColor: palette.surface,
                    color: palette.fg,
                    borderColor: palette.border,
                    borderRadius: `${ecosystem.uiCornerRadius}px`,
                    fontFamily: palette.fontFamily,
                  }}
                  className="p-2.5 border text-[11px] space-y-1.5 shadow-md"
                >
                  <div
                    style={{
                      backgroundColor: palette.bg,
                      borderColor: palette.surfaceAlt,
                      borderRadius: `${Math.max(4, Math.min(ecosystem.uiCornerRadius, 10))}px`,
                    }}
                    className="px-2.5 py-1 border text-[10px]"
                  >
                    {ecosystem.launcherApp}: {tr(lang, 'поиск приложений...', 'search apps...')}
                  </div>
                  <div
                    style={{
                      backgroundColor: palette.accent,
                      color: palette.accentFg,
                      borderRadius: `${Math.max(4, Math.min(ecosystem.uiCornerRadius, 10))}px`,
                    }}
                    className="px-2.5 py-1 font-medium text-[11px]"
                  >
                    Zen Browser
                  </div>
                  <div className="px-2.5 py-0.5 text-[11px]" style={{ color: palette.fg }}>
                    Thunar · {tr(lang, 'Файлы', 'Files')}
                  </div>
                </div>

                {/* Mini Mako Notification */}
                <div
                  style={{
                    backgroundColor: palette.surface,
                    color: palette.fg,
                    borderColor: palette.border,
                    borderRadius: `${ecosystem.uiCornerRadius}px`,
                    fontFamily: palette.fontFamily,
                  }}
                  className="p-2.5 border text-[11px] space-y-1 shadow-md"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold">
                      Mako · {tr(lang, 'Уведомление', 'Notification')}
                    </span>
                    <span style={{ color: palette.mutedFg }}>{tr(lang, 'сейчас', 'now')}</span>
                  </div>
                  <div style={{ color: palette.mutedFg }} className="text-[10.5px]">
                    {tr(
                      lang,
                      'Снимок экрана сохранён и скопирован в wl-clipboard.',
                      'Screenshot saved and copied to wl-clipboard.'
                    )}
                  </div>
                </div>

                {/* Mini Swaylock + GTK Card */}
                <div
                  style={{
                    backgroundColor: palette.bg,
                    color: palette.fg,
                    borderColor: palette.surfaceAlt,
                    borderRadius: `${ecosystem.uiCornerRadius}px`,
                  }}
                  className="p-2.5 border flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="space-y-0.5 text-[11px]">
                    <div className="font-semibold">GTK + Swaylock</div>
                    <div style={{ color: palette.mutedFg }} className="text-[10px] font-mono">
                      {ecosystem.colorMode === 'auto'
                        ? palette.isDark
                          ? 'Adwaita-dark'
                          : 'Adwaita'
                        : ecosystem.gtkTheme}
                    </div>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      borderColor: palette.accent,
                      backgroundColor: palette.surface,
                      color: palette.fg,
                    }}
                    className="w-10 h-10 rounded-full border-4 flex items-center justify-center font-mono text-[9px] shrink-0"
                  >
                    LOCK
                  </div>
                </div>
              </div>
            </div>

            {/* Unified Settings Controls */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-[#090D14] space-y-4">
              <h3 className="text-xs font-semibold text-slate-200">
                {tr(lang, 'Общие параметры оформления приложений', 'Shared App Styling Options')}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="eco-term-app" className={labelClass}>
                    {tr(lang, 'Конфигурация терминала', 'Terminal Target')}
                  </label>
                  <SmartInput
                    id="eco-term-app"
                    type="text"
                    compact
                    lang={lang}
                    value={ecosystem.terminalApp}
                    placeholder="alacritty"
                    options={[
                      { value: 'alacritty', label: 'alacritty.toml' },
                      { value: 'foot', label: 'foot.ini' },
                    ]}
                    onCommit={(raw) =>
                      onUpdateEcosystem((prev) => ({
                        ...prev,
                        terminalApp: (raw.trim() || 'alacritty') as 'alacritty' | 'foot',
                      }))
                    }
                    onAutoDetect={() =>
                      analysis.detected.terminals.includes('foot') ? 'foot' : 'alacritty'
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="eco-launcher-app" className={labelClass}>
                    {tr(lang, 'Конфигурация лаунчера', 'Launcher Target')}
                  </label>
                  <SmartInput
                    id="eco-launcher-app"
                    type="text"
                    compact
                    lang={lang}
                    value={ecosystem.launcherApp}
                    placeholder="wofi"
                    options={[
                      { value: 'wofi', label: 'style.css + config' },
                      { value: 'fuzzel', label: 'fuzzel.ini' },
                    ]}
                    onCommit={(raw) =>
                      onUpdateEcosystem((prev) => ({
                        ...prev,
                        launcherApp: (raw.trim() || 'wofi') as 'wofi' | 'fuzzel',
                      }))
                    }
                    onAutoDetect={() =>
                      analysis.detected.launchers.includes('fuzzel') ? 'fuzzel' : 'wofi'
                    }
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eco-opacity" className="block text-xs text-slate-300 font-medium">
                    {tr(lang, 'Прозрачность терминала', 'Terminal Opacity')}
                  </label>
                  <SmartInput
                    id="eco-opacity"
                    type="number"
                    min={0.5}
                    max={1}
                    step={0.01}
                    compact
                    lang={lang}
                    value={Number(ecosystem.terminalOpacity.toFixed(2))}
                    placeholder="0.95"
                    options={['0.80', '0.85', '0.90', '0.92', '0.95', '1.0']}
                    onCommit={(raw) => {
                      const num = Number(raw);
                      if (!Number.isNaN(num)) {
                        onUpdateEcosystem((prev) => ({
                          ...prev,
                          terminalOpacity: Math.min(1, Math.max(0.5, num)),
                        }));
                      }
                    }}
                    onAutoDetect={() => 0.95}
                    className={inputClass}
                  />
                  <input
                    aria-label={tr(lang, 'Ползунок прозрачности терминала', 'Terminal opacity slider')}
                    type="range"
                    min={0.75}
                    max={1}
                    step={0.01}
                    value={ecosystem.terminalOpacity}
                    onChange={(e) =>
                      onUpdateEcosystem((prev) => ({
                        ...prev,
                        terminalOpacity: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-sky-400"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="eco-radius" className="block text-xs text-slate-300 font-medium">
                    {tr(lang, 'Скругление Wofi и Mako (px)', 'Wofi & Mako Radius (px)')}
                  </label>
                  <SmartInput
                    id="eco-radius"
                    type="number"
                    min={0}
                    max={24}
                    step={1}
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
                    aria-label={tr(lang, 'Ползунок скругления Wofi и Mako', 'Wofi and Mako corner radius slider')}
                    type="range"
                    min={0}
                    max={20}
                    step={1}
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
                  <label htmlFor="eco-padding" className="block text-xs text-slate-300 font-medium">
                    {tr(lang, 'Внутренний отступ терминала (px)', 'Terminal Padding (px)')}
                  </label>
                  <SmartInput
                    id="eco-padding"
                    type="number"
                    min={0}
                    max={36}
                    step={2}
                    compact
                    lang={lang}
                    value={ecosystem.terminalPadding}
                    placeholder="12"
                    options={['4', '8', '10', '12', '16', '20', '24']}
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
                    min={4}
                    max={24}
                    step={2}
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

                <div>
                  <label htmlFor="eco-color-mode" className={labelClass}>
                    {tr(lang, 'Тональность GTK и приложений', 'GTK & App Color Mode')}
                  </label>
                  <SmartInput
                    id="eco-color-mode"
                    type="text"
                    compact
                    lang={lang}
                    value={ecosystem.colorMode}
                    placeholder="auto"
                    options={[
                      { value: 'auto', label: tr(lang, 'по палитре', 'match theme') },
                      { value: 'dark', label: 'prefer-dark' },
                      { value: 'light', label: 'prefer-light' },
                    ]}
                    onCommit={(raw) =>
                      onUpdateEcosystem((prev) => ({
                        ...prev,
                        colorMode: (raw.trim() || 'auto') as 'auto' | 'dark' | 'light',
                      }))
                    }
                    onAutoDetect={() => 'auto'}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="eco-gtk-theme" className={labelClass}>
                    {tr(lang, 'GTK-тема (Thunar, Pavucontrol)', 'GTK Theme (Thunar, Pavucontrol)')}
                  </label>
                  <SmartInput
                    id="eco-gtk-theme"
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
                  <label htmlFor="eco-icon-theme" className={labelClass}>
                    {tr(lang, 'Тема иконок и курсора', 'Icon & Cursor Themes')}
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <SmartInput
                      id="eco-icon-theme"
                      type="text"
                      compact
                      lang={lang}
                      ariaLabel={tr(lang, 'Тема иконок GTK', 'GTK icon theme')}
                      value={ecosystem.iconTheme}
                      placeholder={tr(lang, 'Иконки: Adwaita', 'Icons: Adwaita')}
                      options={[
                        'Papirus-Dark',
                        'Papirus',
                        'Adwaita',
                        'Nordzy-dark',
                        'Tela-dark',
                      ]}
                      onCommit={(raw) =>
                        onUpdateEcosystem((prev) => ({ ...prev, iconTheme: raw }))
                      }
                      onAutoDetect={() => detectIconTheme(palette, analysis)}
                      className={inputClass}
                    />
                    <SmartInput
                      type="text"
                      compact
                      lang={lang}
                      ariaLabel={tr(lang, 'Тема курсора GTK', 'GTK cursor theme')}
                      value={ecosystem.cursorTheme}
                      placeholder={tr(lang, 'Курсор: Adwaita', 'Cursor: Adwaita')}
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
                      onAutoDetect={() => detectCursorTheme(analysis)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-slate-800/80">
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ecosystem.includeSwaylock}
                    onChange={(e) =>
                      onUpdateEcosystem((prev) => ({
                        ...prev,
                        includeSwaylock: e.target.checked,
                      }))
                    }
                    className="accent-sky-400"
                  />
                  <span>{tr(lang, 'Генерировать swaylock/config', 'Generate swaylock/config')}</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ecosystem.includeGtk}
                    onChange={(e) =>
                      onUpdateEcosystem((prev) => ({ ...prev, includeGtk: e.target.checked }))
                    }
                    className="accent-sky-400"
                  />
                  <span>{tr(lang, 'Генерировать gtk-3.0/settings.ini', 'Generate gtk-3.0/settings.ini')}</span>
                </label>
              </div>
            </div>

            {/* Generated Dotfiles Inspector */}
            <div className="rounded-xl border border-slate-800/80 bg-[#090D14] overflow-hidden">
              <div className="px-3 py-2 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-[#0B0F17]">
                <div
                  className="flex flex-wrap items-center gap-1"
                  role="tablist"
                  aria-label={tr(lang, 'Сгенерированные конфиги приложений', 'Generated app configs')}
                >
                  {generatedFiles.map((file) => {
                    const isActive = activeFile?.id === file.id;
                    return (
                      <button
                        key={file.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveFileId(file.id)}
                        className={`px-2.5 py-1 text-[11px] font-mono rounded-md transition-colors ${
                          isActive
                            ? 'bg-slate-800 text-sky-300 font-medium'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        {file.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFile && (
                <div className="p-3 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <FileCode2 className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                      <span className="font-semibold text-slate-200">{activeFile.appLabel}</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        {activeFile.pathHint}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyText(activeFile.id, activeFile.content)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                      >
                        {copiedId === activeFile.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                            <span>{tr(lang, 'Скопировано', 'Copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" aria-hidden="true" />
                            <span>{tr(lang, 'Копировать', 'Copy')}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => downloadFile(activeFile.downloadName, activeFile.content)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-md transition-colors"
                      >
                        <Download className="w-3 h-3" aria-hidden="true" />
                        <span>{tr(lang, 'Скачать', 'Download')}</span>
                      </button>
                    </div>
                  </div>

                  <pre
                    data-testid="ecosystem-file-preview"
                    className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800/80 font-mono text-xs text-slate-200 overflow-x-auto max-h-72 overflow-y-auto leading-relaxed"
                  >
                    {activeFile.content}
                  </pre>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
