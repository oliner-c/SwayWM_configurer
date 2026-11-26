import React, { useState } from 'react';
import {
  Bell,
  Bluetooth,
  ClipboardList,
  FolderOpen,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  Monitor,
  Power,
  Search,
  Settings,
  SlidersHorizontal,
  Volume2,
  Wifi,
  X,
} from 'lucide-react';
import { SwayConfigModel } from '../sway/types';
import { WaybarConfigModel } from '../waybar/types';
import {
  createDefaultEcosystemSettings,
  deriveSystemPalette,
  EcosystemSettings,
  SystemPalette,
} from '../ecosystem/ecosystemEngine';
import { DetectedEcosystemCapabilities } from '../packages/packageAnalyzer';
import { AppLang, tr } from '../i18n/translations';

interface LivePreviewProps {
  sway: SwayConfigModel;
  waybar: WaybarConfigModel;
  ecosystem?: EcosystemSettings;
  palette?: SystemPalette;
  detected?: DetectedEcosystemCapabilities;
  lang?: AppLang;
}

type WindowId = 'term' | 'editor' | 'browser' | 'floating';
type FloatingAppId = 'none' | 'pavucontrol' | 'blueman' | 'thunar' | 'satty';
type AppletPopupId = 'none' | 'network' | 'bluetooth' | 'audio' | 'cliphist' | 'power';

export const LivePreview: React.FC<LivePreviewProps> = ({
  sway,
  waybar,
  ecosystem: propEco,
  palette: propPalette,
  detected,
  lang = 'ru',
}) => {
  const ecosystem = propEco ?? createDefaultEcosystemSettings();
  const palette = propPalette ?? deriveSystemPalette(sway, waybar, ecosystem.colorMode);

  const [activeWorkspace, setActiveWorkspace] = useState<number>(1);
  const [focusedWindow, setFocusedWindow] = useState<WindowId>('term');
  const [singleWindowMode, setSingleWindowMode] = useState<boolean>(false);
  const [floatingApp, setFloatingApp] = useState<FloatingAppId>('pavucontrol');
  const [simulateUrgent, setSimulateUrgent] = useState<boolean>(false);
  const [simulateResizeMode, setSimulateResizeMode] = useState<boolean>(false);

  // Interactive ecosystem overlays & Waybar applets
  const [showLauncher, setShowLauncher] = useState<boolean>(false);
  const [launcherQuery, setLauncherQuery] = useState<string>('');
  const [showMako, setShowMako] = useState<boolean>(false);
  const [showSwaylock, setShowSwaylock] = useState<boolean>(false);
  const [activeApplet, setActiveApplet] = useState<AppletPopupId>('none');

  const primaryOutput =
    sway.outputs.find((o) => o.name !== '*') ?? sway.outputs[0];
  const bgOutput = sway.outputs.find((o) => o.background) ?? primaryOutput;
  const wallpaperColor =
    bgOutput?.background && /^#[0-9a-fA-F]{3,8}$/.test(bgOutput.background)
      ? bgOutput.background
      : '#0F172A';

  const useWaybar = sway.bar.enabled && sway.bar.swaybarCommand === 'waybar' && waybar.enabled;
  const useSwaybar = sway.bar.enabled && sway.bar.swaybarCommand === 'swaybar';

  const browserLabel = detected?.browsers?.includes('zen-browser-bin')
    ? 'zen-browser'
    : detected?.browsers?.[0] ?? 'firefox';

  // Calculate effective gaps with smart_gaps
  const visibleTiledCount = singleWindowMode ? 1 : 3;
  const hideGaps = sway.gaps.smartGaps === 'on' && visibleTiledCount === 1;
  const innerGap = hideGaps ? 0 : Math.min(sway.gaps.inner, 28);
  const outerGap = hideGaps ? 0 : Math.min(sway.gaps.outer, 28);

  const edgeHideActive =
    sway.general.hideEdgeBorders === 'both' ||
    ((sway.general.hideEdgeBorders === 'smart' ||
      sway.general.hideEdgeBorders === 'smart_no_gaps') &&
      visibleTiledCount === 1);

  const hideBorders =
    sway.general.defaultBorder === 'none' ||
    edgeHideActive ||
    (sway.gaps.smartBorders !== 'off' && visibleTiledCount === 1);
  const borderWidth = hideBorders ? 0 : Math.min(Math.max(sway.general.borderThickness, 1), 6);
  const showTitleBar = sway.general.defaultBorder === 'normal';
  const layoutMode = sway.general.workspaceLayout ?? 'default';

  const getWindowColors = (id: WindowId, isUrgent = false) => {
    if (isUrgent) return sway.colors.urgent;
    if (focusedWindow === id) return sway.colors.focused;
    if (id === 'editor') return sway.colors.focusedInactive;
    return sway.colors.unfocused;
  };

  const toggleApplet = (id: AppletPopupId) => {
    setActiveApplet((prev) => (prev === id ? 'none' : id));
  };

  const renderWaybarModule = (mod: string, idx: number, isIsland = false) => {
    const s = waybar.style;
    const modStyle: React.CSSProperties = {
      backgroundColor: mod === 'battery' && isIsland ? s.accentColor : s.moduleBg,
      color: mod === 'battery' && isIsland ? s.accentTextColor : s.textColor,
      borderRadius: isIsland ? '9999px' : `${Math.min(s.borderRadius, 10)}px`,
      fontSize: isIsland ? '8px' : '9px',
    };

    if (mod === 'custom/launcher') {
      return (
        <button
          key={`${mod}-${idx}`}
          type="button"
          onClick={() => setShowLauncher((v) => !v)}
          aria-label={tr(
            lang,
            'Открыть меню приложений в предпросмотре',
            'Toggle launcher in preview'
          )}
          aria-pressed={showLauncher}
          style={{
            backgroundColor: s.accentColor,
            color: s.accentTextColor,
          }}
          className="w-4 h-4 rounded-full inline-flex items-center justify-center shrink-0 leading-none cursor-pointer"
          title={waybar.launcherCommand || 'Launcher'}
        >
          <LayoutGrid className="w-2.5 h-2.5" aria-hidden="true" />
        </button>
      );
    }

    if (mod === 'sway/workspaces') {
      const wsList = isIsland ? [1, 2, 3, 4, 5] : [1, 2, 3, 4];
      const mutedBg = s.mutedPillBg || '#3A4246';
      return (
        <div key={`${mod}-${idx}`} className="flex items-center gap-0.5 shrink-0">
          {wsList.map((ws) => {
            const isCurrent = activeWorkspace === ws;
            const isUrgentWs = simulateUrgent && ws === 3;
            const isOccupied = ws === 1 || ws === 3 || ws === 4;
            return (
              <button
                key={ws}
                type="button"
                onClick={() => setActiveWorkspace(ws)}
                aria-label={tr(lang, `Переключить рабочий стол ${ws}`, `Switch to workspace ${ws}`)}
                style={{
                  backgroundColor: isUrgentWs
                    ? s.urgentColor
                    : isCurrent
                    ? s.accentColor
                    : isIsland
                    ? isOccupied
                      ? s.moduleBg
                      : mutedBg
                    : 'transparent',
                  color: isUrgentWs
                    ? '#ffffff'
                    : isCurrent
                    ? s.accentTextColor
                    : s.textColor,
                  borderRadius: isIsland ? '9999px' : `${Math.min(s.borderRadius, 8)}px`,
                  fontSize: isIsland ? '8px' : '9.5px',
                }}
                className={`${
                  isIsland ? 'w-4 h-4 p-0 flex items-center justify-center' : 'px-1.5 py-0.5'
                } font-mono font-semibold transition-colors cursor-pointer shrink-0 leading-none`}
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
            borderRadius: isIsland ? '9999px' : `${Math.min(s.borderRadius, 8)}px`,
          }}
          className="px-1.5 py-0.5 text-[8.5px] font-mono italic font-semibold shrink-0 leading-none"
        >
          resize
        </span>
      );
    }

    if (mod === 'sway/window') {
      const floatingTitle =
        floatingApp === 'blueman'
          ? 'blueman'
          : floatingApp === 'thunar'
          ? 'thunar'
          : floatingApp === 'satty'
          ? 'satty'
          : 'pavucontrol';
      const titles: Record<WindowId, string> = {
        term: `${sway.variables.term || 'foot'}`,
        editor: 'nvim',
        browser: browserLabel,
        floating: floatingTitle,
      };
      if (isIsland) {
        return (
          <span
            key={`${mod}-${idx}`}
            style={{
              backgroundColor: s.islandBg || '#2C3438',
              color: s.windowTextColor || '#D8DDD9',
              borderColor: s.borderColor,
              borderWidth: `${Math.min(s.borderWidth ?? 1, 2)}px`,
            }}
            className="px-1.5 py-0.5 rounded-full text-[8px] font-mono truncate max-w-[50px] shrink-0 leading-tight"
          >
            {titles[focusedWindow]}
          </span>
        );
      }
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

    if (mod === 'tray') {
      return (
        <div
          key={`${mod}-${idx}`}
          style={modStyle}
          className={`${
            isIsland ? 'px-1 py-0.5' : 'px-1.5 py-0.5'
          } inline-flex items-center gap-1 shrink-0 leading-none`}
        >
          <button
            type="button"
            onClick={() => toggleApplet('network')}
            aria-label={tr(lang, 'Апплет сети nm-applet', 'Network applet nm-applet')}
            title="nm-applet"
            className="hover:opacity-75 cursor-pointer inline-flex items-center"
          >
            <Wifi className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => toggleApplet('cliphist')}
            aria-label={tr(lang, 'История буфера обмена cliphist', 'Clipboard history cliphist')}
            title="cliphist"
            className="hover:opacity-75 cursor-pointer inline-flex items-center"
          >
            <ClipboardList className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
        </div>
      );
    }

    if (mod === 'network' || mod === 'bluetooth' || mod === 'pulseaudio' || mod === 'custom/power') {
      const targetPopup: AppletPopupId =
        mod === 'network'
          ? 'network'
          : mod === 'bluetooth'
          ? 'bluetooth'
          : mod === 'pulseaudio'
          ? 'audio'
          : 'power';

      const content =
        mod === 'bluetooth' ? (
          <Bluetooth className="w-2.5 h-2.5" aria-hidden="true" />
        ) : mod === 'pulseaudio' ? (
          isIsland ? (
            <Volume2 className="w-2.5 h-2.5" aria-hidden="true" />
          ) : (
            (waybar.pulseaudioFormat || 'VOL {volume}%').replace('{volume}', '65')
          )
        ) : mod === 'custom/power' ? (
          <Power className="w-2.5 h-2.5" aria-hidden="true" />
        ) : (
          (waybar.networkFormatWifi || '{essid}')
            .replace('{essid}', isIsland ? 'WLAN' : 'Wi-Fi')
            .replace('{signalStrength}', '92')
        );

      const isIcon =
        (isIsland && (mod === 'bluetooth' || mod === 'pulseaudio')) || mod === 'custom/power';

      return (
        <button
          key={`${mod}-${idx}`}
          type="button"
          onClick={() => toggleApplet(targetPopup)}
          aria-label={tr(lang, `Открыть апплет ${mod}`, `Open ${mod} applet`)}
          aria-pressed={activeApplet === targetPopup}
          style={modStyle}
          className={`${
            isIcon
              ? 'w-4 h-4 inline-flex items-center justify-center'
              : isIsland
              ? 'px-1 py-0.5 font-semibold'
              : 'px-1.5 py-0.5'
          } font-mono whitespace-nowrap shrink-0 leading-none cursor-pointer hover:opacity-85 transition-opacity`}
        >
          {content}
        </button>
      );
    }

    const formatClock = (fmt: string) => {
      if (!fmt) return '14:25';
      if (fmt.includes('%I') || fmt.includes('%p')) return '07:07 PM';
      if (fmt.includes('%d') || fmt.includes('%m')) return '14:25 · 24.11';
      return '14:25';
    };

    const labels: Record<string, React.ReactNode> = {
      'sway/language': lang === 'en' ? 'EN' : 'RU',
      clock: formatClock(waybar.clockFormat),
      cpu: isIsland ? (
        <Settings className="w-2.5 h-2.5" aria-hidden="true" />
      ) : (
        (waybar.cpuFormat || 'CPU {usage}%').replace('{usage}', '14')
      ),
      memory: (waybar.memoryFormat || 'RAM {percentage}%')
        .replace('{percentage}', '38')
        .replace('{used:0.1f}', '3.8'),
      temperature: isIsland
        ? '51°'
        : (waybar.temperatureFormat || '{temperatureC}°C').replace('{temperatureC}', '51'),
      backlight: '80%',
      battery: (waybar.batteryFormat || 'BAT {capacity}%').replace('{capacity}', '88'),
    };

    const isIconPill = isIsland && mod === 'cpu';

    return (
      <span
        key={`${mod}-${idx}`}
        style={modStyle}
        className={`${
          isIconPill
            ? 'w-4 h-4 inline-flex items-center justify-center'
            : isIsland
            ? mod === 'clock' || mod === 'battery'
              ? 'px-1.5 py-0.5 font-semibold'
              : 'px-1 py-0.5 font-semibold'
            : 'px-1.5 py-0.5'
        } font-mono whitespace-nowrap shrink-0 leading-none`}
      >
        {labels[mod] ?? mod}
      </span>
    );
  };

  const renderWaybar = () => {
    const s = waybar.style;
    const barPosition = waybar.position;
    const bw = Math.min(s.borderWidth ?? 1, 3);

    if (s.barMode === 'islands') {
      const islandBg = s.islandBg || '#2C3438';
      const islandStyle: React.CSSProperties = {
        backgroundColor: islandBg,
        borderColor: s.borderColor,
        borderWidth: `${bw}px`,
      };
      const leftCapsuleMods = waybar.modulesLeft.filter(
        (m) => m !== 'sway/window' && m !== 'sway/mode'
      );
      const leftExtraMods = waybar.modulesLeft.filter(
        (m) => m === 'sway/window' || m === 'sway/mode'
      );
      const sysinfoSet = new Set(['tray', 'memory', 'temperature', 'disk']);
      const rightSysMods = waybar.modulesRight.filter((m) => sysinfoSet.has(m));
      const rightCtrlMods = waybar.modulesRight.filter((m) => !sysinfoSet.has(m));

      return (
        <div
          data-testid="preview-waybar"
          style={{
            marginTop: barPosition === 'top' ? `${Math.min(waybar.marginTop, 10)}px` : 0,
            marginBottom: barPosition === 'bottom' ? `${Math.min(waybar.marginBottom, 10)}px` : 0,
            marginLeft: `${Math.min(waybar.marginLeft, 8)}px`,
            marginRight: `${Math.min(waybar.marginRight, 8)}px`,
            height: `${Math.min(Math.max(Math.round(waybar.height * 0.8), 24), 36)}px`,
            fontFamily: s.fontFamily,
          }}
          className="flex items-center justify-between gap-1 shrink-0 transition-all overflow-hidden"
        >
          {/* Left Capsules */}
          <div className="flex items-center gap-0.5 min-w-0 shrink-0">
            {leftCapsuleMods.length > 0 && (
              <div
                style={islandStyle}
                className="flex items-center gap-0.5 px-1 py-0.5 rounded-full shrink-0"
              >
                {leftCapsuleMods.map((m, i) => renderWaybarModule(m, i, true))}
              </div>
            )}
            {leftExtraMods.map((m, i) => renderWaybarModule(m, i, true))}
          </div>

          {/* Center Capsule */}
          {waybar.modulesCenter.length > 0 && (
            <div
              style={islandStyle}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded-full shrink-0"
            >
              {waybar.modulesCenter.map((m, i) => renderWaybarModule(m, i, true))}
            </div>
          )}

          {/* Right Capsules */}
          <div className="flex items-center gap-0.5 min-w-0 shrink-0">
            {rightSysMods.length > 0 && (
              <div
                style={islandStyle}
                className="flex items-center gap-0.5 px-1 py-0.5 rounded-full shrink-0"
              >
                {rightSysMods.map((m, i) => renderWaybarModule(m, i, true))}
              </div>
            )}
            {rightCtrlMods.length > 0 && (
              <div
                style={islandStyle}
                className="flex items-center gap-0.5 px-1 py-0.5 rounded-full shrink-0"
              >
                {rightCtrlMods.map((m, i) => renderWaybarModule(m, i, true))}
              </div>
            )}
          </div>
        </div>
      );
    }

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
          borderWidth: `${bw}px`,
          borderRadius: `${Math.min(s.barRadius, 12)}px`,
          fontFamily: s.fontFamily,
        }}
        className="px-1.5 flex items-center justify-between gap-1.5 shrink-0 transition-all overflow-hidden"
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
                aria-label={tr(lang, `Переключить рабочий стол ${ws}`, `Switch to workspace ${ws}`)}
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
    isUrgent = false,
    customStyle?: React.CSSProperties
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
          backgroundColor: palette.bg,
          color: palette.fg,
          fontFamily: palette.fontFamily,
          ...customStyle,
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
        <div className="flex-1 p-2.5 font-mono text-[10px] leading-relaxed overflow-hidden">
          {body}
        </div>
      </button>
    );
  };

  const renderFloatingProgram = () => {
    if (floatingApp === 'none') return null;

    const col = getWindowColors('floating');
    const isDarkGtk =
      ecosystem.colorMode === 'auto' ? palette.isDark : ecosystem.colorMode === 'dark';

    const titleMap: Record<Exclude<FloatingAppId, 'none'>, string> = {
      pavucontrol: 'pavucontrol',
      blueman: 'blueman-manager',
      thunar: 'Thunar — ~/.config',
      satty: 'satty — screenshot.png',
    };

    const windowBg =
      floatingApp === 'thunar' || floatingApp === 'pavucontrol' || floatingApp === 'blueman'
        ? isDarkGtk
          ? palette.bg
          : '#F1F5F2'
        : palette.surface;
    const windowFg =
      floatingApp === 'thunar' || floatingApp === 'pavucontrol' || floatingApp === 'blueman'
        ? isDarkGtk
          ? palette.fg
          : '#1E2620'
        : palette.fg;

    const floatBorderStyle = sway.general.defaultFloatingBorder ?? 'normal';
    const floatThickness =
      floatBorderStyle === 'none'
        ? 0
        : Math.min(Math.max(sway.general.floatingBorderThickness ?? 2, 1), 6);

    return (
      <div
        data-testid={`preview-floating-${floatingApp}`}
        style={{
          borderColor: col.childBorder,
          borderWidth: `${floatThickness}px`,
          backgroundColor: windowBg,
          color: windowFg,
          fontFamily: palette.fontFamily,
        }}
        onClick={() => setFocusedWindow('floating')}
        className="absolute left-1/2 -translate-x-1/2 bottom-2.5 w-[54%] max-w-[235px] shadow-xl flex flex-col overflow-hidden z-10"
      >
        {floatBorderStyle === 'normal' && (
          <div
            style={{
              backgroundColor: col.background,
              color: col.text,
            }}
            className="px-2 py-0.5 text-[9.5px] font-mono flex items-center justify-between gap-2 shrink-0"
          >
            <span className="truncate">{titleMap[floatingApp]}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFloatingApp('none');
              }}
              aria-label={tr(lang, `Закрыть ${titleMap[floatingApp]}`, `Close ${titleMap[floatingApp]}`)}
              className="hover:opacity-75 cursor-pointer"
            >
              <X className="w-2.5 h-2.5" aria-hidden="true" />
            </button>
          </div>
        )}

        {floatingApp === 'pavucontrol' && (
          <div className="p-2 space-y-1.5 text-[9px] font-mono">
            <div className="flex justify-between">
              <span>PipeWire Analog</span>
              <span>65%</span>
            </div>
            <div className="h-1.5 rounded overflow-hidden" style={{ backgroundColor: palette.surfaceAlt }}>
              <div className="h-full w-[65%]" style={{ backgroundColor: palette.accent }} />
            </div>
            <div className="flex justify-between opacity-75">
              <span>{tr(lang, 'Микрофон', 'Microphone')}</span>
              <span>80%</span>
            </div>
          </div>
        )}

        {floatingApp === 'blueman' && (
          <div className="p-2 space-y-1 text-[9px] font-mono">
            <div className="flex items-center justify-between">
              <span className="font-semibold">WH-1000XM5</span>
              <span style={{ color: palette.accent }}>
                {tr(lang, 'Подключено', 'Connected')}
              </span>
            </div>
            <div className="flex items-center justify-between opacity-75">
              <span>MX Master 3</span>
              <span>85%</span>
            </div>
          </div>
        )}

        {floatingApp === 'thunar' && (
          <div className="grid grid-cols-12 text-[8.5px] font-mono h-[68px]">
            <div
              className="col-span-5 p-1.5 border-r space-y-1 opacity-85"
              style={{ borderColor: palette.surfaceAlt }}
            >
              <div style={{ color: palette.accent }} className="font-semibold">
                .config
              </div>
              <div>{tr(lang, 'Загрузки', 'Downloads')}</div>
              <div>{tr(lang, 'Скриншоты', 'Screenshots')}</div>
            </div>
            <div className="col-span-7 p-1.5 space-y-1">
              <div>sway/</div>
              <div>waybar/</div>
              <div>alacritty.toml</div>
            </div>
          </div>
        )}

        {floatingApp === 'satty' && (
          <div className="p-2 space-y-1.5 text-[9px] font-mono">
            <div
              className="h-8 rounded border flex items-center justify-center text-[8.5px]"
              style={{ borderColor: palette.accent, backgroundColor: palette.surface }}
            >
              {tr(lang, 'Область 960×540', 'Region 960×540')}
            </div>
            <div className="flex items-center justify-between text-[8px]">
              <span style={{ color: palette.accent }}>grim + slurp + satty</span>
              <span>wl-copy</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLauncherOverlay = () => {
    if (!showLauncher) return null;
    const cols = ecosystem.launcherColumns ?? 1;
    const apps = [
      { id: 'term', name: ecosystem.terminalApp === 'foot' ? 'Foot Terminal' : 'Alacritty', hint: '$term' },
      { id: 'browser', name: browserLabel === 'zen-browser' ? 'Zen Browser' : 'Firefox', hint: 'Web' },
      { id: 'thunar', name: 'Thunar', hint: tr(lang, 'GTK Файлы', 'GTK Files') },
      { id: 'pavucontrol', name: 'Pavucontrol', hint: 'PipeWire' },
      { id: 'blueman', name: 'Blueman Manager', hint: 'Bluetooth' },
    ].filter((a) =>
      launcherQuery.trim()
        ? a.name.toLowerCase().includes(launcherQuery.trim().toLowerCase())
        : true
    );

    return (
      <div
        data-testid="preview-launcher-overlay"
        style={{
          backgroundColor: palette.surface,
          color: palette.fg,
          borderColor: palette.border,
          borderWidth: `${Math.min(Math.max(ecosystem.uiBorderWidth ?? 2, 1), 4)}px`,
          borderRadius: `${Math.min(ecosystem.uiCornerRadius, 14)}px`,
          fontFamily: palette.fontFamily,
        }}
        className="absolute inset-x-10 top-1/2 -translate-y-1/2 z-20 p-2.5 shadow-2xl space-y-1.5"
      >
        <div className="flex items-center justify-between gap-2">
          <div
            style={{
              backgroundColor: palette.bg,
              borderColor: palette.surfaceAlt,
              borderRadius: `${Math.max(4, Math.min(ecosystem.uiCornerRadius, 10))}px`,
            }}
            className="flex-1 flex items-center gap-1.5 px-2 py-1 border"
          >
            <Search className="w-3 h-3 opacity-70 shrink-0" aria-hidden="true" />
            <input
              type="text"
              value={launcherQuery}
              onChange={(e) => setLauncherQuery(e.target.value)}
              placeholder={ecosystem.launcherPrompt || `${ecosystem.launcherApp}: ...`}
              aria-label={tr(lang, 'Поиск в лаунчере предпросмотра', 'Search preview launcher')}
              className="w-full bg-transparent text-[10px] font-mono focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowLauncher(false)}
            aria-label={tr(lang, 'Закрыть лаунчер', 'Close launcher')}
            className="p-1 opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>

        <div
          className="grid gap-1 max-h-[104px] overflow-y-auto"
          style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(cols, 1), 3)}, minmax(0, 1fr))` }}
        >
          {apps.map((app, i) => (
            <button
              key={app.id}
              type="button"
              onClick={() => {
                if (app.id === 'thunar' || app.id === 'pavucontrol' || app.id === 'blueman') {
                  setFloatingApp(app.id);
                  setFocusedWindow('floating');
                } else if (app.id === 'term' || app.id === 'browser') {
                  setFocusedWindow(app.id);
                }
                setShowLauncher(false);
                setLauncherQuery('');
              }}
              style={
                i === 0
                  ? {
                      backgroundColor: palette.accent,
                      color: palette.accentFg,
                      borderRadius: `${Math.max(4, Math.min(ecosystem.uiCornerRadius, 8))}px`,
                    }
                  : undefined
              }
              className="w-full px-2 py-1 flex items-center justify-between text-[10px] font-mono cursor-pointer text-left truncate"
            >
              <span className="truncate">{app.name}</span>
              {cols === 1 && <span className="text-[8.5px] opacity-75 shrink-0">{app.hint}</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderMakoToast = () => {
    if (!showMako) return null;
    const anchor = ecosystem.makoAnchor ?? 'top-right';
    const anchorPosClass =
      anchor === 'top-left'
        ? 'left-2.5 top-9'
        : anchor === 'top-center'
        ? 'left-1/2 -translate-x-1/2 top-9'
        : anchor === 'bottom-right'
        ? 'right-2.5 bottom-9'
        : anchor === 'bottom-left'
        ? 'left-2.5 bottom-9'
        : 'right-2.5 top-9';

    return (
      <div
        data-testid="preview-mako-toast"
        style={{
          backgroundColor: simulateUrgent ? palette.bg : palette.surface,
          color: simulateUrgent ? palette.urgentFg : palette.fg,
          borderColor: simulateUrgent ? palette.urgent : palette.border,
          borderWidth: `${Math.min(Math.max(ecosystem.uiBorderWidth ?? 2, 1), 4)}px`,
          borderRadius: `${Math.min(ecosystem.uiCornerRadius, 12)}px`,
          fontFamily: palette.fontFamily,
        }}
        className={`absolute ${anchorPosClass} w-[180px] z-20 p-2 shadow-xl space-y-0.5`}
      >
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono">
          <span className="font-semibold">
            {simulateUrgent
              ? tr(lang, 'mako · Срочно', 'mako · Urgent')
              : tr(lang, 'mako · Скриншот', 'mako · Screenshot')}
          </span>
          <button
            type="button"
            onClick={() => setShowMako(false)}
            aria-label={tr(lang, 'Закрыть уведомление mako', 'Dismiss mako notification')}
            className="opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
        </div>
        <p className="text-[8.5px] font-mono opacity-85 leading-snug">
          {simulateUrgent
            ? tr(lang, 'Низкий заряд батареи: 12%', 'Battery critical: 12% remaining')
            : tr(lang, 'Сохранено через grim + satty в буфер', 'Saved via grim + satty to clipboard')}
        </p>
      </div>
    );
  };

  const renderAppletPopup = () => {
    if (activeApplet === 'none') return null;

    return (
      <div
        data-testid={`preview-applet-${activeApplet}`}
        style={{
          backgroundColor: palette.surface,
          color: palette.fg,
          borderColor: palette.border,
          borderRadius: `${Math.min(ecosystem.uiCornerRadius, 12)}px`,
          fontFamily: palette.fontFamily,
        }}
        className={`absolute right-2.5 ${
          barPosition === 'top' ? 'top-9' : 'bottom-9'
        } w-[185px] z-20 border p-2.5 shadow-xl text-[9px] font-mono space-y-1.5`}
      >
        <div
          className="flex items-center justify-between gap-2 pb-1 border-b"
          style={{ borderColor: palette.surfaceAlt }}
        >
          <span className="font-semibold">
            {activeApplet === 'network' && tr(lang, 'nm-applet · Сеть', 'nm-applet · Network')}
            {activeApplet === 'bluetooth' && 'blueman-applet'}
            {activeApplet === 'audio' && tr(lang, 'wireplumber · Звук', 'wireplumber · Audio')}
            {activeApplet === 'cliphist' && tr(lang, 'cliphist · Буфер', 'cliphist · Clipboard')}
            {activeApplet === 'power' && tr(lang, 'Питание и сессия', 'Power & Session')}
          </span>
          <button
            type="button"
            onClick={() => setActiveApplet('none')}
            aria-label={tr(lang, 'Закрыть попап аплета', 'Close applet popup')}
            className="opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-2.5 h-2.5" aria-hidden="true" />
          </button>
        </div>

        {activeApplet === 'network' && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span style={{ color: palette.accent }}>● WLAN-493361</span>
              <span>92%</span>
            </div>
            <div className="flex justify-between opacity-75">
              <span>○ Office_5G</span>
              <span>74%</span>
            </div>
            <div className="opacity-75">
              {tr(lang, 'VPN: WireGuard (выкл)', 'VPN: WireGuard (off)')}
            </div>
          </div>
        )}

        {activeApplet === 'bluetooth' && (
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>WH-1000XM5</span>
              <span style={{ color: palette.accent }}>85%</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setFloatingApp('blueman');
                setFocusedWindow('floating');
                setActiveApplet('none');
              }}
              style={{ backgroundColor: palette.surfaceAlt, color: palette.fg }}
              className="w-full py-1 rounded text-[8.5px] text-center cursor-pointer"
            >
              {tr(lang, 'Открыть blueman-manager', 'Open blueman-manager')}
            </button>
          </div>
        )}

        {activeApplet === 'audio' && (
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span>{tr(lang, 'Вывод (wpctl)', 'Output (wpctl)')}</span>
              <span>65%</span>
            </div>
            <div className="h-1.5 rounded overflow-hidden" style={{ backgroundColor: palette.surfaceAlt }}>
              <div className="h-full w-[65%]" style={{ backgroundColor: palette.accent }} />
            </div>
            <button
              type="button"
              onClick={() => {
                setFloatingApp('pavucontrol');
                setFocusedWindow('floating');
                setActiveApplet('none');
              }}
              style={{ backgroundColor: palette.surfaceAlt, color: palette.fg }}
              className="w-full py-1 rounded text-[8.5px] text-center cursor-pointer"
            >
              {tr(lang, 'Открыть pavucontrol', 'Open pavucontrol')}
            </button>
          </div>
        )}

        {activeApplet === 'cliphist' && (
          <div className="space-y-1 text-[8.5px]">
            <div className="truncate px-1.5 py-0.5 rounded" style={{ backgroundColor: palette.bg }}>
              1. sudo pacman -S mako swaylock
            </div>
            <div className="truncate px-1.5 py-0.5 rounded" style={{ backgroundColor: palette.bg }}>
              2. {palette.accent}
            </div>
            <div className="truncate px-1.5 py-0.5 rounded opacity-75" style={{ backgroundColor: palette.bg }}>
              3. grim -g &quot;$(slurp)&quot; - | wl-copy
            </div>
          </div>
        )}

        {activeApplet === 'power' && (
          <div className="grid grid-cols-2 gap-1 text-[8.5px]">
            <button
              type="button"
              onClick={() => {
                setShowSwaylock(true);
                setActiveApplet('none');
              }}
              style={{ backgroundColor: palette.surfaceAlt }}
              className="py-1 px-1.5 rounded text-left cursor-pointer"
            >
              {tr(lang, 'Блокировка', 'Lock')}
            </button>
            <div className="py-1 px-1.5 rounded opacity-75" style={{ backgroundColor: palette.bg }}>
              {tr(lang, 'Сон', 'Suspend')}
            </div>
            <div className="py-1 px-1.5 rounded opacity-75" style={{ backgroundColor: palette.bg }}>
              {tr(lang, 'Рестарт', 'Reboot')}
            </div>
            <div className="py-1 px-1.5 rounded opacity-75" style={{ backgroundColor: palette.bg }}>
              {tr(lang, 'Выход', 'Logout')}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSwaylockOverlay = () => {
    if (!showSwaylock) return null;
    const ringSize = Math.round(Math.min(Math.max(ecosystem.swaylockRadius ?? 90, 60), 130) * 0.9);
    const ringBorder = Math.min(Math.max(ecosystem.swaylockThickness ?? 8, 3), 12);

    return (
      <div
        data-testid="preview-swaylock-overlay"
        style={{ backgroundColor: `${palette.wallpaper}ee`, fontFamily: palette.fontFamily }}
        className={`absolute inset-0 z-30 ${
          ecosystem.swaylockEffectBlur ? 'backdrop-blur-md' : 'backdrop-blur-[2px]'
        } flex flex-col items-center justify-center gap-2.5 p-4`}
      >
        <div
          style={{
            width: `${ringSize}px`,
            height: `${ringSize}px`,
            borderWidth: `${ringBorder}px`,
            borderColor: palette.accent,
            backgroundColor: palette.surface,
            color: palette.fg,
          }}
          className="rounded-full flex flex-col items-center justify-center shadow-2xl"
        >
          <span className="text-xs font-mono font-bold">
            {ecosystem.swaylockShowClock ? '07:07:24' : '07:07'}
          </span>
          <span className="text-[8px] font-mono opacity-75">swaylock</span>
        </div>
        <button
          type="button"
          onClick={() => setShowSwaylock(false)}
          style={{ backgroundColor: palette.accent, color: palette.accentFg }}
          className="px-3 py-1 rounded-full text-[10px] font-mono font-semibold cursor-pointer"
        >
          {tr(lang, 'Разблокировать', 'Unlock')}
        </button>
      </div>
    );
  };

  const barPosition = useWaybar ? waybar.position : sway.bar.position;

  return (
    <section
      aria-label={tr(
        lang,
        'Предпросмотр SwayWM и Waybar в реальном времени',
        'Real-time SwayWM and Waybar preview'
      )}
      className="flex flex-col h-full bg-[#0E131E]"
    >
      {/* Preview controls header */}
      <div className="px-4 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            {tr(lang, 'Живой предпросмотр рабочего стола', 'Live Desktop Preview')}
          </h2>
          <p className="text-xs text-slate-400 font-mono tabular-nums">
            {primaryOutput?.name || 'DP-1'} · {primaryOutput?.resolution || '1920x1080'}
            {primaryOutput?.refreshRate ? `@${primaryOutput.refreshRate}` : ''} ·{' '}
            {primaryOutput?.scale || 1}x ·{' '}
            {useWaybar ? 'Waybar' : useSwaybar ? 'Swaybar' : tr(lang, 'Без панели', 'No Bar')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSingleWindowMode((v) => !v)}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              singleWindowMode
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            {tr(lang, '1 окно', '1 Window')}
          </button>
          <button
            type="button"
            onClick={() => setFloatingApp((prev) => (prev === 'none' ? 'pavucontrol' : 'none'))}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              floatingApp !== 'none'
                ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            Floating
          </button>
          <button
            type="button"
            onClick={() => setSimulateUrgent((v) => !v)}
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
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
            className={`px-2 py-1 text-xs rounded-md border transition-colors ${
              simulateResizeMode
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-slate-100'
            }`}
          >
            Resize
          </button>
        </div>
      </div>

      {/* Monitor Frame + Interactive Program/Applet Strip + Summary */}
      <div className="p-4 flex-1 flex flex-col justify-start gap-3 overflow-y-auto">
        <div
          data-testid="sway-monitor-screen"
          style={{ backgroundColor: wallpaperColor }}
          className="relative w-full aspect-[16/10] rounded-lg border border-slate-700/80 overflow-hidden flex flex-col shadow-lg shrink-0"
        >
          {(useWaybar || useSwaybar) && barPosition === 'top' && (
            useWaybar ? renderWaybar() : renderSwaybar()
          )}

          {/* Optional tabbed / stacking indicator bar */}
          {layoutMode !== 'default' && (
            <div className="px-2 pt-1 flex items-center gap-1 text-[9px] font-mono">
              {[
                sway.variables.term || 'foot',
                'nvim',
                browserLabel,
              ].map((t, idx) => {
                const c = idx === 0 ? sway.colors.focused : sway.colors.focusedInactive;
                return (
                  <span
                    key={t}
                    style={{
                      backgroundColor: c.background,
                      color: c.text,
                      borderColor: c.border,
                    }}
                    className={`px-2 py-0.5 border truncate ${
                      layoutMode === 'tabbed' ? 'flex-1 text-center' : 'w-full'
                    }`}
                  >
                    {t}
                  </span>
                );
              })}
            </div>
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
                  <div style={{ color: palette.accent }}>~/sway-setup $ swaymsg -t get_version</div>
                  <div className="opacity-75">sway version 1.10 · wayland</div>
                  <div className="opacity-75">
                    gaps: inner {sway.gaps.inner}px / outer {sway.gaps.outer}px
                  </div>
                  <div className="opacity-75">
                    mod: {sway.variables.mod} · {sway.variables.term || 'foot'}
                  </div>
                  <div style={{ color: palette.accent }}>
                    {tr(lang, `ws #${activeWorkspace} активен`, `ws #${activeWorkspace} active`)}
                  </div>
                </div>,
                false,
                { opacity: ecosystem.terminalOpacity }
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
                      <div className="opacity-55">1 set $mod {sway.variables.mod}</div>
                      <div className="opacity-75">2 set $term {sway.variables.term}</div>
                      <div className="opacity-95">3 gaps inner {sway.gaps.inner}</div>
                      <div style={{ color: palette.accent }}>
                        4 swaybar_command {sway.bar.swaybarCommand}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  {renderTileWindow(
                    'browser',
                    `${browserLabel} — Wayland`,
                    <div className="space-y-1 text-[9.5px]">
                      <div>{tr(lang, `Рабочий стол #${activeWorkspace}`, `Workspace #${activeWorkspace}`)}</div>
                      <div className="opacity-70">
                        {tr(lang, 'Раскладки:', 'Layouts:')}{' '}
                        {sway.inputs.find((i) => i.xkbLayout)?.xkbLayout || 'us,ru'}
                      </div>
                      <div className="opacity-70">
                        {simulateUrgent
                          ? tr(lang, 'Уведомление: требуется внимание', 'Urgent: attention required')
                          : tr(lang, 'Нажмите на окно для фокуса', 'Click window to focus')}
                      </div>
                    </div>,
                    simulateUrgent
                  )}
                </div>
              </div>
            )}

            {/* Floating Program Overlay */}
            {renderFloatingProgram()}
          </div>

          {(useWaybar || useSwaybar) && barPosition === 'bottom' && (
            useWaybar ? renderWaybar() : renderSwaybar()
          )}

          {/* Ecosystem Overlays & Interactive Applets */}
          {renderLauncherOverlay()}
          {renderMakoToast()}
          {renderAppletPopup()}
          {renderSwaylockOverlay()}
        </div>

        {/* Interactive Programs & Applets Bar */}
        <div className="border border-slate-800/80 rounded-lg bg-[#0B0F17] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-200">
              {tr(lang, 'Программы и аплеты в предпросмотре', 'Preview Apps & Applets')}
            </h3>
            <span className="text-[11px] text-slate-400">
              {tr(lang, 'Кликайте для теста в окне выше', 'Click to toggle overlays above')}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setShowLauncher((v) => !v)}
              aria-pressed={showLauncher}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                showLauncher
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Search className="w-3 h-3" aria-hidden="true" />
              <span>{ecosystem.launcherApp}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMako((v) => !v)}
              aria-pressed={showMako}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                showMako
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Bell className="w-3 h-3" aria-hidden="true" />
              <span>mako</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSwaylock((v) => !v)}
              aria-pressed={showSwaylock}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                showSwaylock
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Lock className="w-3 h-3" aria-hidden="true" />
              <span>swaylock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFloatingApp((p) => (p === 'pavucontrol' ? 'none' : 'pavucontrol'));
                setFocusedWindow('floating');
              }}
              aria-pressed={floatingApp === 'pavucontrol'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                floatingApp === 'pavucontrol'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
              <span>pavucontrol</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFloatingApp((p) => (p === 'blueman' ? 'none' : 'blueman'));
                setFocusedWindow('floating');
              }}
              aria-pressed={floatingApp === 'blueman'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                floatingApp === 'blueman'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Bluetooth className="w-3 h-3" aria-hidden="true" />
              <span>blueman</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFloatingApp((p) => (p === 'thunar' ? 'none' : 'thunar'));
                setFocusedWindow('floating');
              }}
              aria-pressed={floatingApp === 'thunar'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                floatingApp === 'thunar'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <FolderOpen className="w-3 h-3" aria-hidden="true" />
              <span>thunar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setFloatingApp((p) => (p === 'satty' ? 'none' : 'satty'));
                setFocusedWindow('floating');
              }}
              aria-pressed={floatingApp === 'satty'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                floatingApp === 'satty'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <ImageIcon className="w-3 h-3" aria-hidden="true" />
              <span>satty</span>
            </button>

            <button
              type="button"
              onClick={() => toggleApplet('network')}
              aria-pressed={activeApplet === 'network'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                activeApplet === 'network'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Wifi className="w-3 h-3" aria-hidden="true" />
              <span>nm-applet</span>
            </button>

            <button
              type="button"
              onClick={() => toggleApplet('cliphist')}
              aria-pressed={activeApplet === 'cliphist'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                activeApplet === 'cliphist'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <ClipboardList className="w-3 h-3" aria-hidden="true" />
              <span>cliphist</span>
            </button>

            <button
              type="button"
              onClick={() => toggleApplet('power')}
              aria-pressed={activeApplet === 'power'}
              className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition-colors ${
                activeApplet === 'power'
                  ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100'
              }`}
            >
              <Monitor className="w-3 h-3" aria-hidden="true" />
              <span>{tr(lang, 'сессия', 'session')}</span>
            </button>
          </div>
        </div>

        {/* Live Legend / Active Keybindings Summary */}
        <div className="border border-slate-800/80 rounded-lg bg-[#0B0F17] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-200">
              {tr(lang, 'Сводка текущей связки', 'Active Stack Summary')}
            </h3>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {tr(
                lang,
                `${sway.keybindings.length} биндов · ${sway.rules.length} правил`,
                `${sway.keybindings.length} binds · ${sway.rules.length} rules`
              )}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>{tr(lang, 'Терминал', 'Terminal')}</span>
              <span className="font-mono text-slate-200">{sway.variables.term}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{tr(lang, 'Меню', 'Launcher')}</span>
              <span className="font-mono text-slate-200 truncate max-w-[120px]">{sway.variables.menu}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{tr(lang, 'Отступы', 'Gaps')}</span>
              <span className="font-mono text-slate-200 tabular-nums">
                {sway.gaps.inner}px / {sway.gaps.outer}px
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{tr(lang, 'Панель', 'Bar')}</span>
              <span className="font-mono text-slate-200">
                {useWaybar
                  ? `Waybar (${waybar.position})`
                  : useSwaybar
                  ? `Swaybar (${sway.bar.position})`
                  : tr(lang, 'Откл.', 'Off')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
