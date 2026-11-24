import React, { useState } from 'react';
import { SwayConfigModel } from '../sway/types';
import { WaybarConfigModel } from '../waybar/types';

interface LivePreviewProps {
  sway: SwayConfigModel;
  waybar: WaybarConfigModel;
}

type WindowId = 'term' | 'editor' | 'browser' | 'floating';

export const LivePreview: React.FC<LivePreviewProps> = ({ sway, waybar }) => {
  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [focusedWindow, setFocusedWindow] = useState<WindowId>('term');
  const [singleWindowMode, setSingleWindowMode] = useState<boolean>(false);
  const [showFloating, setShowFloating] = useState<boolean>(true);
  const [simulateUrgent, setSimulateUrgent] = useState<boolean>(false);
  const [simulateResizeMode, setSimulateResizeMode] = useState<boolean>(false);

  const primaryOutput =
    sway.outputs.find((o) => o.name !== '*') ?? sway.outputs[0];
  const bgOutput = sway.outputs.find((o) => o.background) ?? primaryOutput;
  const wallpaperColor =
    bgOutput?.background && /^#[0-9a-fA-F]{3,8}$/.test(bgOutput.background)
      ? bgOutput.background
      : '#0F172A';

  const useWaybar = sway.bar.enabled && sway.bar.swaybarCommand === 'waybar' && waybar.enabled;
  const useSwaybar = sway.bar.enabled && sway.bar.swaybarCommand === 'swaybar';

  // Calculate effective gaps with smart_gaps
  const visibleTiledCount = singleWindowMode ? 1 : 3;
  const hideGaps = sway.gaps.smartGaps === 'on' && visibleTiledCount === 1;
  const innerGap = hideGaps ? 0 : Math.min(sway.gaps.inner, 28);
  const outerGap = hideGaps ? 0 : Math.min(sway.gaps.outer, 28);

  const hideBorders =
    sway.general.defaultBorder === 'none' ||
    (sway.gaps.smartBorders !== 'off' && visibleTiledCount === 1);
  const borderWidth = hideBorders ? 0 : Math.min(Math.max(sway.general.borderThickness, 1), 6);
  const showTitleBar = sway.general.defaultBorder === 'normal';

  const getWindowColors = (id: WindowId, isUrgent = false) => {
    if (isUrgent) return sway.colors.urgent;
    if (focusedWindow === id) return sway.colors.focused;
    if (id === 'editor') return sway.colors.focusedInactive;
    return sway.colors.unfocused;
  };

  const renderWaybarModule = (mod: string, idx: number) => {
    const s = waybar.style;
    const modStyle: React.CSSProperties = {
      backgroundColor: s.moduleBg,
      color: s.textColor,
      borderRadius: `${Math.min(s.borderRadius, 10)}px`,
      fontSize: '9px',
    };

    if (mod === 'sway/workspaces') {
      return (
        <div key={`${mod}-${idx}`} className="flex items-center gap-0.5 shrink-0">
          {[1, 2, 3, 4].map((ws) => {
            const isCurrent = activeWorkspace === ws;
            const isUrgentWs = simulateUrgent && ws === 3;
            return (
              <button
                key={ws}
                type="button"
                onClick={() => setActiveWorkspace(ws)}
                aria-label={`Переключить рабочий стол ${ws}`}
                style={{
                  backgroundColor: isUrgentWs
                    ? s.urgentColor
                    : isCurrent
                    ? s.accentColor
                    : 'transparent',
                  color: isUrgentWs
                    ? '#ffffff'
                    : isCurrent
                    ? s.accentTextColor
                    : s.textColor,
                  borderRadius: `${Math.min(s.borderRadius, 8)}px`,
                  fontSize: '9.5px',
                }}
                className="px-1.5 py-0.5 font-mono font-semibold transition-colors cursor-pointer shrink-0 leading-none"
              >
                {ws}
              </button>
            );
          })}
        </div>
      );
    }

    if (mod === 'sway/mode') {
      if (!simulateResizeMode) return null;
      return (
        <span
          key={`${mod}-${idx}`}
          style={{
            backgroundColor: s.urgentColor,
            color: '#ffffff',
            borderRadius: `${Math.min(s.borderRadius, 8)}px`,
          }}
          className="px-1.5 py-0.5 text-[9px] font-mono italic font-semibold shrink-0 leading-none"
        >
          resize
        </span>
      );
    }

    if (mod === 'sway/window') {
      const titles: Record<WindowId, string> = {
        term: `${sway.variables.term || 'foot'}`,
        editor: 'nvim',
        browser: 'Firefox',
        floating: 'pavucontrol',
      };
      return (
        <span
          key={`${mod}-${idx}`}
          className="px-1 text-[9px] truncate max-w-[54px] opacity-85 shrink"
          style={{ color: s.textColor }}
        >
          {titles[focusedWindow]}
        </span>
      );
    }

    const formatClock = (fmt: string) => {
      if (!fmt) return '14:25';
      if (fmt.includes('%d') || fmt.includes('%m')) return '14:25 · 24.11';
      return '14:25';
    };

    const labels: Record<string, string> = {
      'sway/language': 'RU',
      clock: formatClock(waybar.clockFormat),
      cpu: (waybar.cpuFormat || 'CPU {usage}%').replace('{usage}', '14'),
      memory: (waybar.memoryFormat || 'RAM {percentage}%').replace('{percentage}', '38'),
      temperature: '51°C',
      network: (waybar.networkFormatWifi || '{essid}')
        .replace('{essid}', 'Wi-Fi')
        .replace('{signalStrength}', '92'),
      pulseaudio: (waybar.pulseaudioFormat || 'VOL {volume}%').replace('{volume}', '65'),
      backlight: '80%',
      battery: (waybar.batteryFormat || 'BAT {capacity}%').replace('{capacity}', '88'),
      tray: '••',
      'custom/power': '⏻',
    };

    return (
      <span
        key={`${mod}-${idx}`}
        style={modStyle}
        className="px-1.5 py-0.5 font-mono whitespace-nowrap shrink-0 leading-none"
      >
        {labels[mod] ?? mod}
      </span>
    );
  };

  const renderWaybar = () => {
    const s = waybar.style;
    const barPosition = waybar.position;
    return (
      <div
        data-testid="preview-waybar"
        style={{
          marginTop: barPosition === 'top' ? `${Math.min(waybar.marginTop, 12)}px` : 0,
          marginBottom: barPosition === 'bottom' ? `${Math.min(waybar.marginBottom, 12)}px` : 0,
          marginLeft: `${Math.min(waybar.marginLeft, 14)}px`,
          marginRight: `${Math.min(waybar.marginRight, 14)}px`,
          height: `${Math.min(Math.max(Math.round(waybar.height * 0.85), 22), 36)}px`,
          backgroundColor: s.background,
          color: s.textColor,
          borderColor: s.borderColor,
          borderRadius: `${Math.min(s.barRadius, 12)}px`,
          fontFamily: s.fontFamily,
        }}
        className="border px-1.5 flex items-center justify-between gap-1.5 shrink-0 transition-all overflow-hidden"
      >
        <div
          className="flex items-center min-w-0 shrink-0"
          style={{ gap: `${Math.min(waybar.spacing, 6)}px` }}
        >
          {waybar.modulesLeft.map((m, i) => renderWaybarModule(m, i))}
        </div>
        <div
          className="flex items-center shrink-0"
          style={{ gap: `${Math.min(waybar.spacing, 6)}px` }}
        >
          {waybar.modulesCenter.map((m, i) => renderWaybarModule(m, i))}
        </div>
        <div
          className="flex items-center min-w-0 overflow-hidden"
          style={{ gap: `${Math.min(waybar.spacing, 6)}px` }}
        >
          {waybar.modulesRight.map((m, i) => renderWaybarModule(m, i))}
        </div>
      </div>
    );
  };

  const renderSwaybar = () => {
    const c = sway.bar.colors;
    return (
      <div
        data-testid="preview-swaybar"
        style={{
          height: `${Math.min(Math.max(sway.bar.height, 22), 38)}px`,
          backgroundColor: c.background,
          color: c.statusline,
        }}
        className="px-2 flex items-center justify-between text-[11px] font-mono shrink-0"
      >
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((ws) => {
            const isCurrent = activeWorkspace === ws;
            const isUrgentWs = simulateUrgent && ws === 3;
            return (
              <button
                key={ws}
                type="button"
                onClick={() => setActiveWorkspace(ws)}
                aria-label={`Переключить рабочий стол ${ws}`}
                style={{
                  backgroundColor: isUrgentWs
                    ? c.urgentWorkspaceBg
                    : isCurrent
                    ? c.focusedWorkspaceBg
                    : c.inactiveWorkspaceBg,
                  color: isUrgentWs
                    ? c.urgentWorkspaceText
                    : isCurrent
                    ? c.focusedWorkspaceText
                    : c.inactiveWorkspaceText,
                  borderColor: isUrgentWs
                    ? c.urgentWorkspaceBorder
                    : isCurrent
                    ? c.focusedWorkspaceBorder
                    : c.inactiveWorkspaceBorder,
                }}
                className="px-2 py-0.5 border text-[11px] font-semibold cursor-pointer"
              >
                {ws}
              </button>
            );
          })}
          {simulateResizeMode && (
            <span
              style={{ backgroundColor: c.urgentWorkspaceBg, color: c.urgentWorkspaceText }}
              className="px-1.5 py-0.5 text-[10px] ml-1"
            >
              resize
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span style={{ color: c.separator }}>|</span>
          <span>24.11.2026 14:25</span>
        </div>
      </div>
    );
  };

  const renderTileWindow = (
    id: WindowId,
    title: string,
    body: React.ReactNode,
    isUrgent = false
  ) => {
    const col = getWindowColors(id, isUrgent);
    return (
      <button
        type="button"
        onClick={() => setFocusedWindow(id)}
        data-testid={`preview-window-${id}`}
        style={{
          borderColor: col.childBorder,
          borderWidth: `${borderWidth}px`,
          backgroundColor: '#0B101B',
        }}
        className="w-full h-full flex flex-col text-left overflow-hidden focus-visible:outline-none transition-colors cursor-pointer"
      >
        {showTitleBar && (
          <div
            style={{
              backgroundColor: col.background,
              color: col.text,
              borderBottom: `1px solid ${col.border}`,
              textAlign: sway.general.titleAlign,
            }}
            className="px-2 py-0.5 text-[10px] font-mono truncate shrink-0"
          >
            {title}
          </div>
        )}
        <div className="flex-1 p-2.5 font-mono text-[10px] leading-relaxed text-slate-300 overflow-hidden">
          {body}
        </div>
      </button>
    );
  };

  const barPosition = useWaybar ? waybar.position : sway.bar.position;

  return (
    <section
      aria-label="Предпросмотр SwayWM и Waybar в реальном времени"
      className="flex flex-col h-full bg-[#0E131E]"
    >
      {/* Preview controls header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Живой предпросмотр рабочего стола
          </h2>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {primaryOutput?.name || 'DP-1'} · {primaryOutput?.resolution || '1920x1080'}
            {primaryOutput?.refreshRate ? `@${primaryOutput.refreshRate}` : ''} ·{' '}
            {primaryOutput?.scale || 1}x · {useWaybar ? 'Waybar' : useSwaybar ? 'Swaybar' : 'Без панели'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSingleWindowMode((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              singleWindowMode
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            1 окно
          </button>
          <button
            type="button"
            onClick={() => setShowFloating((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              showFloating
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            Floating
          </button>
          <button
            type="button"
            onClick={() => setSimulateUrgent((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              simulateUrgent
                ? 'bg-rose-500/20 border-rose-400/50 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            Urgent
          </button>
          <button
            type="button"
            onClick={() => setSimulateResizeMode((v) => !v)}
            className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
              simulateResizeMode
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            Resize
          </button>
        </div>
      </div>

      {/* Monitor Frame */}
      <div className="p-4 flex-1 flex flex-col justify-start gap-4 overflow-y-auto">
        <div
          data-testid="sway-monitor-screen"
          style={{ backgroundColor: wallpaperColor }}
          className="relative w-full aspect-[16/10] rounded-lg border border-slate-700/80 overflow-hidden flex flex-col shadow-lg"
        >
          {(useWaybar || useSwaybar) && barPosition === 'top' && (
            useWaybar ? renderWaybar() : renderSwaybar()
          )}

          {/* Workspace Tiling Area */}
          <div
            data-testid="sway-tiling-area"
            style={{
              padding: `${outerGap}px`,
              gap: `${innerGap}px`,
            }}
            className="relative flex-1 grid grid-cols-12 min-h-0"
          >
            <div className={singleWindowMode ? 'col-span-12 h-full' : 'col-span-7 h-full'}>
              {renderTileWindow(
                'term',
                `${sway.variables.term || 'foot'} — zsh`,
                <div className="space-y-1">
                  <div className="text-sky-400">~/sway-setup $ swaymsg -t get_version</div>
                  <div className="text-slate-400">sway version 1.10 · wayland</div>
                  <div className="text-slate-400">
                    gaps: inner {sway.gaps.inner}px / outer {sway.gaps.outer}px
                  </div>
                  <div className="text-slate-400">
                    mod: {sway.variables.mod} · border: {sway.general.defaultBorder} {sway.general.borderThickness}px
                  </div>
                  <div className="text-emerald-400">ws #{activeWorkspace} активен</div>
                </div>
              )}
            </div>

            {!singleWindowMode && (
              <div
                className="col-span-5 h-full flex flex-col min-h-0"
                style={{ gap: `${innerGap}px` }}
              >
                <div className="flex-1 min-h-0">
                  {renderTileWindow(
                    'editor',
                    'nvim — config',
                    <div className="space-y-0.5 text-[9.5px]">
                      <div className="text-slate-500">1 set $mod {sway.variables.mod}</div>
                      <div className="text-slate-400">2 set $term {sway.variables.term}</div>
                      <div className="text-slate-300">3 gaps inner {sway.gaps.inner}</div>
                      <div className="text-sky-400">4 swaybar_command {sway.bar.swaybarCommand}</div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  {renderTileWindow(
                    'browser',
                    'firefox — Wayland',
                    <div className="space-y-1 text-[9.5px]">
                      <div className="text-slate-300">Рабочий стол #{activeWorkspace}</div>
                      <div className="text-slate-500">
                        Раскладки: {sway.inputs.find((i) => i.xkbLayout)?.xkbLayout || 'us,ru'}
                      </div>
                      <div className="text-slate-500">
                        {simulateUrgent ? 'Уведомление: требуется внимание' : 'Нажмите на окно для фокуса'}
                      </div>
                    </div>,
                    simulateUrgent
                  )}
                </div>
              </div>
            )}

            {/* Floating Window Overlay */}
            {showFloating && (
              <div
                style={{
                  borderColor: getWindowColors('floating').childBorder,
                  borderWidth: `${Math.max(borderWidth, 1)}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setFocusedWindow('floating');
                }}
                className="absolute left-1/2 -translate-x-1/2 bottom-3 w-[36%] h-[28%] bg-[#0F172A]/95 shadow-xl flex flex-col overflow-hidden cursor-pointer"
              >
                <div
                  style={{
                    backgroundColor: getWindowColors('floating').background,
                    color: getWindowColors('floating').text,
                  }}
                  className="px-2 py-0.5 text-[9.5px] font-mono flex items-center justify-between"
                >
                  <span className="truncate">pavucontrol</span>
                  <span>65%</span>
                </div>
                <div className="p-2 flex-1 flex flex-col justify-center gap-1 text-[9.5px] font-mono text-slate-300">
                  <div className="flex justify-between">
                    <span>PipeWire</span>
                    <span>65%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded overflow-hidden">
                    <div
                      className="h-full w-[65%]"
                      style={{ backgroundColor: sway.colors.focused.border }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {(useWaybar || useSwaybar) && barPosition === 'bottom' && (
            useWaybar ? renderWaybar() : renderSwaybar()
          )}
        </div>

        {/* Live Legend / Active Keybindings Summary */}
        <div className="border border-slate-800/80 rounded-lg bg-[#0B0F17] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">
              Сводка текущей связки
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {sway.keybindings.length} биндов · {sway.rules.length} правил
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Терминал</span>
              <span className="font-mono text-slate-200">{sway.variables.term}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Меню</span>
              <span className="font-mono text-slate-200 truncate max-w-[120px]">{sway.variables.menu}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Отступы</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {sway.gaps.inner}px / {sway.gaps.outer}px
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Панель</span>
              <span className="font-mono text-slate-200">
                {useWaybar ? `Waybar (${waybar.position})` : useSwaybar ? `Swaybar (${sway.bar.position})` : 'Откл.'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
