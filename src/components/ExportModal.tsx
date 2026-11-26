import React, { useState } from 'react';
import { Check, Copy, Download, Layers, Terminal, X } from 'lucide-react';
import { ConfigBundle, ConfigFileId, GitRepoState, generateGitRestoreScript } from '../git/gitEngine';
import {
  EcosystemSettings,
  GeneratedEcosystemFile,
  SystemPalette,
  generateUnifiedInstallScript,
} from '../ecosystem/ecosystemEngine';
import { AppLang, tr } from '../i18n/translations';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  files: ConfigBundle;
  repo: GitRepoState;
  ecosystemFiles: GeneratedEcosystemFile[];
  palette: SystemPalette;
  ecosystem: EcosystemSettings;
  lang?: AppLang;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  files,
  repo,
  ecosystemFiles,
  palette,
  ecosystem,
  lang = 'ru',
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scopeTab, setScopeTab] = useState<'core' | 'ecosystem'>('core');

  if (!open) return null;

  const downloadTextFile = (filename: string, content: string) => {
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

  const copyText = async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Fallback ignored in restricted environments
    }
  };

  const fileItems: Array<{
    id: ConfigFileId;
    downloadName: string;
    pathHint: string;
  }> = [
    { id: 'sway/config', downloadName: 'config', pathHint: '~/.config/sway/config' },
    {
      id: 'waybar/config.jsonc',
      downloadName: 'config.jsonc',
      pathHint: '~/.config/waybar/config.jsonc',
    },
    { id: 'waybar/style.css', downloadName: 'style.css', pathHint: '~/.config/waybar/style.css' },
  ];

  const gitScript = generateGitRestoreScript(repo);
  const unifiedScript = generateUnifiedInstallScript(
    files['sway/config'],
    files['waybar/config.jsonc'],
    files['waybar/style.css'],
    ecosystemFiles,
    palette,
    ecosystem
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl border border-slate-800 bg-[#0E131E] shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 id="export-modal-title" className="text-base font-semibold text-slate-100">
              {tr(
                lang,
                'Экспорт конфигурации SwayWM, Waybar и единой среды',
                'Export SwayWM, Waybar & Unified Ecosystem'
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Скачайте отдельные файлы или единый скрипт установки для всей системы.',
                'Download individual dotfiles or a single unified installation script for your desktop.'
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tr(lang, 'Закрыть окно экспорта', 'Close export modal')}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Scope Switcher */}
        <div className="px-5 pt-3 flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setScopeTab('core')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              scopeTab === 'core'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            SwayWM + Waybar ({fileItems.length})
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('ecosystem')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              scopeTab === 'ecosystem'
                ? 'bg-slate-800 text-sky-300'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {tr(lang, 'Единая экосистема', 'Unified Ecosystem')} ({ecosystemFiles.length})
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {scopeTab === 'core' ? (
            <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#090D14]">
              {fileItems.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-100">{item.id}</div>
                    <div className="font-mono text-[11px] text-slate-400">{item.pathHint}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(item.id, files[item.id])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                    >
                      {copiedId === item.id ? (
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
                      onClick={() => downloadTextFile(item.downloadName, files[item.id])}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{tr(lang, 'Скачать', 'Download')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 border border-slate-800/80 rounded-lg bg-[#090D14]">
              {ecosystemFiles.map((item) => (
                <div
                  key={item.id}
                  className="px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-mono text-xs font-semibold text-slate-100">{item.id}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.appLabel} · <span className="font-mono">{item.pathHint}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyText(item.id, item.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md transition-colors"
                    >
                      {copiedId === item.id ? (
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
                      onClick={() => downloadTextFile(item.downloadName, item.content)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-md transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{tr(lang, 'Скачать', 'Download')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unified Full-System Install Script */}
          <div className="p-4 rounded-lg border border-sky-500/30 bg-sky-500/5 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Layers className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                <span>
                  {tr(lang, 'Установить всю систему одним скриптом', 'Install Complete Stack in One Script')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {tr(
                  lang,
                  'Запишет sway, waybar, терминал, лаунчер, mako, swaylock, gtk-3.0 и применит gsettings.',
                  'Writes sway, waybar, terminal, launcher, mako, swaylock, gtk-3.0, and applies gsettings.'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadTextFile('install-unified-rice.sh', unifiedScript)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {tr(lang, 'Скачать install-unified-rice.sh', 'Download install-unified-rice.sh')}
            </button>
          </div>

          {/* Git Fast-Import Script */}
          <div className="p-4 rounded-lg border border-slate-800/80 bg-[#090D14] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <Terminal className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
                <span>
                  {tr(
                    lang,
                    'Восстановить Git-репозиторий Sway + Waybar',
                    'Restore Sway + Waybar Git Repository'
                  )}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {tr(lang, 'Импортирует всю историю коммитов и ветки через', 'Imports full commit history and branches via')}{' '}
                <code className="text-slate-300">git fast-import</code>{' '}
                {tr(lang, 'в', 'into')} <code className="text-slate-300">~/.config</code>.
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadTextFile('restore-sway-git.sh', gitScript)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-white text-slate-950 rounded-lg transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {tr(lang, 'Скачать restore-sway-git.sh', 'Download restore-sway-git.sh')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
