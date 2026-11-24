import { WaybarConfigModel } from './types';

export const AVAILABLE_WAYBAR_MODULES: Array<{
  id: string;
  label: string;
  description: string;
}> = [
  { id: 'sway/workspaces', label: 'sway/workspaces', description: 'Кнопки рабочих столов Sway' },
  { id: 'sway/mode', label: 'sway/mode', description: 'Индикатор активного режима (resize и т.д.)' },
  { id: 'sway/window', label: 'sway/window', description: 'Заголовок активного окна' },
  { id: 'sway/language', label: 'sway/language', description: 'Текущая раскладка клавиатуры' },
  { id: 'clock', label: 'clock', description: 'Часы и дата' },
  { id: 'cpu', label: 'cpu', description: 'Загрузка процессора' },
  { id: 'memory', label: 'memory', description: 'Использование ОЗУ' },
  { id: 'temperature', label: 'temperature', description: 'Температура CPU' },
  { id: 'network', label: 'network', description: 'Wi-Fi / Ethernet статус' },
  { id: 'pulseaudio', label: 'pulseaudio', description: 'Громкость звука (PipeWire / Pulse)' },
  { id: 'backlight', label: 'backlight', description: 'Яркость экрана' },
  { id: 'battery', label: 'battery', description: 'Заряд батареи' },
  { id: 'tray', label: 'tray', description: 'Системный трей' },
  { id: 'custom/power', label: 'custom/power', description: 'Кнопка меню питания' },
];

export const WAYBAR_THEME_PRESETS: Record<
  string,
  {
    style: WaybarConfigModel['style'];
    height: number;
    marginTop: number;
    marginLeft: number;
    marginRight: number;
    spacing: number;
  }
> = {
  'sway-cobalt': {
    height: 32,
    marginTop: 6,
    marginLeft: 8,
    marginRight: 8,
    spacing: 6,
    style: {
      fontFamily: 'JetBrains Mono, Plus Jakarta Sans, sans-serif',
      fontSize: 12,
      background: '#0F172A',
      textColor: '#E2E8F0',
      moduleBg: '#1E293B',
      accentColor: '#38BDF8',
      accentTextColor: '#0F172A',
      urgentColor: '#EF4444',
      borderColor: '#334155',
      borderRadius: 6,
      barRadius: 8,
    },
  },
  'catppuccin-mocha': {
    height: 34,
    marginTop: 6,
    marginLeft: 10,
    marginRight: 10,
    spacing: 8,
    style: {
      fontFamily: 'JetBrains Mono, Plus Jakarta Sans, sans-serif',
      fontSize: 12,
      background: '#1E1E2E',
      textColor: '#CDD6F4',
      moduleBg: '#313244',
      accentColor: '#B4BEFE',
      accentTextColor: '#11111B',
      urgentColor: '#F38BA8',
      borderColor: '#45475A',
      borderRadius: 8,
      barRadius: 10,
    },
  },
  'nord-frost': {
    height: 30,
    marginTop: 0,
    marginLeft: 0,
    marginRight: 0,
    spacing: 4,
    style: {
      fontFamily: 'JetBrains Mono, sans-serif',
      fontSize: 12,
      background: '#2E3440',
      textColor: '#ECEFF4',
      moduleBg: '#3B4252',
      accentColor: '#88C0D0',
      accentTextColor: '#2E3440',
      urgentColor: '#BF616A',
      borderColor: '#4C566A',
      borderRadius: 4,
      barRadius: 0,
    },
  },
  'gruvbox-dark': {
    height: 30,
    marginTop: 4,
    marginLeft: 6,
    marginRight: 6,
    spacing: 6,
    style: {
      fontFamily: 'JetBrains Mono, sans-serif',
      fontSize: 12,
      background: '#282828',
      textColor: '#EBDBB2',
      moduleBg: '#3C3836',
      accentColor: '#D79921',
      accentTextColor: '#1D2021',
      urgentColor: '#CC241D',
      borderColor: '#504945',
      borderRadius: 4,
      barRadius: 6,
    },
  },
};

export function createDefaultWaybarModel(): WaybarConfigModel {
  const cobalt = WAYBAR_THEME_PRESETS['sway-cobalt'];
  return {
    enabled: true,
    layer: 'top',
    position: 'top',
    height: cobalt.height,
    spacing: cobalt.spacing,
    marginTop: cobalt.marginTop,
    marginBottom: 0,
    marginLeft: cobalt.marginLeft,
    marginRight: cobalt.marginRight,
    modulesLeft: ['sway/workspaces', 'sway/mode', 'sway/window'],
    modulesCenter: ['clock'],
    modulesRight: ['sway/language', 'pulseaudio', 'network', 'cpu', 'memory', 'tray'],
    clockFormat: '{:%H:%M · %d.%m}',
    disableWorkspaceScroll: true,
    cpuFormat: 'CPU {usage}%',
    memoryFormat: 'RAM {percentage}%',
    networkFormatWifi: '{essid} ({signalStrength}%)',
    pulseaudioFormat: 'VOL {volume}%',
    batteryFormat: 'BAT {capacity}%',
    style: { ...cobalt.style },
  };
}
