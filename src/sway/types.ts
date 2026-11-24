export interface WindowColorSet {
  border: string;
  background: string;
  text: string;
  indicator: string;
  childBorder: string;
}

export interface SwayOutputConfig {
  id: string;
  name: string;
  resolution: string;
  refreshRate: string;
  position: string;
  scale: number;
  background: string;
  extraArgs?: string;
}

export interface SwayInputConfig {
  id: string;
  identifier: string;
  xkbLayout: string;
  xkbVariant: string;
  xkbOptions: string;
  tap: 'enabled' | 'disabled';
  naturalScroll: 'enabled' | 'disabled';
  accelSpeed: number;
  extraLines?: string[];
}

export interface SwayKeybinding {
  id: string;
  flags?: string;
  keys: string;
  command: string;
  comment?: string;
}

export interface SwayRule {
  id: string;
  type: 'for_window' | 'assign' | 'no_focus';
  criteria: string;
  action: string;
}

export interface SwayAutostart {
  id: string;
  always: boolean;
  command: string;
}

export interface SwayBarColors {
  background: string;
  statusline: string;
  separator: string;
  focusedWorkspaceBorder: string;
  focusedWorkspaceBg: string;
  focusedWorkspaceText: string;
  inactiveWorkspaceBorder: string;
  inactiveWorkspaceBg: string;
  inactiveWorkspaceText: string;
  urgentWorkspaceBorder: string;
  urgentWorkspaceBg: string;
  urgentWorkspaceText: string;
}

export interface SwayBarConfig {
  enabled: boolean;
  swaybarCommand: 'swaybar' | 'waybar';
  position: 'top' | 'bottom';
  statusCommand: string;
  font: string;
  height: number;
  trayOutput: string;
  colors: SwayBarColors;
}

export interface SwayConfigModel {
  variables: {
    mod: string;
    term: string;
    menu: string;
    left: string;
    down: string;
    up: string;
    right: string;
    custom: Array<{ name: string; value: string }>;
  };
  general: {
    font: string;
    fontSize: number;
    focusFollowsMouse: 'yes' | 'no' | 'always';
    defaultBorder: 'normal' | 'pixel' | 'none';
    borderThickness: number;
    floatingModifier: string;
    titleAlign: 'left' | 'center' | 'right';
  };
  gaps: {
    inner: number;
    outer: number;
    smartGaps: 'on' | 'off' | 'inverse_outer';
    smartBorders: 'on' | 'off' | 'no_gaps';
  };
  colors: {
    focused: WindowColorSet;
    focusedInactive: WindowColorSet;
    unfocused: WindowColorSet;
    urgent: WindowColorSet;
  };
  outputs: SwayOutputConfig[];
  inputs: SwayInputConfig[];
  keybindings: SwayKeybinding[];
  bar: SwayBarConfig;
  rules: SwayRule[];
  autostart: SwayAutostart[];
  extraLines: string[];
}

export interface SwayDiagnostic {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface ColorThemePreset {
  id: string;
  name: string;
  description: string;
  wallpaper: string;
  colors: SwayConfigModel['colors'];
  barColors: SwayBarColors;
}
