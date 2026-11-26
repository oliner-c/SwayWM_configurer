import React, { useMemo, useState } from 'react';
import { GitBranch, GitCommit as GitCommitIcon, RotateCcw, Plus } from 'lucide-react';
import {
  BundleDiffResult,
  ConfigBundle,
  ConfigFileId,
  GitCommit,
  GitRepoState,
  computeBundleDiff,
  getBranchHistory,
} from '../git/gitEngine';
import { WaybarConfigModel } from '../waybar/types';
import { AppLang, tr } from '../i18n/translations';
import { SmartInput } from './SmartInput';
import { detectBranchName, detectCommitMessage } from '../utils/autoDetect';

interface GitPanelProps {
  repo: GitRepoState;
  workingFiles: ConfigBundle;
  workingDiff: BundleDiffResult;
  waybar?: WaybarConfigModel;
  onCommit: (message: string) => void;
  onRollback: (commitHash: string) => void;
  onCreateBranch: (branchName: string) => void;
  onSwitchBranch: (branchName: string) => void;
  lang?: AppLang;
}

const FILE_IDS: ConfigFileId[] = ['sway/config', 'waybar/config.jsonc', 'waybar/style.css'];

export const GitPanel: React.FC<GitPanelProps> = ({
  repo,
  workingDiff,
  waybar,
  onCommit,
  onRollback,
  onCreateBranch,
  onSwitchBranch,
  lang = 'ru',
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [commitError, setCommitError] = useState<string | null>(null);
  const [newBranchName, setNewBranchName] = useState('');
  const [branchError, setBranchError] = useState<string | null>(null);
  const [activeDiffFile, setActiveDiffFile] = useState<ConfigFileId>('sway/config');
  const [inspectCommitHash, setInspectCommitHash] = useState<string | null>(null);

  const history = useMemo(() => getBranchHistory(repo), [repo]);
  const headHash = repo.branches[repo.currentBranch];

  const inspectedDiff = useMemo(() => {
    if (!inspectCommitHash) return workingDiff;
    const commit = repo.commits[inspectCommitHash];
    if (!commit) return workingDiff;
    const parentFiles: ConfigBundle = commit.parentHash
      ? repo.commits[commit.parentHash]?.files ?? {
          'sway/config': '',
          'waybar/config.jsonc': '',
          'waybar/style.css': '',
        }
      : {
          'sway/config': '',
          'waybar/config.jsonc': '',
          'waybar/style.css': '',
        };
    return computeBundleDiff(parentFiles, commit.files);
  }, [inspectCommitHash, repo.commits, workingDiff]);

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) {
      setCommitError(
        tr(
          lang,
          'Введите сообщение коммита перед сохранением версии.',
          'Enter a commit message before saving this revision.'
        )
      );
      return;
    }
    setCommitError(null);
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const handleBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newBranchName.trim().replace(/\s+/g, '-');
    if (!cleaned) {
      setBranchError(tr(lang, 'Укажите название новой ветки.', 'Specify a branch name.'));
      return;
    }
    if (repo.branches[cleaned]) {
      setBranchError(
        tr(lang, `Ветка «${cleaned}» уже существует.`, `Branch "${cleaned}" already exists.`)
      );
      return;
    }
    setBranchError(null);
    onCreateBranch(cleaned);
    setNewBranchName('');
  };

  const formatTime = (ts: number) => {
    try {
      return new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(ts));
    } catch {
      return '';
    }
  };

  const activeFileDiff = inspectedDiff.files[activeDiffFile];

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            {tr(lang, 'Управление версиями Git (Sway + Waybar)', 'Git Version Control (Sway + Waybar)')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {tr(
              lang,
              'Фиксируйте изменения обеих конфигураций и откатывайтесь к любому коммиту в 1 клик.',
              'Commit changes across both configurations and roll back to any snapshot in one click.'
            )}
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <label htmlFor="git-branch-select" className="sr-only">
            {tr(lang, 'Текущая ветка Git', 'Current Git Branch')}
          </label>
          <select
            id="git-branch-select"
            value={repo.currentBranch}
            onChange={(e) => onSwitchBranch(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
          >
            {Object.keys(repo.branches).map((br) => (
              <option key={br} value={br}>
                {br}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Create New Branch + Commit Form */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <form onSubmit={handleCommitSubmit} className="md:col-span-7 space-y-2">
          <label htmlFor="git-commit-msg" className="block text-xs font-medium text-slate-300">
            {tr(lang, 'Новый коммит', 'New Commit')} (
            {workingDiff.isDirty
              ? tr(
                  lang,
                  `+${workingDiff.totalAdded} / -${workingDiff.totalRemoved} строк`,
                  `+${workingDiff.totalAdded} / -${workingDiff.totalRemoved} lines`
                )
              : tr(lang, 'нет несохранённых изменений', 'working tree clean')}
            )
          </label>
          <div className="flex items-center gap-2">
            <SmartInput
              id="git-commit-msg"
              type="text"
              allowEmpty
              lang={lang}
              wrapperClassName="flex-1"
              placeholder={tr(
                lang,
                'Описание изменений, напр.: Обновил отступы и цвета Waybar',
                'Describe changes, e.g. Updated Sway gaps and Waybar palette'
              )}
              value={commitMessage}
              options={[
                tr(lang, 'Обновил оформление Waybar и отступы Sway', 'Updated Waybar styling and Sway gaps'),
                tr(lang, 'Настроил горячие клавиши и раскладки', 'Configured keybindings and keyboard layouts'),
                tr(lang, 'Синхронизировал тему терминала и лаунчера', 'Synced terminal and launcher palette'),
                'chore: snapshot sway + waybar config',
              ]}
              onCommit={(raw) => {
                setCommitMessage(raw);
                if (commitError) setCommitError(null);
              }}
              onAutoDetect={() => {
                if (commitError) setCommitError(null);
                return detectCommitMessage(workingDiff, lang);
              }}
              className="px-3 py-2 text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              {tr(lang, 'Зафиксировать коммит', 'Commit Changes')}
            </button>
          </div>
          {commitError && <p className="text-xs text-rose-400">{commitError}</p>}
        </form>

        <form onSubmit={handleBranchSubmit} className="md:col-span-5 space-y-2">
          <label htmlFor="git-new-branch" className="block text-xs font-medium text-slate-300">
            {tr(lang, 'Создать ветку от HEAD', 'Create Branch from HEAD')}
          </label>
          <div className="flex items-center gap-2">
            <SmartInput
              id="git-new-branch"
              type="text"
              allowEmpty
              compact
              lang={lang}
              wrapperClassName="flex-1"
              placeholder={tr(lang, 'Имя ветки, напр.: exp/nord', 'Branch name, e.g. exp/nord')}
              value={newBranchName}
              options={['exp/nord', 'exp/sage', 'exp/minimal', 'feat/keybindings', 'backup/stable']}
              onCommit={(raw) => {
                setNewBranchName(raw);
                if (branchError) setBranchError(null);
              }}
              onAutoDetect={() => {
                if (branchError) setBranchError(null);
                return waybar
                  ? detectBranchName(repo.branches, waybar)
                  : `exp/theme-${Object.keys(repo.branches).length + 1}`;
              }}
              className="px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              aria-label={tr(lang, 'Создать новую ветку', 'Create new branch')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          {branchError && <p className="text-xs text-rose-400">{branchError}</p>}
        </form>
      </div>

      {/* Diff Viewer */}
      <div className="border border-slate-800/80 rounded-lg overflow-hidden bg-[#090D14]">
        <div className="px-3 py-2 border-b border-slate-800/80 bg-[#0E131E] flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1">
            {FILE_IDS.map((fId) => {
              const fDiff = inspectedDiff.files[fId];
              const isSelected = activeDiffFile === fId;
              return (
                <button
                  key={fId}
                  type="button"
                  onClick={() => setActiveDiffFile(fId)}
                  className={`px-2.5 py-1 text-xs font-mono rounded transition-colors ${
                    isSelected
                      ? 'bg-slate-800 text-sky-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fId}
                  {fDiff.isDirty && (
                    <span className="ml-1.5 text-[11px] text-amber-400 tabular-nums">
                      +{fDiff.addedCount}/-{fDiff.removedCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {inspectCommitHash && (
            <button
              type="button"
              onClick={() => setInspectCommitHash(null)}
              className="text-xs text-sky-400 hover:text-sky-300"
            >
              {tr(lang, 'Вернуться к текущим изменениям', 'Back to working diff')}
            </button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto font-mono text-xs leading-5">
          {!activeFileDiff.isDirty ? (
            <div className="p-4 text-slate-400 text-center">
              {tr(lang, `В файле ${activeDiffFile} изменений нет.`, `No changes in ${activeDiffFile}.`)}
            </div>
          ) : (
            activeFileDiff.lines
              .filter((l) => l.type !== 'unchanged')
              .slice(0, 120)
              .map((line, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-0.5 flex gap-3 whitespace-pre ${
                    line.type === 'added'
                      ? 'bg-emerald-500/10 text-emerald-300'
                      : 'bg-rose-500/10 text-rose-300'
                  }`}
                >
                  <span className="w-8 text-right text-slate-500 tabular-nums shrink-0">
                    {line.lineNumberNew ?? line.lineNumberOld ?? ''}
                  </span>
                  <span className="w-3 shrink-0 font-semibold">
                    {line.type === 'added' ? '+' : '-'}
                  </span>
                  <span className="overflow-x-auto">{line.text || ' '}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Commit History Timeline */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-semibold text-slate-200">
          {tr(
            lang,
            `История коммитов ветки ${repo.currentBranch} (${history.length})`,
            `Commit History on ${repo.currentBranch} (${history.length})`
          )}
        </h3>
        <div className="border border-slate-800/80 rounded-lg divide-y divide-slate-800/80 bg-[#090D14]">
          {history.map((commit: GitCommit) => {
            const isHead = commit.hash === headHash;
            const isInspected = commit.hash === inspectCommitHash;
            return (
              <div
                key={commit.hash}
                className="px-3.5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-900/50 transition-colors"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <GitCommitIcon className="w-3.5 h-3.5 text-sky-400 shrink-0" aria-hidden="true" />
                    <span className="font-medium text-slate-100 truncate">{commit.message}</span>
                    {isHead && (
                      <span className="text-[11px] font-mono text-emerald-400 shrink-0">
                        HEAD
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono tabular-nums flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{commit.hash.slice(0, 7)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatTime(commit.timestamp)}</span>
                    <span aria-hidden="true">·</span>
                    <span>{commit.author}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      setInspectCommitHash(isInspected ? null : commit.hash)
                    }
                    className={`px-2.5 py-1.5 text-xs rounded-md border transition-colors ${
                      isInspected
                        ? 'border-sky-400/60 bg-sky-500/15 text-sky-300'
                        : 'border-slate-700 text-slate-300 hover:text-slate-100'
                    }`}
                  >
                    {isInspected ? tr(lang, 'Скрыть diff', 'Hide diff') : 'Diff'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRollback(commit.hash)}
                    aria-label={tr(
                      lang,
                      `Откатить к версии ${commit.hash.slice(0, 7)}`,
                      `Restore commit ${commit.hash.slice(0, 7)}`
                    )}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    {tr(lang, 'Откатить к версии', 'Restore')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
