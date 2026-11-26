import { createDefaultWaybarModel } from './presets';
import { WaybarConfigModel, WaybarDiagnostic } from './types';

function stripJsonComments(jsonc: string): string {
  return jsonc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

const KNOWN_WAYBAR_MODULES = new Set([
  'sway/workspaces',
  'sway/mode',
  'sway/window',
  'sway/language',
  'sway/scratchpad',
  'clock',
  'cpu',
  'memory',
  'disk',
  'temperature',
  'network',
  'bluetooth',
  'pulseaudio',
  'wireplumber',
  'backlight',
  'battery',
  'power-profiles-daemon',
  'idle_inhibitor',
  'keyboard-state',
  'tray',
  'mpd',
  'mpris',
  'privacy',
  'systemd-failed-units',
  'cava',
  'gamemode',
  'inhibitor',
  'upower',
  'user',
  'load',
]);

const MANAGED_TOP_KEYS = new Set([
  'layer',
  'position',
  'height',
  'spacing',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'reload_style_on_change',
  'modules-left',
  'modules-center',
  'modules-right',
  'group/left-pill',
  'group/center-pill',
  'group/sysinfo',
  'group/controls',
  'custom/launcher',
  'sway/workspaces',
  'sway/mode',
  'sway/window',
  'sway/language',
  'clock',
  'cpu',
  'memory',
  'temperature',
  'network',
  'bluetooth',
  'pulseaudio',
  'backlight',
  'battery',
  'tray',
  'custom/power',
]);

const SYSINFO_GROUP_MODULES = new Set(['tray', 'memory', 'temperature', 'disk']);

export function serializeWaybarJson(model: WaybarConfigModel): string {
  const extra = model.rawExtraJson ?? {};
  const isIslands = model.style.barMode === 'islands';

  let modulesLeft = model.modulesLeft;
  let modulesCenter = model.modulesCenter;
  let modulesRight = model.modulesRight;
  const groupConfigs: Record<string, unknown> = {};

  if (isIslands) {
    const leftPillMods = model.modulesLeft.filter((m) => m !== 'sway/window' && m !== 'sway/mode');
    const leftExtraMods = model.modulesLeft.filter((m) => m === 'sway/window' || m === 'sway/mode');
    modulesLeft = [];
    if (leftPillMods.length > 0) {
      modulesLeft.push('group/left-pill');
      groupConfigs['group/left-pill'] = {
        orientation: 'horizontal',
        modules: leftPillMods,
      };
    }
    modulesLeft.push(...leftExtraMods);

    if (model.modulesCenter.length > 0) {
      modulesCenter = ['group/center-pill'];
      groupConfigs['group/center-pill'] = {
        orientation: 'horizontal',
        modules: model.modulesCenter,
      };
    }

    const sysMods = model.modulesRight.filter((m) => SYSINFO_GROUP_MODULES.has(m));
    const ctrlMods = model.modulesRight.filter((m) => !SYSINFO_GROUP_MODULES.has(m));
    modulesRight = [];
    if (sysMods.length > 0) {
      modulesRight.push('group/sysinfo');
      groupConfigs['group/sysinfo'] = {
        orientation: 'horizontal',
        modules: sysMods,
      };
    }
    if (ctrlMods.length > 0) {
      modulesRight.push('group/controls');
      groupConfigs['group/controls'] = {
        orientation: 'horizontal',
        modules: ctrlMods,
      };
    }
  }

  const obj: Record<string, unknown> = {
    layer: model.layer,
    position: model.position,
    height: model.height,
    spacing: model.spacing,
    'margin-top': model.marginTop,
    'margin-bottom': model.marginBottom,
    'margin-left': model.marginLeft,
    'margin-right': model.marginRight,
    ...(model.reloadStyleOnChange !== undefined
      ? { reload_style_on_change: model.reloadStyleOnChange }
      : {}),
    'modules-left': modulesLeft,
    'modules-center': modulesCenter,
    'modules-right': modulesRight,
    ...groupConfigs,
    'custom/launcher': {
      format: model.launcherFormat || '󰀻',
      tooltip: false,
      'on-click': model.launcherCommand || 'wofi --show drun',
    },
    'sway/workspaces': {
      'disable-scroll': model.disableWorkspaceScroll,
      'all-outputs': true,
      format: model.workspaceFormat || '{name}',
    },
    'sway/mode': {
      format: '<span style="italic">{}</span>',
    },
    'sway/window': {
      'max-length': model.windowMaxLength ?? 42,
    },
    'sway/language': {
      format: '{short}',
    },
    clock: {
      format: model.clockFormat,
      'tooltip-format': '{:%A, %d %B %Y}',
    },
    cpu: {
      format: model.cpuFormat,
      interval: model.cpuInterval ?? 2,
    },
    memory: {
      format: model.memoryFormat,
      interval: model.memoryInterval ?? 5,
    },
    temperature: {
      'critical-threshold': model.temperatureCriticalThreshold ?? 80,
      format: model.temperatureFormat || '{temperatureC}°',
      interval: 5,
    },
    backlight: {
      format: '{percent}%',
    },
    network: {
      'format-wifi': model.networkFormatWifi,
      'format-ethernet': model.networkFormatEthernet || '{ifname}: {ipaddr}',
      'format-disconnected': model.networkFormatDisconnected || 'Нет сети',
    },
    bluetooth: {
      format: '',
      'format-connected': '',
      'on-click': 'blueman-manager',
    },
    pulseaudio: {
      format: model.pulseaudioFormat,
      'format-muted': model.pulseaudioFormatMuted || 'MUTE',
      'scroll-step': model.pulseaudioScrollStep ?? 5,
      'on-click': 'pavucontrol',
    },
    battery: {
      states: {
        warning: model.batteryWarning ?? 30,
        critical: model.batteryCritical ?? 15,
      },
      format: model.batteryFormat,
    },
    tray: {
      'icon-size': model.trayIconSize ?? 16,
      spacing: model.traySpacing ?? 8,
    },
    'custom/power': {
      format: model.powerFormat || '⏻',
      tooltip: false,
      'on-click':
        model.powerCommand || 'swaynag -t warning -m "Выйти из Sway?" -B "Да" "swaymsg exit"',
    },
    ...extra,
  };

  return `// Waybar Configuration — синхронизировано с SwayWM\n${JSON.stringify(obj, null, 2)}\n`;
}

export function serializeWaybarCss(model: WaybarConfigModel): string {
  const s = model.style;
  const borderWidth = s.borderWidth ?? 1;
  const padX = s.modulePaddingX ?? 10;
  const padY = s.modulePaddingY ?? 2;
  const borderRule = borderWidth > 0 ? `${borderWidth}px solid ${s.borderColor}` : 'none';

  if (s.barMode === 'islands') {
    const islandBg = s.islandBg || '#2C3438';
    const mutedPillBg = s.mutedPillBg || '#3A4246';
    const windowText = s.windowTextColor || '#D8DDD9';
    return `/* Waybar Stylesheet (Islands) — синхронизировано с SwayWM */
* {
  font-family: ${s.fontFamily};
  font-size: ${s.fontSize}px;
  min-height: 0;
}

window#waybar {
  background-color: transparent;
  color: ${s.textColor};
  border: none;
  border-radius: ${s.barRadius}px;
}

#left-pill,
#center-pill,
#sysinfo,
#controls,
#window {
  background-color: ${islandBg};
  border: ${borderRule};
  border-radius: ${s.barRadius}px;
  padding: 3px 5px;
}

window#waybar #window {
  color: ${windowText};
  padding: 3px ${Math.max(8, padX + 2)}px;
}

window#waybar.empty #window {
  background-color: transparent;
  border: none;
}

#custom-launcher {
  background-color: ${s.accentColor};
  color: ${s.accentTextColor};
  border-radius: ${s.barRadius}px;
  padding: 2px 9px;
  margin: 0 3px 0 0;
}

#workspaces button {
  padding: 2px 8px;
  margin: 0 2px;
  border-radius: ${s.barRadius}px;
  background-color: ${mutedPillBg};
  color: ${s.textColor};
}

#workspaces button.visible,
#workspaces button.persistent {
  background-color: ${s.moduleBg};
  color: ${s.textColor};
}

#workspaces button.focused {
  background-color: ${s.accentColor};
  color: ${s.accentTextColor};
  font-weight: 600;
}

#workspaces button.urgent {
  background-color: ${s.urgentColor};
  color: #ffffff;
}

#mode {
  background-color: ${s.urgentColor};
  color: #ffffff;
  padding: 2px 10px;
  border-radius: ${s.barRadius}px;
}

#clock,
#cpu,
#memory,
#temperature,
#network,
#bluetooth,
#pulseaudio,
#backlight,
#language,
#tray,
#custom-power {
  background-color: ${s.moduleBg};
  color: ${s.textColor};
  padding: ${padY}px ${padX}px;
  margin: 0 2px;
  border-radius: ${s.borderRadius}px;
}

#battery {
  background-color: ${s.accentColor};
  color: ${s.accentTextColor};
  padding: ${padY}px ${padX}px;
  margin: 0 2px;
  border-radius: ${s.borderRadius}px;
  font-weight: 600;
}

#battery.warning:not(.charging) {
  background-color: ${s.urgentColor};
  color: #ffffff;
}
`;
  }

  return `/* Waybar Stylesheet — синхронизировано с SwayWM */
* {
  font-family: ${s.fontFamily};
  font-size: ${s.fontSize}px;
  min-height: 0;
}

window#waybar {
  background-color: ${s.background};
  color: ${s.textColor};
  border: ${borderRule};
  border-radius: ${s.barRadius}px;
}

#workspaces button {
  padding: 2px 10px;
  margin: 3px 2px;
  border-radius: ${s.borderRadius}px;
  background-color: transparent;
  color: ${s.textColor};
}

#workspaces button.focused {
  background-color: ${s.accentColor};
  color: ${s.accentTextColor};
  font-weight: 600;
}

#workspaces button.urgent {
  background-color: ${s.urgentColor};
  color: #ffffff;
}

#mode {
  background-color: ${s.urgentColor};
  color: #ffffff;
  padding: 2px 8px;
  margin: 3px 4px;
  border-radius: ${s.borderRadius}px;
}

#clock,
#cpu,
#memory,
#temperature,
#network,
#bluetooth,
#pulseaudio,
#backlight,
#battery,
#language,
#tray,
#custom-power {
  background-color: ${s.moduleBg};
  color: ${s.textColor};
  padding: ${padY}px ${padX}px;
  margin: 3px 2px;
  border-radius: ${s.borderRadius}px;
}

#battery.warning:not(.charging) {
  background-color: ${s.urgentColor};
  color: #ffffff;
}
`;
}

export function parseWaybarFiles(jsonc: string, css: string): WaybarConfigModel {
  const model = createDefaultWaybarModel();
  model.rawExtraJson = {};

  try {
    const parsed = JSON.parse(stripJsonComments(jsonc)) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      if (parsed.layer === 'top' || parsed.layer === 'bottom' || parsed.layer === 'overlay') {
        model.layer = parsed.layer;
      }
      if (parsed.position === 'top' || parsed.position === 'bottom') model.position = parsed.position;
      if (typeof parsed.height === 'number') model.height = parsed.height;
      if (typeof parsed.spacing === 'number') model.spacing = parsed.spacing;
      if (typeof parsed['margin-top'] === 'number') model.marginTop = parsed['margin-top'];
      if (typeof parsed['margin-bottom'] === 'number') model.marginBottom = parsed['margin-bottom'];
      if (typeof parsed['margin-left'] === 'number') model.marginLeft = parsed['margin-left'];
      if (typeof parsed['margin-right'] === 'number') model.marginRight = parsed['margin-right'];
      if (typeof parsed.reload_style_on_change === 'boolean') {
        model.reloadStyleOnChange = parsed.reload_style_on_change;
      }

      const expandGroups = (list: unknown): string[] => {
        if (!Array.isArray(list)) return [];
        const out: string[] = [];
        for (const item of list) {
          const key = String(item);
          if (
            key === 'group/left-pill' ||
            key === 'group/center-pill' ||
            key === 'group/sysinfo' ||
            key === 'group/controls'
          ) {
            const grp = parsed[key] as Record<string, unknown> | undefined;
            if (Array.isArray(grp?.modules)) {
              out.push(...grp.modules.map(String));
              continue;
            }
          }
          out.push(key);
        }
        return out;
      };

      if (Array.isArray(parsed['modules-left'])) model.modulesLeft = expandGroups(parsed['modules-left']);
      if (Array.isArray(parsed['modules-center'])) model.modulesCenter = expandGroups(parsed['modules-center']);
      if (Array.isArray(parsed['modules-right'])) model.modulesRight = expandGroups(parsed['modules-right']);

      const launcherCfg = parsed['custom/launcher'] as Record<string, unknown> | undefined;
      if (launcherCfg?.format) model.launcherFormat = String(launcherCfg.format);
      if (launcherCfg?.['on-click']) model.launcherCommand = String(launcherCfg['on-click']);

      const powerCfg = parsed['custom/power'] as Record<string, unknown> | undefined;
      if (powerCfg?.format) model.powerFormat = String(powerCfg.format);
      if (powerCfg?.['on-click']) model.powerCommand = String(powerCfg['on-click']);

      const clockCfg = parsed.clock as Record<string, unknown> | undefined;
      if (clockCfg?.format) model.clockFormat = String(clockCfg.format);

      const wsCfg = parsed['sway/workspaces'] as Record<string, unknown> | undefined;
      if (typeof wsCfg?.['disable-scroll'] === 'boolean') {
        model.disableWorkspaceScroll = wsCfg['disable-scroll'];
      }
      if (wsCfg?.format) model.workspaceFormat = String(wsCfg.format);

      const winCfg = parsed['sway/window'] as Record<string, unknown> | undefined;
      if (typeof winCfg?.['max-length'] === 'number') {
        model.windowMaxLength = winCfg['max-length'];
      }

      const cpuCfg = parsed.cpu as Record<string, unknown> | undefined;
      if (cpuCfg?.format) model.cpuFormat = String(cpuCfg.format);
      if (typeof cpuCfg?.interval === 'number') model.cpuInterval = cpuCfg.interval;

      const memCfg = parsed.memory as Record<string, unknown> | undefined;
      if (memCfg?.format) model.memoryFormat = String(memCfg.format);
      if (typeof memCfg?.interval === 'number') model.memoryInterval = memCfg.interval;

      const tempCfg = parsed.temperature as Record<string, unknown> | undefined;
      if (tempCfg?.format) model.temperatureFormat = String(tempCfg.format);
      if (typeof tempCfg?.['critical-threshold'] === 'number') {
        model.temperatureCriticalThreshold = tempCfg['critical-threshold'];
      }

      const netCfg = parsed.network as Record<string, unknown> | undefined;
      if (netCfg?.['format-wifi']) model.networkFormatWifi = String(netCfg['format-wifi']);
      if (netCfg?.['format-ethernet']) {
        model.networkFormatEthernet = String(netCfg['format-ethernet']);
      }
      if (netCfg?.['format-disconnected']) {
        model.networkFormatDisconnected = String(netCfg['format-disconnected']);
      }

      const paCfg = parsed.pulseaudio as Record<string, unknown> | undefined;
      if (paCfg?.format) model.pulseaudioFormat = String(paCfg.format);
      if (paCfg?.['format-muted']) model.pulseaudioFormatMuted = String(paCfg['format-muted']);
      if (typeof paCfg?.['scroll-step'] === 'number') {
        model.pulseaudioScrollStep = paCfg['scroll-step'];
      }

      const batCfg = parsed.battery as Record<string, unknown> | undefined;
      if (batCfg?.format) model.batteryFormat = String(batCfg.format);
      const batStates = batCfg?.states as Record<string, unknown> | undefined;
      if (typeof batStates?.warning === 'number') model.batteryWarning = batStates.warning;
      if (typeof batStates?.critical === 'number') model.batteryCritical = batStates.critical;

      const trayCfg = parsed.tray as Record<string, unknown> | undefined;
      if (typeof trayCfg?.['icon-size'] === 'number') model.trayIconSize = trayCfg['icon-size'];
      if (typeof trayCfg?.spacing === 'number') model.traySpacing = trayCfg.spacing;

      // Preserve any custom modules or top-level properties the user added in raw JSONC
      const extra: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (!MANAGED_TOP_KEYS.has(k)) {
          extra[k] = v;
        }
      }
      model.rawExtraJson = extra;
    }
  } catch {
    // Keep defaults if user is mid-typing invalid JSON
  }

  const extractRuleProp = (selectorRegex: RegExp, prop: string): string | null => {
    const blockMatch = css.match(selectorRegex);
    if (!blockMatch) return null;
    const propMatch = blockMatch[1].match(new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+);`));
    return propMatch ? propMatch[1].trim() : null;
  };

  const fontFam = extractRuleProp(/\*[^{]*\{([^}]*)\}/, 'font-family');
  if (fontFam) model.style.fontFamily = fontFam;
  const fontSize = extractRuleProp(/\*[^{]*\{([^}]*)\}/, 'font-size');
  if (fontSize) {
    const num = parseInt(fontSize, 10);
    if (!Number.isNaN(num)) model.style.fontSize = num;
  }

  const barBg = extractRuleProp(/window#waybar\s*\{([^}]*)\}/, 'background-color');
  if (barBg) model.style.background = barBg;
  const barText = extractRuleProp(/window#waybar\s*\{([^}]*)\}/, 'color');
  if (barText) model.style.textColor = barText;
  const barRadius = extractRuleProp(/window#waybar\s*\{([^}]*)\}/, 'border-radius');
  if (barRadius) {
    const num = parseInt(barRadius, 10);
    if (!Number.isNaN(num)) model.style.barRadius = num;
  }
  const barBorder = extractRuleProp(/window#waybar\s*\{([^}]*)\}/, 'border');
  if (barBorder) {
    if (barBorder === 'none') {
      model.style.borderWidth = 0;
    } else {
      const bw = barBorder.match(/(\d+)px/);
      if (bw) model.style.borderWidth = parseInt(bw[1], 10);
      const hex = barBorder.match(/#[0-9a-fA-F]{3,8}/);
      if (hex) model.style.borderColor = hex[0];
    }
  }

  const hasIslands =
    barBg === 'transparent' || /#left-pill[\s\S]*?#sysinfo[\s\S]*?\{/.test(css);
  model.style.barMode = hasIslands ? 'islands' : 'bar';

  if (hasIslands) {
    const islandBg = extractRuleProp(/#left-pill[\s\S]*?#window\s*\{([^}]*)\}/, 'background-color');
    if (islandBg) model.style.islandBg = islandBg;
    const islandBorder = extractRuleProp(/#left-pill[\s\S]*?#window\s*\{([^}]*)\}/, 'border');
    if (islandBorder) {
      if (islandBorder === 'none') {
        model.style.borderWidth = 0;
      } else {
        const bw = islandBorder.match(/(\d+)px/);
        if (bw) model.style.borderWidth = parseInt(bw[1], 10);
        const hex = islandBorder.match(/#[0-9a-fA-F]{3,8}/);
        if (hex) model.style.borderColor = hex[0];
      }
    }
    const winColor =
      extractRuleProp(/window#waybar\s+#window\s*\{([^}]*)\}/, 'color') ??
      extractRuleProp(/#window\s*\{(\s*color\s*:[^}]*)\}/, 'color');
    if (winColor) model.style.windowTextColor = winColor;
    const mutedBg = extractRuleProp(/#workspaces\s+button\s*\{([^}]*)\}/, 'background-color');
    if (mutedBg) model.style.mutedPillBg = mutedBg;
  }

  const focusedBg = extractRuleProp(/#workspaces\s+button\.focused\s*\{([^}]*)\}/, 'background-color');
  if (focusedBg) model.style.accentColor = focusedBg;
  const focusedTxt = extractRuleProp(/#workspaces\s+button\.focused\s*\{([^}]*)\}/, 'color');
  if (focusedTxt) model.style.accentTextColor = focusedTxt;

  const modBg = extractRuleProp(/#clock[\s\S]*?\{([^}]*)\}/, 'background-color');
  if (modBg) model.style.moduleBg = modBg;
  const modRad = extractRuleProp(/#clock[\s\S]*?\{([^}]*)\}/, 'border-radius');
  if (modRad) {
    const num = parseInt(modRad, 10);
    if (!Number.isNaN(num)) model.style.borderRadius = num;
  }
  const modPad = extractRuleProp(/#clock[\s\S]*?\{([^}]*)\}/, 'padding');
  if (modPad) {
    const m = modPad.match(/(\d+)px\s+(\d+)px/);
    if (m) {
      model.style.modulePaddingY = parseInt(m[1], 10);
      model.style.modulePaddingX = parseInt(m[2], 10);
    }
  }

  const urgentBg = extractRuleProp(/#workspaces\s+button\.urgent\s*\{([^}]*)\}/, 'background-color');
  if (urgentBg) model.style.urgentColor = urgentBg;

  return model;
}

export function validateWaybarFiles(jsonc: string, css: string): WaybarDiagnostic[] {
  const diagnostics: WaybarDiagnostic[] = [];
  try {
    const parsed = JSON.parse(stripJsonComments(jsonc)) as Record<string, unknown>;
    if (!parsed['modules-left'] && !parsed['modules-center'] && !parsed['modules-right']) {
      diagnostics.push({
        file: 'waybar/config.jsonc',
        line: 1,
        severity: 'warning',
        message: 'Не указаны модули Waybar (modules-left, modules-center или modules-right).',
      });
    }

    if (
      typeof parsed.position === 'string' &&
      !['top', 'bottom', 'left', 'right'].includes(parsed.position)
    ) {
      diagnostics.push({
        file: 'waybar/config.jsonc',
        line: 1,
        severity: 'error',
        message: `Недопустимая позиция Waybar «${parsed.position}» (ожидается top, bottom, left или right).`,
      });
    }

    if (
      typeof parsed.layer === 'string' &&
      !['top', 'bottom', 'overlay', 'background'].includes(parsed.layer)
    ) {
      diagnostics.push({
        file: 'waybar/config.jsonc',
        line: 1,
        severity: 'error',
        message: `Недопустимый слой Waybar «${parsed.layer}» (ожидается top, bottom, overlay или background).`,
      });
    }

    for (const zone of ['modules-left', 'modules-center', 'modules-right'] as const) {
      const list = parsed[zone];
      if (Array.isArray(list)) {
        for (const item of list) {
          const modName = String(item).split('#')[0];
          if (
            !KNOWN_WAYBAR_MODULES.has(modName) &&
            !modName.startsWith('custom/') &&
            !modName.startsWith('group/')
          ) {
            diagnostics.push({
              file: 'waybar/config.jsonc',
              line: 1,
              severity: 'warning',
              message: `Неизвестный модуль Waybar «${item}» в ${zone}. Проверьте имя или используйте префикс custom/.`,
            });
          }
        }
      }
    }
  } catch (err) {
    diagnostics.push({
      file: 'waybar/config.jsonc',
      line: 1,
      severity: 'error',
      message: `Ошибка JSON в Waybar config: ${err instanceof Error ? err.message : 'некорректный синтаксис'}`,
    });
  }

  const openBraces = (css.match(/\{/g) || []).length;
  const closeBraces = (css.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    diagnostics.push({
      file: 'waybar/style.css',
      line: 1,
      severity: 'error',
      message: 'Несовпадение фигурных скобок { } в файле style.css.',
    });
  }

  return diagnostics;
}
