export type WaybarModuleName =
  | 'sway/workspaces'
  | 'sway/mode'
  | 'sway/window'
  | 'sway/language'
  | 'clock'
  | 'cpu'
  | 'memory'
  | 'temperature'
  | 'network'
  | 'pulseaudio'
  | 'backlight'
  | 'battery'
  | 'tray'
  | 'custom/power';

export interface WaybarStyleConfig {
  fontFamily: string;
  fontSize: number;
  background: string;
  textColor: string;
  moduleBg: string;
  accentColor: string;
  accentTextColor: string;
  urgentColor: string;
  borderColor: string;
  borderRadius: number;
  barRadius: number;
}

export interface WaybarConfigModel {
  enabled: boolean;
  layer: 'top' | 'bottom';
  position: 'top' | 'bottom';
  height: number;
  spacing: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  modulesLeft: string[];
  modulesCenter: string[];
  modulesRight: string[];
  clockFormat: string;
  disableWorkspaceScroll: boolean;
  cpuFormat: string;
  memoryFormat: string;
  networkFormatWifi: string;
  pulseaudioFormat: string;
  batteryFormat: string;
  style: WaybarStyleConfig;
  rawExtraJson?: Record<string, unknown>;
}

export interface WaybarDiagnostic {
  file: 'waybar/config.jsonc' | 'waybar/style.css';
  line: number;
  severity: 'error' | 'warning';
  message: string;
}
