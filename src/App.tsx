import React, { useEffect, useMemo, useState } from 'react';
import { TopBar, WorkspaceTab } from './components/TopBar';
import { BuilderSection, SidebarNav } from './components/SidebarNav';
import { VisualConfigurator } from './components/VisualConfigurator';
import { CodeEditorPane } from './components/CodeEditorPane';
import { LivePreview } from './components/LivePreview';
import { GitPanel } from './components/GitPanel';
import { TemplatesView } from './components/TemplatesView';
import { ExportModal } from './components/ExportModal';
import {
  buildSageSwayConfig,
  COLOR_THEME_PRESETS,
  CONFIG_TEMPLATES,
  ConfigTemplate,
} from './sway/presets';
import {
  parseSwayConfig,
  serializeSwayConfig,
  validateSwayConfig,
} from './sway/parser';
import { SwayConfigModel } from './sway/types';
import {
  createDefaultWaybarModel,
  WAYBAR_THEME_PRESETS,
} from './waybar/presets';
import {
  parseWaybarFiles,
  serializeWaybarCss,
  serializeWaybarJson,
  validateWaybarFiles,
} from './waybar/parser';
import { WaybarConfigModel } from './waybar/types';
import {
  ConfigBundle,
  ConfigFileId,
  GitRepoState,
  commitChanges,
  computeBundleDiff,
  createBranch,
  createInitialRepo,
  getHeadCommit,
  rollbackToCommit,
  switchBranch,
} from './git/gitEngine';

const STORAGE_KEY_REPO = 'swayforge_git_repo_v1';
const STORAGE_KEY_FILES = 'swayforge_working_files_v1';

function createInitialBundle(): ConfigBundle {
  const defaultSway = CONFIG_TEMPLATES[0].config;
  const defaultWaybar = createDefaultWaybarModel();
  return {
    'sway/config': defaultSway,
    'waybar/config.jsonc': serializeWaybarJson(defaultWaybar),
    'waybar/style.css': serializeWaybarCss(defaultWaybar),
  };
}

function loadInitialState(): { files: ConfigBundle; repo: GitRepoState } {
  const fallbackFiles = createInitialBundle();
  try {
    const savedFilesRaw = localStorage.getItem(STORAGE_KEY_FILES);
    const savedRepoRaw = localStorage.getItem(STORAGE_KEY_REPO);
    if (savedFilesRaw && savedRepoRaw) {
      const files = JSON.parse(savedFilesRaw) as ConfigBundle;
      const repo = JSON.parse(savedRepoRaw) as GitRepoState;
      if (files['sway/config'] && repo.currentBranch && repo.commits) {
        return { files, repo };
      }
    }
  } catch {
    // Ignore corrupted localStorage and re-seed cleanly
  }
  return {
    files: fallbackFiles,
    repo: createInitialRepo(fallbackFiles),
  };
}

export default function App() {
  const [initial] = useState(() => loadInitialState());
  const [files, setFiles] = useState<ConfigBundle>(initial.files);
  const [repo, setRepo] = useState<GitRepoState>(initial.repo);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('builder');
  const [activeSection, setActiveSection] = useState<BuilderSection>('appearance');
  const [activeCodeFile, setActiveCodeFile] = useState<ConfigFileId>('sway/config');
  const [builderSplitCode, setBuilderSplitCode] = useState<boolean>(true);
  const [exportOpen, setExportOpen] = useState<boolean>(false);

  // Persist working files & Git repository to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(files));
      localStorage.setItem(STORAGE_KEY_REPO, JSON.stringify(repo));
    } catch {
      // Ignore storage quota errors
    }
  }, [files, repo]);

  // Parsed models for visual configurator & live desktop preview
  const swayModel = useMemo(() => parseSwayConfig(files['sway/config']), [files]);
  const waybarModel = useMemo(
    () => parseWaybarFiles(files['waybar/config.jsonc'], files['waybar/style.css']),
    [files]
  );

  // Live diagnostics
  const swayDiagnostics = useMemo(
    () => validateSwayConfig(files['sway/config']),
    [files]
  );
  const waybarDiagnostics = useMemo(
    () => validateWaybarFiles(files['waybar/config.jsonc'], files['waybar/style.css']),
    [files]
  );
  const totalErrorCount =
    swayDiagnostics.filter((d) => d.severity === 'error').length +
    waybarDiagnostics.filter((d) => d.severity === 'error').length;

  // Git diff vs HEAD
  const headCommit = useMemo(() => getHeadCommit(repo), [repo]);
  const workingDiff = useMemo(() => {
    const baseFiles = headCommit?.files ?? files;
    return computeBundleDiff(baseFiles, files);
  }, [headCommit, files]);

  // Bidirectional updaters
  const handleUpdateSwayModel = (updater: (prev: SwayConfigModel) => SwayConfigModel) => {
    const nextModel = updater(swayModel);
    const nextConfig = serializeSwayConfig(nextModel);
    setFiles((prev) => ({ ...prev, 'sway/config': nextConfig }));
  };

  const handleUpdateWaybarModel = (updater: (prev: WaybarConfigModel) => WaybarConfigModel) => {
    const nextModel = updater(waybarModel);
    setFiles((prev) => ({
      ...prev,
      'waybar/config.jsonc': serializeWaybarJson(nextModel),
      'waybar/style.css': serializeWaybarCss(nextModel),
    }));
  };

  const handleChangeRawFile = (fileId: ConfigFileId, content: string) => {
    setFiles((prev) => ({ ...prev, [fileId]: content }));
  };

  const handleApplySyncedTheme = (themeId: string) => {
    const swayPreset = COLOR_THEME_PRESETS.find((t) => t.id === themeId);
    const waybarPreset = WAYBAR_THEME_PRESETS[themeId];
    if (!swayPreset) return;

    const nextSway: SwayConfigModel = {
      ...swayModel,
      colors: structuredClone(swayPreset.colors),
      bar: {
        ...swayModel.bar,
        colors: structuredClone(swayPreset.barColors),
      },
      outputs: swayModel.outputs.some((o) => o.name === '*')
        ? swayModel.outputs.map((o) =>
            o.name === '*' ? { ...o, background: swayPreset.wallpaper } : o
          )
        : [
            {
              id: 'out-bg',
              name: '*',
              resolution: '',
              refreshRate: '',
              position: '',
              scale: 1,
              background: swayPreset.wallpaper,
            },
            ...swayModel.outputs,
          ],
    };

    const nextWaybar: WaybarConfigModel = waybarPreset
      ? {
          ...waybarModel,
          height: waybarPreset.height,
          marginTop: waybarPreset.marginTop,
          marginLeft: waybarPreset.marginLeft,
          marginRight: waybarPreset.marginRight,
          spacing: waybarPreset.spacing,
          style: { ...waybarPreset.style },
        }
      : waybarModel;

    setFiles({
      'sway/config': serializeSwayConfig(nextSway),
      'waybar/config.jsonc': serializeWaybarJson(nextWaybar),
      'waybar/style.css': serializeWaybarCss(nextWaybar),
    });
  };

  const handleApplyTemplate = (tpl: ConfigTemplate) => {
    const isAutoSage = tpl.id === 'sage-auto';
    const prefersDark =
      isAutoSage &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    const effectiveThemeId = isAutoSage
      ? prefersDark
        ? 'sage-dark'
        : 'sage-light'
      : tpl.themeId;
    const swayConfig = isAutoSage ? buildSageSwayConfig('auto', prefersDark) : tpl.config;

    const waybarPreset = WAYBAR_THEME_PRESETS[effectiveThemeId];
    const nextWaybar = createDefaultWaybarModel();
    if (waybarPreset) {
      nextWaybar.height = waybarPreset.height;
      nextWaybar.marginTop = waybarPreset.marginTop;
      nextWaybar.marginLeft = waybarPreset.marginLeft;
      nextWaybar.marginRight = waybarPreset.marginRight;
      nextWaybar.spacing = waybarPreset.spacing;
      nextWaybar.style = { ...waybarPreset.style };
      if (tpl.id === 'catppuccin-rice') {
        nextWaybar.position = 'bottom';
        nextWaybar.marginBottom = 6;
        nextWaybar.marginTop = 0;
      }
    }

    setFiles({
      'sway/config': swayConfig,
      'waybar/config.jsonc': serializeWaybarJson(nextWaybar),
      'waybar/style.css': serializeWaybarCss(nextWaybar),
    });
    setActiveTab('builder');
  };

  // Git Actions
  const handleCommit = (message: string) => {
    const result = commitChanges(repo, files, message);
    setRepo(result.repo);
  };

  const handleRollback = (commitHash: string) => {
    const result = rollbackToCommit(repo, commitHash, 'revert-commit');
    setRepo(result.repo);
    setFiles(result.restoredFiles);
  };

  const handleCreateBranch = (branchName: string) => {
    const nextRepo = createBranch(repo, branchName);
    setRepo(nextRepo);
  };

  const handleSwitchBranch = (branchName: string) => {
    const result = switchBranch(repo, branchName);
    setRepo(result.repo);
    setFiles(result.files);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-[#0B0F17] text-slate-100 overflow-x-hidden lg:overflow-hidden">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenExport={() => setExportOpen(true)}
      />

      {/* Mobile Secondary Nav */}
      <div className="flex md:hidden border-b border-slate-800/80 bg-[#0E131E] px-3 py-2 gap-1.5 overflow-x-auto">
        {(
          [
            { id: 'builder', label: 'Конструктор' },
            { id: 'code', label: 'Код' },
            { id: 'git', label: 'Git' },
            { id: 'templates', label: 'Шаблоны' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-sky-400 text-slate-950 font-semibold'
                : 'text-slate-300 bg-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main 3-Pane Studio Workspace */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        <SidebarNav
          activeTab={activeTab}
          activeSection={activeSection}
          onSelectSection={(sec) => {
            setActiveSection(sec);
            if (sec === 'panel') {
              setActiveCodeFile('waybar/config.jsonc');
            } else {
              setActiveCodeFile('sway/config');
            }
          }}
          onSelectTab={setActiveTab}
          currentBranch={repo.currentBranch}
          isDirty={workingDiff.isDirty}
          totalAdded={workingDiff.totalAdded}
          totalRemoved={workingDiff.totalRemoved}
          diagnosticErrors={totalErrorCount}
        />

        {/* Center Workspace Pane */}
        <div className="flex-1 min-w-0 min-h-0 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#0E131E] flex flex-col">
          {activeTab === 'builder' && (
            <>
              <div className="px-4 py-2 border-b border-slate-800/80 bg-[#0B0F17] flex items-center justify-between gap-2 shrink-0">
                <span className="text-xs text-slate-400">
                  Режим редактирования: визуальная форма + код
                </span>
                <button
                  type="button"
                  onClick={() => setBuilderSplitCode((v) => !v)}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-700 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  {builderSplitCode ? 'Скрыть нижний код' : 'Показать код и автодополнение'}
                </button>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className={builderSplitCode ? 'h-[54%] min-h-[260px] border-b border-slate-800/80' : 'flex-1 min-h-0'}>
                  <VisualConfigurator
                    section={activeSection}
                    sway={swayModel}
                    waybar={waybarModel}
                    onUpdateSway={handleUpdateSwayModel}
                    onUpdateWaybar={handleUpdateWaybarModel}
                    onApplySyncedTheme={handleApplySyncedTheme}
                  />
                </div>
                {builderSplitCode && (
                  <div className="h-[46%] min-h-[240px]">
                    <CodeEditorPane
                      activeFile={activeCodeFile}
                      onSelectFile={setActiveCodeFile}
                      files={files}
                      onChangeFile={handleChangeRawFile}
                      swayDiagnostics={swayDiagnostics}
                      waybarDiagnostics={waybarDiagnostics}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'code' && (
            <CodeEditorPane
              activeFile={activeCodeFile}
              onSelectFile={setActiveCodeFile}
              files={files}
              onChangeFile={handleChangeRawFile}
              swayDiagnostics={swayDiagnostics}
              waybarDiagnostics={waybarDiagnostics}
            />
          )}

          {activeTab === 'git' && (
            <GitPanel
              repo={repo}
              workingFiles={files}
              workingDiff={workingDiff}
              onCommit={handleCommit}
              onRollback={handleRollback}
              onCreateBranch={handleCreateBranch}
              onSwitchBranch={handleSwitchBranch}
            />
          )}

          {activeTab === 'templates' && (
            <TemplatesView
              onApplyTemplate={handleApplyTemplate}
              onImportSwayConfig={(raw) => {
                setFiles((prev) => ({ ...prev, 'sway/config': raw }));
                setActiveTab('builder');
              }}
            />
          )}
        </div>

        {/* Right Real-Time Live Preview Pane */}
        <div className="w-full lg:w-[480px] xl:w-[540px] shrink-0 min-h-[420px] lg:min-h-0">
          <LivePreview sway={swayModel} waybar={waybarModel} />
        </div>
      </main>

      <ExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        files={files}
        repo={repo}
      />
    </div>
  );
}
