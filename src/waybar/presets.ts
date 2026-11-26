import { WaybarConfigModel } from './types';

export const AVAILABLE_WAYBAR_MODULES: Array<{
  id: string;
  label: string;
  description: string;
}> = [
  { id: 'custom/launcher', label: 'custom/launcher', description: 'Кнопка меню приложений (fuzzel / wofi)' },
  { id: 'sway/workspaces', label: 'sway/workspaces', description: 'Кнопки рабочих столов Sway' },
  { id: 'sway/mode', label: 'sway/mode', description: 'Индикатор активного режима (resize и т.д.)' },
  { id: 'sway/window', label: 'sway/window', description: 'Заголовок активного окна' },
  { id: 'sway/language', label: 'sway/language', description: 'Текущая раскладка клавиатуры' },
  { id: 'clock', label: 'clock', description: 'Часы и дата' },
  { id: 'cpu', label: 'cpu', description: 'Загрузка процессора' },
  { id: 'memory', label: 'memory', description: 'Использование ОЗУ' },
  { id: 'temperature', label: 'temperature', description: 'Температура CPU' },
  { id: 'network', label: 'network', description: 'Wi-Fi / Ethernet статус' },
  { id: 'bluetooth', label: 'bluetooth', description: 'Статус Bluetooth' },
  { id: 'pulseaudio', label: 'pulseaudio', description: 'Громкость звука (PipeWire / Pulse)' },
  { id: 'backlight', label: 'backlight', description: 'Яркость экрана' },
  { id: 'battery', label: 'battery', description: 'Заряд батареи' },
  { id: 'tray', label: 'tray', description: 'Системный трей' },
  { id: 'custom/power', label: 'custom/power', description: 'Кнопка меню питания' },
];

export interface WaybarThemePreset {
  style: WaybarConfigModel['style'];
  height: number;
  marginTop: number;
  marginLeft: number;
  marginRight: number;
  spacing: number;
  modulesLeft?: string[];
  modulesCenter?: string[];
  modulesRight?: string[];
  clockFormat?: string;
  memoryFormat?: string;
  networkFormatWifi?: string;
  pulseaudioFormat?: string;
  batteryFormat?: string;
}

export const WAYBAR_THEME_PRESETS: Record<string, WaybarThemePreset> = {
  'sway-cobalt': {
    height: 32,
    marginTop: 6,
    marginLeft: 8,
    marginRight: 8,
    spacing: 6,
    style: {
      barMode: 'bar',
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
      barMode: 'bar',
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
      barMode: 'bar',
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
      barMode: 'bar',
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
  'sage-dark': {
    height: 36,
    marginTop: 8,
    marginLeft: 10,
    marginRight: 10,
    spacing: 8,
    modulesLeft: ['custom/launcher', 'sway/workspaces', 'sway/window'],
    modulesCenter: ['clock'],
    modulesRight: [
      'tray',
      'memory',
      'temperature',
      'backlight',
      'network',
      'bluetooth',
      'pulseaudio',
      'cpu',
      'battery',
    ],
    clockFormat: '{:%I:%M %p}',
    memoryFormat: '{used:0.1f}gb',
    networkFormatWifi: '{essid}',
    pulseaudioFormat: '{volume}%',
    batteryFormat: '{capacity}%',
    style: {
      barMode: 'islands',
      fontFamily: 'JetBrainsMono Nerd Font, JetBrains Mono, sans-serif',
      fontSize: 12,
      background: 'transparent',
      islandBg: '#2C3438',
      mutedPillBg: '#3A4246',
      textColor: '#1C2124',
      windowTextColor: '#D8DDD9',
      moduleBg: '#908C7C',
      accentColor: '#D0C4A8',
      accentTextColor: '#1C2124',
      urgentColor: '#D4776B',
      borderColor: '#232A2E',
      borderRadius: 16,
      barRadius: 20,
    },
  },
  'sage-light': {
    height: 36,
    marginTop: 8,
    marginLeft: 10,
    marginRight: 10,
    spacing: 8,
    modulesLeft: ['custom/launcher', 'sway/workspaces', 'sway/window'],
    modulesCenter: ['clock'],
    modulesRight: [
      'tray',
      'memory',
      'temperature',
      'backlight',
      'network',
      'bluetooth',
      'pulseaudio',
      'cpu',
      'battery',
    ],
    clockFormat: '{:%I:%M %p}',
    memoryFormat: '{used:0.1f}gb',
    networkFormatWifi: '{essid}',
    pulseaudioFormat: '{volume}%',
    batteryFormat: '{capacity}%',
    style: {
      barMode: 'islands',
      fontFamily: 'JetBrainsMono Nerd Font, JetBrains Mono, sans-serif',
      fontSize: 12,
      background: 'transparent',
      islandBg: '#E6ECE5',
      mutedPillBg: '#D4DDD2',
      textColor: '#1E2620',
      windowTextColor: '#1E2620',
      moduleBg: '#C5D0C3',
      accentColor: '#5B7F63',
      accentTextColor: '#F8FAF8',
      urgentColor: '#C2594E',
      borderColor: '#B5C2B4',
      borderRadius: 16,
      barRadius: 20,
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
