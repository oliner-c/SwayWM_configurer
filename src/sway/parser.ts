import {
  SwayConfigModel,
  SwayDiagnostic,
  SwayInputConfig,
  SwayOutputConfig,
  WindowColorSet,
} from './types';
import { COLOR_THEME_PRESETS } from './presets';

let uidCounter = 0;
function nextId(prefix: string): string {
  uidCounter += 1;
  return `${prefix}-${uidCounter}`;
}

export function createDefaultModel(): SwayConfigModel {
  const defaultTheme = COLOR_THEME_PRESETS[0];
  return {
    variables: {
      mod: 'Mod4',
      term: 'foot',
      menu: 'wofi --show drun',
      left: 'h',
      down: 'j',
      up: 'k',
      right: 'l',
      custom: [],
    },
    general: {
      font: 'JetBrains Mono',
      fontSize: 10,
      focusFollowsMouse: 'yes',
      focusWrapping: 'yes',
      mouseWarping: 'output',
      defaultBorder: 'pixel',
      defaultFloatingBorder: 'normal',
      borderThickness: 2,
      floatingBorderThickness: 2,
      hideEdgeBorders: 'none',
      floatingModifier: '$mod normal',
      titleAlign: 'center',
      workspaceLayout: 'default',
      workspaceAutoBackAndForth: false,
      popupDuringFullscreen: 'smart',
    },
    gaps: {
      inner: 8,
      outer: 4,
      smartGaps: 'on',
      smartBorders: 'on',
    },
    colors: structuredClone(defaultTheme.colors),
    outputs: [
      {
        id: nextId('out'),
        name: '*',
        resolution: '',
        refreshRate: '',
        position: '',
        scale: 1,
        background: defaultTheme.wallpaper,
      },
      {
        id: nextId('out'),
        name: 'DP-1',
        resolution: '1920x1080',
        refreshRate: '144Hz',
        position: '0,0',
        scale: 1,
        background: '',
      },
    ],
    inputs: [
      {
        id: nextId('in'),
        identifier: 'type:keyboard',
        xkbLayout: 'us,ru',
        xkbVariant: '',
        xkbOptions: 'grp:alt_shift_toggle',
        tap: 'disabled',
        naturalScroll: 'disabled',
        accelSpeed: 0,
        extraLines: [],
      },
      {
        id: nextId('in'),
        identifier: 'type:touchpad',
        xkbLayout: '',
        xkbVariant: '',
        xkbOptions: '',
        tap: 'enabled',
        naturalScroll: 'enabled',
        accelSpeed: 0,
        extraLines: [],
      },
    ],
    keybindings: [],
    bar: {
      enabled: true,
      swaybarCommand: 'waybar',
      position: 'top',
      statusCommand: "while date +'%d.%m.%Y %H:%M'; do sleep 1; done",
      font: 'JetBrains Mono 10',
      height: 28,
      trayOutput: 'primary',
      colors: structuredClone(defaultTheme.barColors),
    },
    rules: [],
    autostart: [],
    extraLines: [],
  };
}

function parseColorTuple(parts: string[], fallback: WindowColorSet): WindowColorSet {
  if (parts.length < 3) return fallback;
  return {
    border: parts[0] || fallback.border,
    background: parts[1] || fallback.background,
    text: parts[2] || fallback.text,
    indicator: parts[3] || fallback.indicator,
    childBorder: parts[4] || parts[0] || fallback.childBorder,
  };
}

export function parseSwayConfig(raw: string): SwayConfigModel {
  const model = createDefaultModel();
  model.outputs = [];
  model.inputs = [];
  model.keybindings = [];
  model.rules = [];
  model.autostart = [];
  model.variables.custom = [];
  model.bar.enabled = false;
  model.bar.swaybarCommand = 'swaybar';

  const lines = raw.split(/\r?\n/);
  const blockStack: Array<{
    type: 'bar' | 'bar_colors' | 'input' | 'mode' | 'other';
    targetId?: string;
  }> = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed === '}') {
      const popped = blockStack.pop();
      if (popped && (popped.type === 'mode' || popped.type === 'other')) {
        model.extraLines.push(rawLine);
      }
      continue;
    }

    const currentBlock = blockStack[blockStack.length - 1];

    if (currentBlock?.type === 'bar_colors') {
      const tokens = trimmed.split(/\s+/);
      const key = tokens[0];
      if (key === 'background' && tokens[1]) model.bar.colors.background = tokens[1];
      else if (key === 'statusline' && tokens[1]) model.bar.colors.statusline = tokens[1];
      else if (key === 'separator' && tokens[1]) model.bar.colors.separator = tokens[1];
      else if (key === 'focused_workspace' && tokens.length >= 4) {
        model.bar.colors.focusedWorkspaceBorder = tokens[1];
        model.bar.colors.focusedWorkspaceBg = tokens[2];
        model.bar.colors.focusedWorkspaceText = tokens[3];
      } else if (key === 'inactive_workspace' && tokens.length >= 4) {
        model.bar.colors.inactiveWorkspaceBorder = tokens[1];
        model.bar.colors.inactiveWorkspaceBg = tokens[2];
        model.bar.colors.inactiveWorkspaceText = tokens[3];
      } else if (key === 'urgent_workspace' && tokens.length >= 4) {
        model.bar.colors.urgentWorkspaceBorder = tokens[1];
        model.bar.colors.urgentWorkspaceBg = tokens[2];
        model.bar.colors.urgentWorkspaceText = tokens[3];
      }
      continue;
    }

    if (currentBlock?.type === 'bar') {
      if (/^colors\s*\{$/.test(trimmed)) {
        blockStack.push({ type: 'bar_colors' });
        continue;
      }
      const match = trimmed.match(/^(\S+)\s+(.+)$/);
      if (match) {
        const [, key, val] = match;
        if (key === 'swaybar_command') {
          model.bar.swaybarCommand = val.trim().includes('waybar') ? 'waybar' : 'swaybar';
        } else if (key === 'position' && (val === 'top' || val === 'bottom')) {
          model.bar.position = val;
        } else if (key === 'status_command') {
          model.bar.statusCommand = val.trim();
        } else if (key === 'font') {
          model.bar.font = val.replace(/^pango:/, '').trim();
        } else if (key === 'height') {
          const num = parseInt(val, 10);
          if (!Number.isNaN(num)) model.bar.height = num;
        } else if (key === 'tray_output') {
          model.bar.trayOutput = val.trim();
        }
      }
      continue;
    }

    if (currentBlock?.type === 'input') {
      const target = model.inputs.find((inp) => inp.id === currentBlock.targetId);
      if (target) {
        const match = trimmed.match(/^(\S+)\s+(.+)$/);
        if (match) {
          const [, key, val] = match;
          const cleanVal = val.trim().replace(/^["']|["']$/g, '');
          if (key === 'xkb_layout') target.xkbLayout = cleanVal;
          else if (key === 'xkb_variant') target.xkbVariant = cleanVal;
          else if (key === 'xkb_options') target.xkbOptions = cleanVal;
          else if (key === 'repeat_delay') {
            const num = parseInt(cleanVal, 10);
            if (!Number.isNaN(num)) target.repeatDelay = num;
          } else if (key === 'repeat_rate') {
            const num = parseInt(cleanVal, 10);
            if (!Number.isNaN(num)) target.repeatRate = num;
          } else if (key === 'xkb_numlock' && (cleanVal === 'enabled' || cleanVal === 'disabled')) {
            target.xkbNumlock = cleanVal;
          } else if (key === 'tap' && (cleanVal === 'enabled' || cleanVal === 'disabled')) {
            target.tap = cleanVal;
          } else if (
            key === 'natural_scroll' &&
            (cleanVal === 'enabled' || cleanVal === 'disabled')
          ) {
            target.naturalScroll = cleanVal;
          } else if (key === 'dwt' && (cleanVal === 'enabled' || cleanVal === 'disabled')) {
            target.dwt = cleanVal;
          } else if (
            key === 'middle_emulation' &&
            (cleanVal === 'enabled' || cleanVal === 'disabled')
          ) {
            target.middleEmulation = cleanVal;
          } else if (key === 'pointer_accel') {
            const num = parseFloat(cleanVal);
            if (!Number.isNaN(num)) target.accelSpeed = num;
          } else if (key === 'accel_profile' && (cleanVal === 'adaptive' || cleanVal === 'flat')) {
            target.accelProfile = cleanVal;
          } else if (
            key === 'scroll_method' &&
            ['two_finger', 'edge', 'on_button_down', 'none'].includes(cleanVal)
          ) {
            target.scrollMethod = cleanVal as SwayInputConfig['scrollMethod'];
          } else if (key === 'scroll_factor') {
            const num = parseFloat(cleanVal);
            if (!Number.isNaN(num)) target.scrollFactor = num;
          } else {
            target.extraLines = [...(target.extraLines ?? []), trimmed];
          }
        } else {
          target.extraLines = [...(target.extraLines ?? []), trimmed];
        }
      }
      continue;
    }

    if (currentBlock) {
      model.extraLines.push(rawLine);
      if (trimmed.endsWith('{')) {
        blockStack.push({ type: 'other' });
      }
      continue;
    }

    if (/^bar\s*\{$/.test(trimmed)) {
      model.bar.enabled = true;
      blockStack.push({ type: 'bar' });
      continue;
    }

    const inputBlockMatch = trimmed.match(/^input\s+("[^"]+"|\S+)\s*\{$/);
    if (inputBlockMatch) {
      const identifier = inputBlockMatch[1].replace(/^"|"$/g, '');
      const inp: SwayInputConfig = {
        id: nextId('in'),
        identifier,
        xkbLayout: '',
        xkbVariant: '',
        xkbOptions: '',
        tap: 'disabled',
        naturalScroll: 'disabled',
        accelSpeed: 0,
        extraLines: [],
      };
      model.inputs.push(inp);
      blockStack.push({ type: 'input', targetId: inp.id });
      continue;
    }

    if (trimmed.endsWith('{')) {
      model.extraLines.push(rawLine);
      blockStack.push({ type: trimmed.startsWith('mode') ? 'mode' : 'other' });
      continue;
    }

    const setMatch = trimmed.match(/^set\s+(\$\S+)\s+(.+)$/);
    if (setMatch) {
      const [, name, val] = setMatch;
      const cleanVal = val.trim();
      if (name === '$mod') model.variables.mod = cleanVal;
      else if (name === '$term') model.variables.term = cleanVal;
      else if (name === '$menu') model.variables.menu = cleanVal;
      else if (name === '$left') model.variables.left = cleanVal;
      else if (name === '$down') model.variables.down = cleanVal;
      else if (name === '$up') model.variables.up = cleanVal;
      else if (name === '$right') model.variables.right = cleanVal;
      else model.variables.custom.push({ name, value: cleanVal });
      continue;
    }

    const fontMatch = trimmed.match(/^font\s+(?:pango:)?(.+?)\s+(\d+(?:\.\d+)?)$/);
    if (fontMatch) {
      model.general.font = fontMatch[1].trim();
      model.general.fontSize = parseFloat(fontMatch[2]);
      continue;
    }

    const borderMatch = trimmed.match(/^default_border\s+(normal|pixel|none)(?:\s+(\d+))?$/);
    if (borderMatch) {
      model.general.defaultBorder = borderMatch[1] as 'normal' | 'pixel' | 'none';
      if (borderMatch[2]) model.general.borderThickness = parseInt(borderMatch[2], 10);
      continue;
    }

    const floatBorderMatch = trimmed.match(
      /^default_floating_border\s+(normal|pixel|none)(?:\s+(\d+))?$/
    );
    if (floatBorderMatch) {
      model.general.defaultFloatingBorder = floatBorderMatch[1] as 'normal' | 'pixel' | 'none';
      if (floatBorderMatch[2]) {
        model.general.floatingBorderThickness = parseInt(floatBorderMatch[2], 10);
      }
      continue;
    }

    const hideEdgeMatch = trimmed.match(
      /^hide_edge_borders\s+(none|vertical|horizontal|both|smart|smart_no_gaps)$/
    );
    if (hideEdgeMatch) {
      model.general.hideEdgeBorders = hideEdgeMatch[1] as SwayConfigModel['general']['hideEdgeBorders'];
      continue;
    }

    const titleAlignMatch = trimmed.match(/^title_align\s+(left|center|right)$/);
    if (titleAlignMatch) {
      model.general.titleAlign = titleAlignMatch[1] as 'left' | 'center' | 'right';
      continue;
    }

    const focusMouseMatch = trimmed.match(/^focus_follows_mouse\s+(yes|no|always)$/);
    if (focusMouseMatch) {
      model.general.focusFollowsMouse = focusMouseMatch[1] as 'yes' | 'no' | 'always';
      continue;
    }

    const focusWrapMatch = trimmed.match(/^focus_wrapping\s+(yes|no|force|workspace)$/);
    if (focusWrapMatch) {
      model.general.focusWrapping = focusWrapMatch[1] as SwayConfigModel['general']['focusWrapping'];
      continue;
    }

    const mouseWarpMatch = trimmed.match(/^mouse_warping\s+(output|container|none)$/);
    if (mouseWarpMatch) {
      model.general.mouseWarping = mouseWarpMatch[1] as SwayConfigModel['general']['mouseWarping'];
      continue;
    }

    const wsLayoutMatch = trimmed.match(/^workspace_layout\s+(default|stacking|tabbed)$/);
    if (wsLayoutMatch) {
      model.general.workspaceLayout = wsLayoutMatch[1] as SwayConfigModel['general']['workspaceLayout'];
      continue;
    }

    const wsBackMatch = trimmed.match(/^workspace_auto_back_and_forth\s+(yes|no)$/);
    if (wsBackMatch) {
      model.general.workspaceAutoBackAndForth = wsBackMatch[1] === 'yes';
      continue;
    }

    const popupFsMatch = trimmed.match(
      /^popup_during_fullscreen\s+(smart|ignore|leave_fullscreen)$/
    );
    if (popupFsMatch) {
      model.general.popupDuringFullscreen =
        popupFsMatch[1] as SwayConfigModel['general']['popupDuringFullscreen'];
      continue;
    }

    const floatModMatch = trimmed.match(/^floating_modifier\s+(.+)$/);
    if (floatModMatch) {
      model.general.floatingModifier = floatModMatch[1].trim();
      continue;
    }

    const gapsMatch = trimmed.match(/^gaps\s+(inner|outer)\s+(\d+)$/);
    if (gapsMatch) {
      const val = parseInt(gapsMatch[2], 10);
      if (gapsMatch[1] === 'inner') model.gaps.inner = val;
      else model.gaps.outer = val;
      continue;
    }

    const smartGapsMatch = trimmed.match(/^smart_gaps\s+(on|off|inverse_outer)$/);
    if (smartGapsMatch) {
      model.gaps.smartGaps = smartGapsMatch[1] as 'on' | 'off' | 'inverse_outer';
      continue;
    }

    const smartBordersMatch = trimmed.match(/^smart_borders\s+(on|off|no_gaps)$/);
    if (smartBordersMatch) {
      model.gaps.smartBorders = smartBordersMatch[1] as 'on' | 'off' | 'no_gaps';
      continue;
    }

    const clientColorMatch = trimmed.match(
      /^client\.(focused|focused_inactive|unfocused|urgent)\s+(.+)$/
    );
    if (clientColorMatch) {
      const state = clientColorMatch[1];
      const parts = clientColorMatch[2].trim().split(/\s+/);
      if (state === 'focused') model.colors.focused = parseColorTuple(parts, model.colors.focused);
      else if (state === 'focused_inactive')
        model.colors.focusedInactive = parseColorTuple(parts, model.colors.focusedInactive);
      else if (state === 'unfocused')
        model.colors.unfocused = parseColorTuple(parts, model.colors.unfocused);
      else if (state === 'urgent') model.colors.urgent = parseColorTuple(parts, model.colors.urgent);
      continue;
    }

    const outputMatch = trimmed.match(/^output\s+("[^"]+"|\S+)\s+(.+)$/);
    if (outputMatch) {
      const name = outputMatch[1].replace(/^"|"$/g, '');
      let rest = outputMatch[2];
      const out: SwayOutputConfig = {
        id: nextId('out'),
        name,
        resolution: '',
        refreshRate: '',
        position: '',
        scale: 1,
        background: '',
        extraArgs: '',
      };
      const bgMatch = rest.match(
        /\bbg\s+(#[0-9a-fA-F]+|"[^"]+"|\S+)(?:\s+(stretch|fill|fit|center|tile|solid_color))?/
      );
      if (bgMatch) {
        out.background = bgMatch[1].replace(/^"|"$/g, '');
        if (bgMatch[2]) {
          out.backgroundMode = bgMatch[2] as SwayOutputConfig['backgroundMode'];
        }
        rest = rest.replace(bgMatch[0], '');
      }
      const resMatch = rest.match(/\b(?:resolution|mode)\s+(\d+x\d+)(?:@([\d.]+Hz))?/);
      if (resMatch) {
        out.resolution = resMatch[1];
        out.refreshRate = resMatch[2] || '';
        rest = rest.replace(resMatch[0], '');
      }
      const posMatch = rest.match(/\b(?:position|pos)\s+(-?\d+[,\s]-?\d+)/);
      if (posMatch) {
        out.position = posMatch[1].replace(/\s+/, ',');
        rest = rest.replace(posMatch[0], '');
      }
      const scaleMatch = rest.match(/\bscale\s+([\d.]+)/);
      if (scaleMatch) {
        out.scale = parseFloat(scaleMatch[1]);
        rest = rest.replace(scaleMatch[0], '');
      }
      const transformMatch = rest.match(
        /\btransform\s+(normal|90|180|270|flipped-90|flipped-180|flipped-270|flipped)/
      );
      if (transformMatch) {
        out.transform = transformMatch[1] as SwayOutputConfig['transform'];
        rest = rest.replace(transformMatch[0], '');
      }
      const adaptMatch = rest.match(/\badaptive_sync\s+(on|off)/);
      if (adaptMatch) {
        out.adaptiveSync = adaptMatch[1] as 'on' | 'off';
        rest = rest.replace(adaptMatch[0], '');
      }
      const leftover = rest.trim();
      if (leftover) out.extraArgs = leftover;
      model.outputs.push(out);
      continue;
    }

    const bindsymMatch = trimmed.match(/^bindsym((?:\s+--\S+)*)\s+(\S+)\s+(.+)$/);
    if (bindsymMatch) {
      model.keybindings.push({
        id: nextId('bind'),
        flags: bindsymMatch[1].trim() || undefined,
        keys: bindsymMatch[2],
        command: bindsymMatch[3].trim(),
      });
      continue;
    }

    const ruleMatch = trimmed.match(/^(for_window|assign|no_focus)\s+(\[[^\]]+\])\s*(.*)$/);
    if (ruleMatch) {
      model.rules.push({
        id: nextId('rule'),
        type: ruleMatch[1] as 'for_window' | 'assign' | 'no_focus',
        criteria: ruleMatch[2],
        action: ruleMatch[3].trim(),
      });
      continue;
    }

    const execMatch = trimmed.match(/^(exec_always|exec)\s+(.+)$/);
    if (execMatch) {
      model.autostart.push({
        id: nextId('exec'),
        always: execMatch[1] === 'exec_always',
        command: execMatch[2].trim(),
      });
      continue;
    }

    model.extraLines.push(rawLine);
  }

  return model;
}

export function serializeSwayConfig(model: SwayConfigModel): string {
  const lines: string[] = [];
  lines.push('# SwayWM Configuration');
  lines.push('');

  lines.push('### Переменные');
  lines.push(`set $mod ${model.variables.mod}`);
  lines.push(`set $left ${model.variables.left}`);
  lines.push(`set $down ${model.variables.down}`);
  lines.push(`set $up ${model.variables.up}`);
  lines.push(`set $right ${model.variables.right}`);
  lines.push(`set $term ${model.variables.term}`);
  lines.push(`set $menu ${model.variables.menu}`);
  for (const cv of model.variables.custom) {
    if (cv.name && cv.value) {
      lines.push(`set ${cv.name.startsWith('$') ? cv.name : `$${cv.name}`} ${cv.value}`);
    }
  }
  lines.push('');

  lines.push('### Шрифт и поведение окон');
  lines.push(`font pango:${model.general.font} ${model.general.fontSize}`);
  if (model.general.defaultBorder === 'none') {
    lines.push('default_border none');
  } else {
    lines.push(`default_border ${model.general.defaultBorder} ${model.general.borderThickness}`);
  }
  if (
    model.general.defaultFloatingBorder &&
    model.general.defaultFloatingBorder !== 'normal'
  ) {
    if (model.general.defaultFloatingBorder === 'none') {
      lines.push('default_floating_border none');
    } else {
      lines.push(
        `default_floating_border ${model.general.defaultFloatingBorder} ${model.general.floatingBorderThickness ?? 2}`
      );
    }
  } else if (
    model.general.floatingBorderThickness !== undefined &&
    model.general.floatingBorderThickness !== 2
  ) {
    lines.push(`default_floating_border normal ${model.general.floatingBorderThickness}`);
  }
  if (model.general.hideEdgeBorders && model.general.hideEdgeBorders !== 'none') {
    lines.push(`hide_edge_borders ${model.general.hideEdgeBorders}`);
  }
  lines.push(`title_align ${model.general.titleAlign}`);
  lines.push(`focus_follows_mouse ${model.general.focusFollowsMouse}`);
  if (model.general.focusWrapping && model.general.focusWrapping !== 'yes') {
    lines.push(`focus_wrapping ${model.general.focusWrapping}`);
  }
  if (model.general.mouseWarping && model.general.mouseWarping !== 'output') {
    lines.push(`mouse_warping ${model.general.mouseWarping}`);
  }
  if (model.general.workspaceLayout && model.general.workspaceLayout !== 'default') {
    lines.push(`workspace_layout ${model.general.workspaceLayout}`);
  }
  if (model.general.workspaceAutoBackAndForth) {
    lines.push('workspace_auto_back_and_forth yes');
  }
  if (model.general.popupDuringFullscreen && model.general.popupDuringFullscreen !== 'smart') {
    lines.push(`popup_during_fullscreen ${model.general.popupDuringFullscreen}`);
  }
  if (model.general.floatingModifier) {
    lines.push(`floating_modifier ${model.general.floatingModifier}`);
  }
  lines.push('');

  lines.push('### Отступы');
  lines.push(`gaps inner ${model.gaps.inner}`);
  lines.push(`gaps outer ${model.gaps.outer}`);
  lines.push(`smart_gaps ${model.gaps.smartGaps}`);
  lines.push(`smart_borders ${model.gaps.smartBorders}`);
  lines.push('');

  lines.push('### Цвета окон');
  const fmtCol = (c: WindowColorSet) =>
    `${c.border} ${c.background} ${c.text} ${c.indicator} ${c.childBorder}`;
  lines.push(`client.focused          ${fmtCol(model.colors.focused)}`);
  lines.push(`client.focused_inactive ${fmtCol(model.colors.focusedInactive)}`);
  lines.push(`client.unfocused        ${fmtCol(model.colors.unfocused)}`);
  lines.push(`client.urgent           ${fmtCol(model.colors.urgent)}`);
  lines.push('');

  if (model.outputs.length > 0) {
    lines.push('### Мониторы');
    for (const out of model.outputs) {
      const parts: string[] = [`output ${out.name}`];
      if (out.background) {
        const isHex = /^#[0-9a-fA-F]{3,8}$/.test(out.background);
        const mode = out.backgroundMode || (isHex ? 'solid_color' : 'fill');
        parts.push(`bg ${out.background} ${mode}`);
      }
      if (out.resolution) {
        parts.push(`resolution ${out.resolution}${out.refreshRate ? `@${out.refreshRate}` : ''}`);
      }
      if (out.position) {
        parts.push(`position ${out.position}`);
      }
      if (out.scale && out.scale !== 1) {
        parts.push(`scale ${out.scale}`);
      } else if (out.resolution) {
        parts.push('scale 1');
      }
      if (out.transform && out.transform !== 'normal') {
        parts.push(`transform ${out.transform}`);
      }
      if (out.adaptiveSync) {
        parts.push(`adaptive_sync ${out.adaptiveSync}`);
      }
      if (out.extraArgs) {
        parts.push(out.extraArgs);
      }
      lines.push(parts.join(' '));
    }
    lines.push('');
  }

  if (model.inputs.length > 0) {
    lines.push('### Устройства ввода');
    for (const inp of model.inputs) {
      lines.push(`input ${inp.identifier} {`);
      if (inp.xkbLayout) lines.push(`    xkb_layout ${inp.xkbLayout}`);
      if (inp.xkbVariant) lines.push(`    xkb_variant ${inp.xkbVariant}`);
      if (inp.xkbOptions) lines.push(`    xkb_options ${inp.xkbOptions}`);
      if (inp.repeatDelay) lines.push(`    repeat_delay ${inp.repeatDelay}`);
      if (inp.repeatRate) lines.push(`    repeat_rate ${inp.repeatRate}`);
      if (inp.xkbNumlock) lines.push(`    xkb_numlock ${inp.xkbNumlock}`);
      if (inp.identifier.includes('touchpad') || inp.tap === 'enabled') {
        lines.push(`    tap ${inp.tap}`);
      }
      if (inp.identifier.includes('touchpad') || inp.naturalScroll === 'enabled') {
        lines.push(`    natural_scroll ${inp.naturalScroll}`);
      }
      if (inp.dwt) lines.push(`    dwt ${inp.dwt}`);
      if (inp.middleEmulation) lines.push(`    middle_emulation ${inp.middleEmulation}`);
      if (inp.accelSpeed !== 0) {
        lines.push(`    pointer_accel ${inp.accelSpeed}`);
      }
      if (inp.accelProfile) lines.push(`    accel_profile ${inp.accelProfile}`);
      if (inp.scrollMethod) lines.push(`    scroll_method ${inp.scrollMethod}`);
      if (inp.scrollFactor && inp.scrollFactor !== 1) {
        lines.push(`    scroll_factor ${inp.scrollFactor}`);
      }
      for (const extra of inp.extraLines ?? []) {
        lines.push(`    ${extra}`);
      }
      lines.push('}');
      lines.push('');
    }
  }

  if (model.keybindings.length > 0) {
    lines.push('### Горячие клавиши');
    for (const kb of model.keybindings) {
      if (kb.keys && kb.command) {
        const prefix = kb.flags ? `bindsym ${kb.flags}` : 'bindsym';
        lines.push(`${prefix} ${kb.keys} ${kb.command}`);
      }
    }
    lines.push('');
  }

  if (model.rules.length > 0 || model.autostart.length > 0) {
    lines.push('### Правила окон и автозапуск');
    for (const rule of model.rules) {
      lines.push(`${rule.type} ${rule.criteria}${rule.action ? ` ${rule.action}` : ''}`);
    }
    for (const auto of model.autostart) {
      lines.push(`${auto.always ? 'exec_always' : 'exec'} ${auto.command}`);
    }
    lines.push('');
  }

  if (model.bar.enabled) {
    lines.push('### Панель состояния (Waybar / Swaybar)');
    lines.push('bar {');
    if (model.bar.swaybarCommand === 'waybar') {
      lines.push('    swaybar_command waybar');
    } else {
      lines.push(`    position ${model.bar.position}`);
      if (model.bar.statusCommand) {
        lines.push(`    status_command ${model.bar.statusCommand}`);
      }
      if (model.bar.font) {
        lines.push(`    font pango:${model.bar.font}`);
      }
      if (model.bar.height) {
        lines.push(`    height ${model.bar.height}`);
      }
      if (model.bar.trayOutput) {
        lines.push(`    tray_output ${model.bar.trayOutput}`);
      }
      lines.push('    colors {');
      lines.push(`        background ${model.bar.colors.background}`);
      lines.push(`        statusline ${model.bar.colors.statusline}`);
      lines.push(`        separator ${model.bar.colors.separator}`);
      lines.push(
        `        focused_workspace  ${model.bar.colors.focusedWorkspaceBorder} ${model.bar.colors.focusedWorkspaceBg} ${model.bar.colors.focusedWorkspaceText}`
      );
      lines.push(
        `        inactive_workspace ${model.bar.colors.inactiveWorkspaceBorder} ${model.bar.colors.inactiveWorkspaceBg} ${model.bar.colors.inactiveWorkspaceText}`
      );
      lines.push(
        `        urgent_workspace   ${model.bar.colors.urgentWorkspaceBorder} ${model.bar.colors.urgentWorkspaceBg} ${model.bar.colors.urgentWorkspaceText}`
      );
      lines.push('    }');
    }
    lines.push('}');
    lines.push('');
  }

  if (model.extraLines.length > 0) {
    lines.push('### Пользовательские директивы');
    for (const extra of model.extraLines) {
      lines.push(extra);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// Authoritative directive registries per `man 5 sway`, `man 5 sway-bar`, and `man 5 sway-input`
const KNOWN_TOP_DIRECTIVES = new Set([
  'set',
  'font',
  'default_border',
  'default_floating_border',
  'hide_edge_borders',
  'title_align',
  'focus_follows_mouse',
  'focus_on_window_activation',
  'focus_wrapping',
  'floating_modifier',
  'floating_minimum_size',
  'floating_maximum_size',
  'force_display_urgency_hint',
  'gaps',
  'smart_gaps',
  'smart_borders',
  'client.focused',
  'client.focused_inactive',
  'client.unfocused',
  'client.urgent',
  'client.placeholder',
  'client.background',
  'output',
  'input',
  'seat',
  'bindsym',
  'bindcode',
  'bindswitch',
  'bindgesture',
  'unbindsym',
  'unbindcode',
  'bar',
  'mode',
  'for_window',
  'assign',
  'no_focus',
  'exec',
  'exec_always',
  'include',
  'workspace',
  'workspace_layout',
  'workspace_auto_back_and_forth',
  'xwayland',
  'tiling_drag',
  'tiling_drag_threshold',
  'titlebar_border_thickness',
  'titlebar_padding',
  'mouse_warping',
  'popup_during_fullscreen',
  'show_marks',
  'swaybg_command',
  'swaynag_command',
  'primary_selection',
]);

const KNOWN_BAR_DIRECTIVES = new Set([
  'swaybar_command',
  'position',
  'status_command',
  'status_edge_padding',
  'status_padding',
  'font',
  'height',
  'tray_output',
  'tray_padding',
  'tray_bindcode',
  'tray_bindsym',
  'workspace_buttons',
  'workspace_min_width',
  'strip_workspace_numbers',
  'strip_workspace_name',
  'binding_mode_indicator',
  'wrap_scroll',
  'separator_symbol',
  'gaps',
  'hidden_state',
  'mode',
  'modifier',
  'id',
  'output',
  'icon_theme',
  'pango_markup',
  'colors',
]);

const KNOWN_BAR_COLOR_DIRECTIVES = new Set([
  'background',
  'statusline',
  'separator',
  'focused_background',
  'focused_statusline',
  'focused_separator',
  'focused_workspace',
  'active_workspace',
  'inactive_workspace',
  'urgent_workspace',
  'binding_mode',
]);

const KNOWN_INPUT_DIRECTIVES = new Set([
  'accel_profile',
  'calibration_matrix',
  'click_method',
  'drag',
  'drag_lock',
  'dwt',
  'dwtp',
  'events',
  'left_handed',
  'map_from_region',
  'map_to_output',
  'map_to_region',
  'middle_emulation',
  'natural_scroll',
  'pointer_accel',
  'repeat_delay',
  'repeat_rate',
  'rotation_angle',
  'scroll_button',
  'scroll_button_lock',
  'scroll_factor',
  'scroll_method',
  'tap',
  'tap_button_map',
  'xkb_capslock',
  'xkb_file',
  'xkb_layout',
  'xkb_model',
  'xkb_numlock',
  'xkb_options',
  'xkb_rules',
  'xkb_switch_layout',
  'xkb_variant',
]);

export function validateSwayConfig(raw: string): SwayDiagnostic[] {
  const diagnostics: SwayDiagnostic[] = [];
  const lines = raw.split(/\r?\n/);
  const blockStack: Array<{
    type: 'bar' | 'bar_colors' | 'input' | 'mode' | 'other';
    line: number;
  }> = [];
  const seenKeybindings = new Map<string, number>();
  const definedVars = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const trimmed = lines[i].trim();

    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed === '}') {
      if (blockStack.length === 0) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: 'Лишняя закрывающая фигурная скобка «}» без открывающего блока.',
        });
      } else {
        blockStack.pop();
      }
      continue;
    }

    const activeBlock = blockStack[blockStack.length - 1];
    const tokens = trimmed.split(/\s+/);
    const firstToken = tokens[0];

    // Check block openers
    if (trimmed.endsWith('{')) {
      if (firstToken === 'bar') {
        blockStack.push({ type: 'bar', line: lineNum });
      } else if (firstToken === 'colors' && activeBlock?.type === 'bar') {
        blockStack.push({ type: 'bar_colors', line: lineNum });
      } else if (firstToken === 'input') {
        blockStack.push({ type: 'input', line: lineNum });
      } else if (firstToken === 'mode') {
        blockStack.push({ type: 'mode', line: lineNum });
      } else {
        blockStack.push({ type: 'other', line: lineNum });
      }
      continue;
    }

    // Validate inside specific Sway blocks
    if (activeBlock?.type === 'bar') {
      if (!KNOWN_BAR_DIRECTIVES.has(firstToken)) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `Неизвестная директива внутри блока bar: «${firstToken}».`,
        });
      } else if (firstToken === 'position' && tokens[1] && !['top', 'bottom'].includes(tokens[1])) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `Недопустимое значение position «${tokens[1]}» в bar (ожидается top или bottom).`,
        });
      }
    } else if (activeBlock?.type === 'bar_colors') {
      if (!KNOWN_BAR_COLOR_DIRECTIVES.has(firstToken)) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `Неизвестная директива в bar.colors: «${firstToken}».`,
        });
      }
    } else if (activeBlock?.type === 'input') {
      if (!KNOWN_INPUT_DIRECTIVES.has(firstToken)) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `Неизвестная директива в блоке input: «${firstToken}».`,
        });
      }
    }

    // Top-level & mode-level validations
    if (firstToken === 'set') {
      const m = trimmed.match(/^set\s+(\$\S+)\s+(.+)$/);
      if (!m) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: 'Синтаксис директивы set: set $имя значение',
        });
      } else {
        definedVars.add(m[1]);
      }
    }

    if (firstToken === 'bindsym' && (!activeBlock || activeBlock.type === 'mode')) {
      const m = trimmed.match(/^bindsym((?:\s+--\S+)*)\s+(\S+)\s+(.+)$/);
      if (!m) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: 'Неполная директива bindsym: укажите комбинацию клавиш и команду.',
        });
      } else if (!activeBlock) {
        const keySig = `${m[1].trim()} ${m[2]}`.trim();
        if (seenKeybindings.has(keySig)) {
          diagnostics.push({
            line: lineNum,
            column: 1,
            severity: 'warning',
            message: `Дублирующаяся комбинация клавиш «${keySig}» (ранее объявлена на строке ${seenKeybindings.get(keySig)}).`,
          });
        } else {
          seenKeybindings.set(keySig, lineNum);
        }
      }
    }

    if (!activeBlock) {
      if (firstToken === 'focus_follows_mouse' && tokens[1] && !['yes', 'no', 'always'].includes(tokens[1])) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `focus_follows_mouse принимает yes, no или always (получено «${tokens[1]}»).`,
        });
      }
      if (firstToken === 'title_align' && tokens[1] && !['left', 'center', 'right'].includes(tokens[1])) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `title_align принимает left, center или right (получено «${tokens[1]}»).`,
        });
      }
      if (firstToken === 'smart_gaps' && tokens[1] && !['on', 'off', 'inverse_outer'].includes(tokens[1])) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `smart_gaps принимает on, off или inverse_outer (получено «${tokens[1]}»).`,
        });
      }
      if (firstToken === 'smart_borders' && tokens[1] && !['on', 'off', 'no_gaps'].includes(tokens[1])) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `smart_borders принимает on, off или no_gaps (получено «${tokens[1]}»).`,
        });
      }
      if (
        firstToken === 'default_border' &&
        tokens[1] &&
        !['normal', 'pixel', 'none', 'csd'].includes(tokens[1])
      ) {
        diagnostics.push({
          line: lineNum,
          column: 1,
          severity: 'error',
          message: `default_border принимает normal, pixel, none или csd (получено «${tokens[1]}»).`,
        });
      }
    }

    const hexTokens = trimmed.match(/#[0-9a-zA-Z]+/g);
    if (hexTokens) {
      for (const hex of hexTokens) {
        if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
          diagnostics.push({
            line: lineNum,
            column: trimmed.indexOf(hex) + 1,
            severity: 'warning',
            message: `Некорректный HEX-цвет «${hex}». Sway ожидает формат #RRGGBB или #RRGGBBAA.`,
          });
        }
      }
    }

    if (firstToken !== 'set') {
      const varRefs = trimmed.match(/\$[a-zA-Z_][a-zA-Z0-9_]*/g);
      if (varRefs) {
        for (const v of varRefs) {
          if (!definedVars.has(v) && !trimmed.includes('$(') && !trimmed.includes('exec')) {
            diagnostics.push({
              line: lineNum,
              column: trimmed.indexOf(v) + 1,
              severity: 'warning',
              message: `Переменная «${v}» используется до объявления через set ${v}.`,
            });
          }
        }
      }
    }

    if (!activeBlock && !KNOWN_TOP_DIRECTIVES.has(firstToken)) {
      diagnostics.push({
        line: lineNum,
        column: 1,
        severity: 'error',
        message: `Неизвестная директива SwayWM: «${firstToken}».`,
      });
    }
  }

  for (const unclosed of blockStack) {
    diagnostics.push({
      line: unclosed.line,
      column: 1,
      severity: 'error',
      message: `Незакрытый блок «{», открытый на строке ${unclosed.line}.`,
    });
  }

  return diagnostics;
}
