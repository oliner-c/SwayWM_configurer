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
  'modules-left',
  'modules-center',
  'modules-right',
  'sway/workspaces',
  'sway/mode',
  'sway/window',
  'sway/language',
  'clock',
  'cpu',
  'memory',
  'network',
  'pulseaudio',
  'battery',
  'tray',
  'custom/power',
]);

export function serializeWaybarJson(model: WaybarConfigModel): string {
  const extra = model.rawExtraJson ?? {};
  const obj: Record<string, unknown> = {
    layer: model.layer,
    position: model.position,
    height: model.height,
    spacing: model.spacing,
    'margin-top': model.marginTop,
    'margin-bottom': model.marginBottom,
    'margin-left': model.marginLeft,
    'margin-right': model.marginRight,
    'modules-left': model.modulesLeft,
    'modules-center': model.modulesCenter,
    'modules-right': model.modulesRight,
    'sway/workspaces': {
      'disable-scroll': model.disableWorkspaceScroll,
      'all-outputs': true,
      format: '{name}',
    },
    'sway/mode': {
      format: '<span style="italic">{}</span>',
    },
    'sway/window': {
      'max-length': 42,
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
      interval: 2,
    },
    memory: {
      format: model.memoryFormat,
      interval: 5,
    },
    network: {
      'format-wifi': model.networkFormatWifi,
      'format-ethernet': '{ifname}: {ipaddr}',
      'format-disconnected': 'Нет сети',
    },
    pulseaudio: {
      format: model.pulseaudioFormat,
      'format-muted': 'MUTE',
    },
    battery: {
      states: {
        warning: 30,
        critical: 15,
      },
      format: model.batteryFormat,
    },
    tray: {
      spacing: 8,
    },
    'custom/power': {
      format: '⏻',
      tooltip: false,
      'on-click': 'swaynag -t warning -m "Выйти из Sway?" -B "Да" "swaymsg exit"',
    },
    ...extra,
  };

  return `// Waybar Configuration — синхронизировано с SwayWM\n${JSON.stringify(obj, null, 2)}\n`;
}

export function serializeWaybarCss(model: WaybarConfigModel): string {
  const s = model.style;
  return `/* Waybar Stylesheet — синхронизировано с SwayWM */
* {
  font-family: ${s.fontFamily};
  font-size: ${s.fontSize}px;
  min-height: 0;
}

window#waybar {
  background-color: ${s.background};
  color: ${s.textColor};
  border: 1px solid ${s.borderColor};
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
#pulseaudio,
#backlight,
#battery,
#language,
#tray,
#custom-power {
  background-color: ${s.moduleBg};
  color: ${s.textColor};
  padding: 2px 10px;
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
      if (parsed.layer === 'top' || parsed.layer === 'bottom') model.layer = parsed.layer;
      if (parsed.position === 'top' || parsed.position === 'bottom') model.position = parsed.position;
      if (typeof parsed.height === 'number') model.height = parsed.height;
      if (typeof parsed.spacing === 'number') model.spacing = parsed.spacing;
      if (typeof parsed['margin-top'] === 'number') model.marginTop = parsed['margin-top'];
      if (typeof parsed['margin-bottom'] === 'number') model.marginBottom = parsed['margin-bottom'];
      if (typeof parsed['margin-left'] === 'number') model.marginLeft = parsed['margin-left'];
      if (typeof parsed['margin-right'] === 'number') model.marginRight = parsed['margin-right'];
      if (Array.isArray(parsed['modules-left'])) model.modulesLeft = parsed['modules-left'].map(String);
      if (Array.isArray(parsed['modules-center'])) model.modulesCenter = parsed['modules-center'].map(String);
      if (Array.isArray(parsed['modules-right'])) model.modulesRight = parsed['modules-right'].map(String);

      const clockCfg = parsed.clock as Record<string, unknown> | undefined;
      if (clockCfg?.format) model.clockFormat = String(clockCfg.format);

      const wsCfg = parsed['sway/workspaces'] as Record<string, unknown> | undefined;
      if (typeof wsCfg?.['disable-scroll'] === 'boolean') {
        model.disableWorkspaceScroll = wsCfg['disable-scroll'];
      }

      const cpuCfg = parsed.cpu as Record<string, unknown> | undefined;
      if (cpuCfg?.format) model.cpuFormat = String(cpuCfg.format);

      const memCfg = parsed.memory as Record<string, unknown> | undefined;
      if (memCfg?.format) model.memoryFormat = String(memCfg.format);

      const netCfg = parsed.network as Record<string, unknown> | undefined;
      if (netCfg?.['format-wifi']) model.networkFormatWifi = String(netCfg['format-wifi']);

      const paCfg = parsed.pulseaudio as Record<string, unknown> | undefined;
      if (paCfg?.format) model.pulseaudioFormat = String(paCfg.format);

      const batCfg = parsed.battery as Record<string, unknown> | undefined;
      if (batCfg?.format) model.batteryFormat = String(batCfg.format);

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
    const hex = barBorder.match(/#[0-9a-fA-F]{3,8}/);
    if (hex) model.style.borderColor = hex[0];
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
