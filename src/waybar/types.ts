export type WaybarModuleName =
  | 'custom/launcher'
  | 'sway/workspaces'
  | 'sway/mode'
  | 'sway/window'
  | 'sway/language'
  | 'clock'
  | 'cpu'
  | 'memory'
  | 'temperature'
  | 'network'
  | 'bluetooth'
  | 'pulseaudio'
  | 'backlight'
  | 'battery'
  | 'tray'
  | 'custom/power';

export interface WaybarStyleConfig {
  barMode?: 'bar' | 'islands';
  fontFamily: string;
  fontSize: number;
  background: string;
  islandBg?: string;
  mutedPillBg?: string;
  textColor: string;
  windowTextColor?: string;
  moduleBg: string;
  accentColor: string;
  accentTextColor: string;
  urgentColor: string;
  borderColor: string;
  borderWidth?: number;
  borderRadius: number;
  barRadius: number;
  modulePaddingX?: number;
  modulePaddingY?: number;
}

export interface WaybarConfigModel {
  enabled: boolean;
  layer: 'top' | 'bottom' | 'overlay';
  position: 'top' | 'bottom';
  height: number;
  spacing: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  reloadStyleOnChange?: boolean;
  modulesLeft: string[];
  modulesCenter: string[];
  modulesRight: string[];
  clockFormat: string;
  workspaceFormat?: string;
  disableWorkspaceScroll: boolean;
  windowMaxLength?: number;
  cpuFormat: string;
  cpuInterval?: number;
  memoryFormat: string;
  memoryInterval?: number;
  temperatureFormat?: string;
  temperatureCriticalThreshold?: number;
  networkFormatWifi: string;
  networkFormatEthernet?: string;
  networkFormatDisconnected?: string;
  pulseaudioFormat: string;
  pulseaudioFormatMuted?: string;
  pulseaudioScrollStep?: number;
  batteryFormat: string;
  batteryWarning?: number;
  batteryCritical?: number;
  trayIconSize?: number;
  traySpacing?: number;
  launcherFormat?: string;
  launcherCommand?: string;
  powerFormat?: string;
  powerCommand?: string;
  style: WaybarStyleConfig;
  rawExtraJson?: Record<string, unknown>;
}

export interface WaybarDiagnostic {
  file: 'waybar/config.jsonc' | 'waybar/style.css';
  line: number;
  severity: 'error' | 'warning';
  message: string;
}
