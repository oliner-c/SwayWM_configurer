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

interface GitPanelProps {
  repo: GitRepoState;
  workingFiles: ConfigBundle;
  workingDiff: BundleDiffResult;
  onCommit: (message: string) => void;
  onRollback: (commitHash: string) => void;
  onCreateBranch: (branchName: string) => void;
  onSwitchBranch: (branchName: string) => void;
}

const FILE_IDS: ConfigFileId[] = ['sway/config', 'waybar/config.jsonc', 'waybar/style.css'];

export const GitPanel: React.FC<GitPanelProps> = ({
  repo,
  workingFiles,
  workingDiff,
  onCommit,
  onRollback,
  onCreateBranch,
  onSwitchBranch,
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
      setCommitError('Введите сообщение коммита перед сохранением версии.');
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
      setBranchError('Укажите название новой ветки.');
      return;
    }
    if (repo.branches[cleaned]) {
      setBranchError(`Ветка «${cleaned}» уже существует.`);
      return;
    }
    setBranchError(null);
    onCreateBranch(cleaned);
    setNewBranchName('');
  };

  const formatTime = (ts: number) => {
    try {
      return new Intl.DateTimeFormat('ru-RU', {
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
            Управление версиями Git (Sway + Waybar)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Фиксируйте изменения обеих конфигураций и откатывайтесь к любому коммиту в 1 клик.
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <label htmlFor="git-branch-select" className="sr-only">
            Текущая ветка Git
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
        <form onSubmit={handleCommitSubmit} className="md:col-span-8 space-y-2">
          <label htmlFor="git-commit-msg" className="block text-xs font-medium text-slate-300">
            Новый коммит ({workingDiff.isDirty ? `+${workingDiff.totalAdded} / -${workingDiff.totalRemoved} строк` : 'нет несохранённых изменений'})
          </label>
          <div className="flex items-center gap-2">
            <input
              id="git-commit-msg"
              type="text"
              placeholder="Например: Обновил отступы и цвета Waybar"
              value={commitMessage}
              onChange={(e) => {
                setCommitMessage(e.target.value);
                if (commitError) setCommitError(null);
              }}
              className="flex-1 px-3 py-2 text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Зафиксировать коммит
            </button>
          </div>
          {commitError && <p className="text-xs text-rose-400">{commitError}</p>}
        </form>

        <form onSubmit={handleBranchSubmit} className="md:col-span-4 space-y-2">
          <label htmlFor="git-new-branch" className="block text-xs font-medium text-slate-300">
            Создать ветку от HEAD
          </label>
          <div className="flex items-center gap-2">
            <input
              id="git-new-branch"
              type="text"
              placeholder="exp/nord"
              value={newBranchName}
              onChange={(e) => {
                setNewBranchName(e.target.value);
                if (branchError) setBranchError(null);
              }}
              className="flex-1 min-w-0 px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <button
              type="submit"
              aria-label="Создать новую ветку"
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
              Вернуться к текущим изменениям
            </button>
          )}
        </div>

        <div className="max-h-56 overflow-y-auto font-mono text-xs leading-5">
          {!activeFileDiff.isDirty ? (
            <div className="p-4 text-slate-400 text-center">
              В файле {activeDiffFile} изменений нет.
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
          История коммитов ветки {repo.currentBranch} ({history.length})
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
                    {isInspected ? 'Скрыть diff' : 'Diff'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRollback(commit.hash)}
                    aria-label={`Откатить к версии ${commit.hash.slice(0, 7)}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    Откатить к версии
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
