import { SwayConfigModel } from '../sway/types';
import { WaybarConfigModel } from '../waybar/types';

export type EcosystemFileId =
  | 'alacritty/alacritty.toml'
  | 'foot/foot.ini'
  | 'wofi/style.css'
  | 'wofi/config'
  | 'fuzzel/fuzzel.ini'
  | 'mako/config'
  | 'swaylock/config'
  | 'gtk-3.0/settings.ini';

export interface EcosystemSettings {
  terminalApp: 'alacritty' | 'foot';
  launcherApp: 'wofi' | 'fuzzel';
  notifyApp: 'mako' | 'swaync';
  includeSwaylock: boolean;
  includeGtk: boolean;
  terminalOpacity: number;
  terminalPadding: number;
  terminalDecorations?: 'None' | 'Full';
  terminalCursorStyle?: 'Block' | 'Underline' | 'Beam';
  terminalCursorBlink?: 'On' | 'Off' | 'Always';
  terminalScrollback?: number;
  uiCornerRadius: number;
  uiBorderWidth?: number;
  launcherWidth?: number;
  launcherHeight?: number;
  launcherLocation?: 'center' | 'top' | 'top_left' | 'bottom';
  launcherColumns?: number;
  launcherPrompt?: string;
  launcherShowIcons?: boolean;
  makoAnchor?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left';
  makoTimeout?: number;
  makoWidth?: number;
  makoMaxVisible?: number;
  swaylockRadius?: number;
  swaylockThickness?: number;
  swaylockShowClock?: boolean;
  swaylockEffectBlur?: string;
  gtkTheme: string;
  iconTheme: string;
  cursorTheme: string;
  gtkCursorSize?: number;
  gtkOverlayScrolling?: boolean;
  gtkAnimations?: boolean;
  colorMode: 'auto' | 'dark' | 'light';
}

export interface SystemPalette {
  isDark: boolean;
  wallpaper: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  fg: string;
  mutedFg: string;
  accent: string;
  accentFg: string;
  border: string;
  urgent: string;
  urgentFg: string;
  fontFamily: string;
  fontSize: number;
}

export interface GeneratedEcosystemFile {
  id: EcosystemFileId;
  appLabel: string;
  packageName: string;
  pathHint: string;
  downloadName: string;
  content: string;
}

export function createDefaultEcosystemSettings(): EcosystemSettings {
  return {
    terminalApp: 'alacritty',
    launcherApp: 'wofi',
    notifyApp: 'mako',
    includeSwaylock: true,
    includeGtk: true,
    terminalOpacity: 0.94,
    terminalPadding: 12,
    terminalDecorations: 'None',
    terminalCursorStyle: 'Block',
    terminalCursorBlink: 'On',
    terminalScrollback: 10000,
    uiCornerRadius: 12,
    uiBorderWidth: 2,
    launcherWidth: 520,
    launcherHeight: 340,
    launcherLocation: 'center',
    launcherColumns: 1,
    launcherPrompt: 'Запуск приложения...',
    launcherShowIcons: true,
    makoAnchor: 'top-right',
    makoTimeout: 5000,
    makoWidth: 340,
    makoMaxVisible: 5,
    swaylockRadius: 90,
    swaylockThickness: 8,
    swaylockShowClock: false,
    swaylockEffectBlur: '',
    gtkTheme: 'Adwaita-dark',
    iconTheme: 'Adwaita',
    cursorTheme: 'Adwaita',
    gtkCursorSize: 24,
    gtkOverlayScrolling: true,
    gtkAnimations: true,
    colorMode: 'auto',
  };
}

function stripHash(hex: string): string {
  return hex.replace(/^#/, '');
}

function normalizeHex(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  const clean = hex.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(clean)) return clean;
  if (/^#[0-9a-fA-F]{3}$/.test(clean)) {
    const [, r, g, b] = clean.split('');
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return fallback;
}

function getRelativeLuminance(hex: string): number {
  const clean = stripHash(normalizeHex(hex, '#1e2420'));
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Derives a single cohesive system palette from SwayWM + Waybar state so every app shares identical tones.
 */
export function deriveSystemPalette(
  sway: SwayConfigModel,
  waybar: WaybarConfigModel,
  colorMode: EcosystemSettings['colorMode'] = 'auto'
): SystemPalette {
  const bgOutput = sway.outputs.find((o) => o.background) ?? sway.outputs[0];
  const wallpaper = normalizeHex(bgOutput?.background, '#0F172A');

  const isIsland = waybar.style.barMode === 'islands';
  const rawBarSurface = isIsland ? waybar.style.islandBg || '#2C3438' : waybar.style.background;
  const barSurface = normalizeHex(
    rawBarSurface === 'transparent' ? waybar.style.islandBg : rawBarSurface,
    sway.colors.focused.background
  );

  const detectedDark = getRelativeLuminance(wallpaper) < 0.48;
  const isDark = colorMode === 'auto' ? detectedDark : colorMode === 'dark';

  const bg = normalizeHex(
    isDark ? sway.colors.unfocused.background : sway.colors.focused.background,
    isDark ? '#1E2420' : '#E6ECE5'
  );
  const surface = normalizeHex(barSurface, sway.colors.focused.background);
  const surfaceAlt = normalizeHex(
    isIsland ? waybar.style.mutedPillBg || waybar.style.moduleBg : waybar.style.moduleBg,
    sway.colors.focusedInactive.background
  );

  const fg = normalizeHex(
    isIsland ? waybar.style.windowTextColor || sway.colors.focused.text : waybar.style.textColor,
    isDark ? '#EDF0EC' : '#1E2620'
  );
  const mutedFg = normalizeHex(
    sway.colors.focusedInactive.text,
    isDark ? '#AEB6AE' : '#465448'
  );

  const accent = normalizeHex(
    waybar.style.accentColor || sway.colors.focused.border,
    isDark ? '#D0C4A8' : '#5B7F63'
  );
  const accentFg = normalizeHex(
    waybar.style.accentTextColor,
    getRelativeLuminance(accent) > 0.5 ? '#1C2124' : '#F8FAF8'
  );
  const border = normalizeHex(sway.colors.focused.border, accent);
  const urgent = normalizeHex(sway.colors.urgent.border, '#D4776B');
  const urgentFg = normalizeHex(sway.colors.urgent.text, '#FFFFFF');

  const fontFamily = sway.general.font || 'JetBrainsMono Nerd Font';
  const fontSize = Math.max(8, Math.min(18, sway.general.fontSize || 10));

  return {
    isDark,
    wallpaper,
    bg,
    surface,
    surfaceAlt,
    fg,
    mutedFg,
    accent,
    accentFg,
    border,
    urgent,
    urgentFg,
    fontFamily,
    fontSize,
  };
}

export function generateAlacrittyToml(
  palette: SystemPalette,
  eco: EcosystemSettings
): string {
  const red = palette.urgent;
  const green = palette.isDark ? '#8FA893' : '#4E7557';
  const yellow = palette.isDark ? '#D0C4A8' : '#947843';
  const blue = palette.isDark ? '#7FA4A0' : '#4A7470';
  const magenta = palette.isDark ? '#B29BA8' : '#7C5D70';
  const cyan = palette.isDark ? '#86ADA5' : '#4A7A73';

  const decorations = eco.terminalDecorations ?? 'None';
  const cursorShape = eco.terminalCursorStyle ?? 'Block';
  const cursorBlink = eco.terminalCursorBlink ?? 'On';
  const scrollback = eco.terminalScrollback ?? 10000;

  return `# Сгенерировано SwayForge — Единая тема для Alacritty
# ~/.config/alacritty/alacritty.toml

[general]
live_config_reload = true

[window]
opacity = ${eco.terminalOpacity.toFixed(2)}
padding = { x = ${eco.terminalPadding}, y = ${eco.terminalPadding} }
dynamic_padding = true
decorations = "${decorations}"

[scrolling]
history = ${scrollback}

[cursor]
style = { shape = "${cursorShape}", blinking = "${cursorBlink}" }

[font]
size = ${palette.fontSize}.0

[font.normal]
family = "${palette.fontFamily}"
style = "Regular"

[font.bold]
family = "${palette.fontFamily}"
style = "Bold"

[colors.primary]
background = "${palette.bg}"
foreground = "${palette.fg}"

[colors.cursor]
text = "${palette.bg}"
cursor = "${palette.accent}"

[colors.selection]
text = "${palette.accentFg}"
background = "${palette.accent}"

[colors.normal]
black   = "${palette.surface}"
red     = "${red}"
green   = "${green}"
yellow  = "${yellow}"
blue    = "${blue}"
magenta = "${magenta}"
cyan    = "${cyan}"
white   = "${palette.mutedFg}"

[colors.bright]
black   = "${palette.surfaceAlt}"
red     = "${red}"
green   = "${green}"
yellow  = "${yellow}"
blue    = "${blue}"
magenta = "${magenta}"
cyan    = "${cyan}"
white   = "${palette.fg}"
`;
}

export function generateFootIni(palette: SystemPalette, eco: EcosystemSettings): string {
  const bg = stripHash(palette.bg);
  const fg = stripHash(palette.fg);
  const surf = stripHash(palette.surface);
  const surfAlt = stripHash(palette.surfaceAlt);
  const red = stripHash(palette.urgent);
  const green = palette.isDark ? '8fa893' : '4e7557';
  const yellow = stripHash(palette.accent);
  const blue = palette.isDark ? '7fa4a0' : '4a7470';
  const magenta = palette.isDark ? 'b29ba8' : '7c5d70';
  const cyan = palette.isDark ? '86ada5' : '4a7a73';
  const footCursorStyle = (eco.terminalCursorStyle ?? 'Block').toLowerCase();
  const footBlink = (eco.terminalCursorBlink ?? 'On') === 'Off' ? 'no' : 'yes';
  const scrollback = eco.terminalScrollback ?? 10000;

  return `# Сгенерировано SwayForge — Единая тема для Foot
# ~/.config/foot/foot.ini

[main]
font=${palette.fontFamily}:size=${palette.fontSize}
pad=${eco.terminalPadding}x${eco.terminalPadding}

[scrollback]
lines=${scrollback}

[cursor]
style=${footCursorStyle}
blink=${footBlink}

[colors]
alpha=${eco.terminalOpacity.toFixed(2)}
background=${bg}
foreground=${fg}
regular0=${surf}
regular1=${red}
regular2=${green}
regular3=${yellow}
regular4=${blue}
regular5=${magenta}
regular6=${cyan}
regular7=${stripHash(palette.mutedFg)}
bright0=${surfAlt}
bright1=${red}
bright2=${green}
bright3=${yellow}
bright4=${blue}
bright5=${magenta}
bright6=${cyan}
bright7=${fg}
`;
}

export function generateWofiConfig(eco: EcosystemSettings): string {
  const termCmd = eco.terminalApp;
  const width = eco.launcherWidth ?? 520;
  const height = eco.launcherHeight ?? 340;
  const location = eco.launcherLocation ?? 'center';
  const columns = eco.launcherColumns ?? 1;
  const allowImages = eco.launcherShowIcons ?? true;
  const prompt = eco.launcherPrompt ?? 'Запуск приложения...';

  return `# ~/.config/wofi/config
show=drun
width=${width}
height=${height}
location=${location}
columns=${columns}
allow_images=${allowImages}
allow_markup=true
no_actions=true
matching=fuzzy
insensitive=true
term=${termCmd}
prompt=${prompt}
`;
}

export function generateWofiCss(palette: SystemPalette, eco: EcosystemSettings): string {
  const r = eco.uiCornerRadius;
  const bw = eco.uiBorderWidth ?? 2;
  const innerR = Math.max(4, Math.min(r, 12));
  return `/* Сгенерировано SwayForge — Единый стиль Wofi под SwayWM + Waybar */
/* ~/.config/wofi/style.css */

window {
  margin: 0px;
  border: ${bw}px solid ${palette.border};
  border-radius: ${r}px;
  background-color: ${palette.surface};
  font-family: "${palette.fontFamily}", sans-serif;
  font-size: ${palette.fontSize + 2}px;
}

#outer-box {
  margin: 8px;
  padding: 6px;
  background-color: transparent;
}

#input {
  margin: 4px 4px 10px 4px;
  padding: 8px 12px;
  border: 1px solid ${palette.surfaceAlt};
  border-radius: ${innerR}px;
  background-color: ${palette.bg};
  color: ${palette.fg};
  caret-color: ${palette.accent};
}

#inner-box {
  margin: 2px;
  background-color: transparent;
}

#entry {
  padding: 8px 12px;
  margin: 2px 0px;
  border-radius: ${innerR}px;
  color: ${palette.fg};
}

#entry:selected {
  background-color: ${palette.accent};
  color: ${palette.accentFg};
  font-weight: 600;
}

#text:selected {
  color: ${palette.accentFg};
}
`;
}

export function generateFuzzelIni(palette: SystemPalette, eco: EcosystemSettings): string {
  const alphaHex = 'f0';
  const iconsEnabled = eco.launcherShowIcons ?? true;
  const bw = eco.uiBorderWidth ?? 2;
  const prompt = eco.launcherPrompt ?? '> ';

  return `# Сгенерировано SwayForge — Единый стиль Fuzzel
# ~/.config/fuzzel/fuzzel.ini

[main]
font=${palette.fontFamily}:size=${palette.fontSize + 1}
terminal=${eco.terminalApp}
prompt="${prompt} "
icons-enabled=${iconsEnabled ? 'yes' : 'no'}
width=36
lines=10
horizontal-pad=18
vertical-pad=12

[colors]
background=${stripHash(palette.surface)}${alphaHex}
text=${stripHash(palette.fg)}ff
match=${stripHash(palette.accent)}ff
selection=${stripHash(palette.accent)}ff
selection-text=${stripHash(palette.accentFg)}ff
border=${stripHash(palette.border)}ff

[border]
width=${bw}
radius=${eco.uiCornerRadius}
`;
}

export function generateMakoConfig(palette: SystemPalette, eco: EcosystemSettings): string {
  const anchor = eco.makoAnchor ?? 'top-right';
  const timeout = eco.makoTimeout ?? 5000;
  const width = eco.makoWidth ?? 340;
  const maxVisible = eco.makoMaxVisible ?? 5;
  const borderSize = eco.uiBorderWidth ?? 2;

  return `# Сгенерировано SwayForge — Единый стиль уведомлений Mako
# ~/.config/mako/config

font=${palette.fontFamily} ${palette.fontSize}
background-color=${palette.surface}
text-color=${palette.fg}
border-color=${palette.border}
progress-color=over ${palette.accent}
border-size=${borderSize}
border-radius=${eco.uiCornerRadius}
padding=12
margin=12
width=${width}
max-visible=${maxVisible}
default-timeout=${timeout}
anchor=${anchor}

[urgency=high]
background-color=${palette.bg}
text-color=${palette.urgentFg}
border-color=${palette.urgent}
default-timeout=0
`;
}

export function generateSwaylockConfig(
  palette: SystemPalette,
  eco: EcosystemSettings = createDefaultEcosystemSettings()
): string {
  const c = (h: string) => stripHash(h);
  const radius = eco.swaylockRadius ?? 90;
  const thickness = eco.swaylockThickness ?? 8;
  const extraLines: string[] = [];
  if (eco.swaylockShowClock) {
    extraLines.push('clock');
  }
  if (eco.swaylockEffectBlur && eco.swaylockEffectBlur.trim()) {
    extraLines.push(`effect-blur=${eco.swaylockEffectBlur.trim()}`);
  }

  return `# Сгенерировано SwayForge — Единый стиль экрана блокировки Swaylock
# ~/.config/swaylock/config

ignore-empty-password
show-failed-attempts
indicator-radius=${radius}
indicator-thickness=${thickness}
color=${c(palette.wallpaper)}
inside-color=${c(palette.surface)}cc
ring-color=${c(palette.surfaceAlt)}
line-color=00000000
separator-color=00000000
key-hl-color=${c(palette.accent)}
bs-hl-color=${c(palette.urgent)}
inside-ver-color=${c(palette.surface)}cc
ring-ver-color=${c(palette.accent)}
inside-wrong-color=${c(palette.bg)}cc
ring-wrong-color=${c(palette.urgent)}
text-color=${c(palette.fg)}
text-ver-color=${c(palette.fg)}
text-wrong-color=${c(palette.urgentFg)}
font=${palette.fontFamily}${extraLines.length > 0 ? `\n${extraLines.join('\n')}` : ''}
`;
}

export function generateGtkSettingsIni(palette: SystemPalette, eco: EcosystemSettings): string {
  const preferDark = palette.isDark ? 1 : 0;
  const resolvedGtkTheme =
    eco.colorMode === 'auto'
      ? palette.isDark
        ? 'Adwaita-dark'
        : 'Adwaita'
      : eco.gtkTheme;
  const cursorSize = eco.gtkCursorSize ?? 24;
  const animations = eco.gtkAnimations ?? true;
  const overlayScrolling = eco.gtkOverlayScrolling ?? true;

  return `# Сгенерировано SwayForge — Единая тема GTK3/GTK4 (Thunar, Pavucontrol, Blueman)
# ~/.config/gtk-3.0/settings.ini

[Settings]
gtk-application-prefer-dark-theme=${preferDark}
gtk-theme-name=${resolvedGtkTheme}
gtk-icon-theme-name=${eco.iconTheme}
gtk-cursor-theme-name=${eco.cursorTheme}
gtk-cursor-theme-size=${cursorSize}
gtk-font-name=${palette.fontFamily} ${palette.fontSize}
gtk-enable-animations=${animations ? 1 : 0}
gtk-overlay-scrolling=${overlayScrolling ? 1 : 0}
`;
}

export function generateUnifiedEcosystemFiles(
  sway: SwayConfigModel,
  waybar: WaybarConfigModel,
  eco: EcosystemSettings
): GeneratedEcosystemFile[] {
  const palette = deriveSystemPalette(sway, waybar, eco.colorMode);
  const files: GeneratedEcosystemFile[] = [];

  if (eco.terminalApp === 'alacritty') {
    files.push({
      id: 'alacritty/alacritty.toml',
      appLabel: 'Alacritty (Терминал)',
      packageName: 'alacritty',
      pathHint: '~/.config/alacritty/alacritty.toml',
      downloadName: 'alacritty.toml',
      content: generateAlacrittyToml(palette, eco),
    });
  } else {
    files.push({
      id: 'foot/foot.ini',
      appLabel: 'Foot (Терминал)',
      packageName: 'foot',
      pathHint: '~/.config/foot/foot.ini',
      downloadName: 'foot.ini',
      content: generateFootIni(palette, eco),
    });
  }

  if (eco.launcherApp === 'wofi') {
    files.push(
      {
        id: 'wofi/style.css',
        appLabel: 'Wofi CSS (Лаунчер)',
        packageName: 'wofi',
        pathHint: '~/.config/wofi/style.css',
        downloadName: 'wofi-style.css',
        content: generateWofiCss(palette, eco),
      },
      {
        id: 'wofi/config',
        appLabel: 'Wofi Config (Лаунчер)',
        packageName: 'wofi',
        pathHint: '~/.config/wofi/config',
        downloadName: 'wofi-config',
        content: generateWofiConfig(eco),
      }
    );
  } else {
    files.push({
      id: 'fuzzel/fuzzel.ini',
      appLabel: 'Fuzzel (Лаунчер)',
      packageName: 'fuzzel',
      pathHint: '~/.config/fuzzel/fuzzel.ini',
      downloadName: 'fuzzel.ini',
      content: generateFuzzelIni(palette, eco),
    });
  }

  files.push({
    id: 'mako/config',
    appLabel: 'Mako (Уведомления)',
    packageName: 'mako',
    pathHint: '~/.config/mako/config',
    downloadName: 'mako-config',
    content: generateMakoConfig(palette, eco),
  });

  if (eco.includeSwaylock) {
    files.push({
      id: 'swaylock/config',
      appLabel: 'Swaylock (Блокировка)',
      packageName: 'swaylock',
      pathHint: '~/.config/swaylock/config',
      downloadName: 'swaylock-config',
      content: generateSwaylockConfig(palette, eco),
    });
  }

  if (eco.includeGtk) {
    files.push({
      id: 'gtk-3.0/settings.ini',
      appLabel: 'GTK 3/4 (Thunar, Pavucontrol)',
      packageName: 'gtk3',
      pathHint: '~/.config/gtk-3.0/settings.ini',
      downloadName: 'gtk-settings.ini',
      content: generateGtkSettingsIni(palette, eco),
    });
  }

  return files;
}

export function generateUnifiedInstallScript(
  swayConfig: string,
  waybarJson: string,
  waybarCss: string,
  ecoFiles: GeneratedEcosystemFile[],
  palette: SystemPalette,
  eco: EcosystemSettings
): string {
  const lines: string[] = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    '',
    '# Единая установка конфигурации системы SwayWM + Waybar + Экосистема (SwayForge)',
    'CONFIG_DIR="${1:-$HOME/.config}"',
    'mkdir -p "$CONFIG_DIR/sway" "$CONFIG_DIR/waybar"',
    '',
  ];

  const writeHereDoc = (relPath: string, content: string) => {
    const dir = relPath.includes('/') ? relPath.split('/').slice(0, -1).join('/') : '';
    if (dir) lines.push(`mkdir -p "$CONFIG_DIR/${dir}"`);
    lines.push(`cat <<'__SWAYFORGE_EOF__' > "$CONFIG_DIR/${relPath}"`);
    lines.push(content.replace(/\n$/, ''));
    lines.push('__SWAYFORGE_EOF__');
    lines.push('');
  };

  writeHereDoc('sway/config', swayConfig);
  writeHereDoc('waybar/config.jsonc', waybarJson);
  writeHereDoc('waybar/style.css', waybarCss);

  for (const file of ecoFiles) {
    writeHereDoc(file.id, file.content);
  }

  const scheme = palette.isDark ? 'prefer-dark' : 'prefer-light';
  const resolvedGtk =
    eco.colorMode === 'auto' ? (palette.isDark ? 'Adwaita-dark' : 'Adwaita') : eco.gtkTheme;
  lines.push('# Синхронизация GTK / gsettings для цельного вида окон (Thunar, Firefox, Pavucontrol)');
  lines.push('if command -v gsettings >/dev/null 2>&1; then');
  lines.push(`  gsettings set org.gnome.desktop.interface color-scheme '${scheme}' || true`);
  lines.push(`  gsettings set org.gnome.desktop.interface gtk-theme '${resolvedGtk}' || true`);
  lines.push(`  gsettings set org.gnome.desktop.interface icon-theme '${eco.iconTheme}' || true`);
  lines.push(`  gsettings set org.gnome.desktop.interface cursor-theme '${eco.cursorTheme}' || true`);
  lines.push('fi');
  lines.push('');
  lines.push('echo "Готово! Вся экосистема установлена в $CONFIG_DIR. Перезагрузите Sway: swaymsg reload"');

  return lines.join('\n');
}
