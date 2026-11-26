import { PackageAnalysisResult } from '../packages/packageAnalyzer';
import { SwayConfigModel } from '../sway/types';
import { WaybarConfigModel } from '../waybar/types';
import { SystemPalette } from '../ecosystem/ecosystemEngine';
import { AppLang } from '../i18n/translations';
import { BundleDiffResult } from '../git/gitEngine';

export function detectScreenResolution(): string {
  if (typeof window === 'undefined' || !window.screen) return '1920x1080';
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(window.screen.width * dpr);
  const h = Math.round(window.screen.height * dpr);
  if (w >= 640 && h >= 480) return `${w}x${h}`;
  return '1920x1080';
}

export function detectDisplayScale(): number {
  if (typeof window === 'undefined') return 1;
  const dpr = window.devicePixelRatio || 1;
  const rounded = Math.round(dpr * 4) / 4;
  return Math.min(3, Math.max(0.5, rounded));
}

export function detectOutputName(
  analysis?: PackageAnalysisResult,
  existingIndex = 0
): string {
  if (existingIndex === 0) {
    if (
      (analysis?.detected.brightnessTools.length ?? 0) > 0 ||
      analysis?.packages.some((p) => p === 'tlp' || p === 'power-profiles-daemon')
    ) {
      return 'eDP-1';
    }
    return 'DP-1';
  }
  return `HDMI-A-${existingIndex}`;
}

export function detectKeyboardLayouts(lang: AppLang): string {
  if (typeof navigator !== 'undefined') {
    const langs = (navigator.languages ?? [navigator.language]).map((l) =>
      l.toLowerCase().slice(0, 2)
    );
    if (langs.includes('ru')) return 'us,ru';
    const firstNonEn = langs.find((l) => l && l !== 'en' && /^[a-z]{2}$/.test(l));
    if (firstNonEn) return `us,${firstNonEn}`;
  }
  return lang === 'ru' ? 'us,ru' : 'us';
}

export function detectTerminalCommand(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): string {
  if (analysis && analysis.totalPackages > 0) return analysis.recommendedTerm;
  if (sway.variables.term && sway.variables.term.trim()) return sway.variables.term;
  return 'alacritty';
}

export function detectLauncherCommand(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): string {
  if (analysis && analysis.totalPackages > 0) return analysis.recommendedMenu;
  if (sway.variables.menu && sway.variables.menu.trim()) return sway.variables.menu;
  return 'wofi --show drun';
}

export function detectFontFamily(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): string {
  if (analysis && analysis.totalPackages > 0) return analysis.recommendedFont;
  return sway.general.font || 'JetBrainsMono Nerd Font';
}

export function detectBindingCommandFromKeys(
  keys: string,
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): string {
  const lower = keys.toLowerCase();
  const hasSatty = analysis?.detected.screenshotTools.includes('satty') ?? false;
  if (lower.includes('return')) return `exec ${detectTerminalCommand(sway, analysis)}`;
  if (lower.endsWith('+d') || lower === 'd') return `exec ${detectLauncherCommand(sway, analysis)}`;
  if (lower.includes('shift+q')) return 'kill';
  if (lower.includes('shift+c')) return 'reload';
  if (lower.includes('shift+e')) return 'exec swaynag -t warning -m "Exit Sway?" -B "Yes" "swaymsg exit"';
  if (lower.includes('audioraise')) return 'exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+';
  if (lower.includes('audiolower')) return 'exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-';
  if (lower.includes('audiomute')) return 'exec wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle';
  if (lower.includes('brightnessup')) return 'exec brightnessctl set +5%';
  if (lower.includes('brightnessdown')) return 'exec brightnessctl set 5%-';
  if (lower.includes('print') || lower.includes('+s')) {
    return hasSatty
      ? 'exec grim -g "$(slurp)" - | satty --filename -'
      : 'exec grim -g "$(slurp)" - | wl-copy';
  }
  if (lower.includes('escape') || lower.endsWith('+l')) return 'exec swaylock -f';
  if (lower.endsWith('+v')) return 'exec cliphist list | wofi --dmenu | cliphist decode | wl-copy';
  if (lower.includes('+b')) return 'exec firefox';
  return `exec ${detectTerminalCommand(sway, analysis)}`;
}

export function detectSuggestedBinding(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): { flags: string; keys: string; command: string } {
  const existingKeys = new Set(sway.keybindings.map((k) => k.keys.toLowerCase()));
  const hasSatty = analysis?.detected.screenshotTools.includes('satty') ?? false;
  const hasGrim = analysis?.detected.screenshotTools.includes('grim') ?? false;
  const candidates: Array<{ flags: string; keys: string; command: string }> = [
    ...(hasSatty || hasGrim
      ? [
          {
            flags: '',
            keys: '$mod+Shift+s',
            command: hasSatty
              ? 'exec grim -g "$(slurp)" - | satty --filename -'
              : 'exec grim -g "$(slurp)" - | wl-copy',
          },
        ]
      : []),
    ...(analysis?.detected.hasCliphist
      ? [
          {
            flags: '',
            keys: '$mod+v',
            command: 'exec cliphist list | wofi --dmenu | cliphist decode | wl-copy',
          },
        ]
      : []),
    {
      flags: '',
      keys: '$mod+b',
      command: analysis?.packages.some((p) => p.includes('zen-browser'))
        ? 'exec zen-browser'
        : 'exec firefox',
    },
    {
      flags: '--locked',
      keys: 'XF86AudioRaiseVolume',
      command: 'exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+',
    },
  ];

  return (
    candidates.find((c) => !existingKeys.has(c.keys.toLowerCase())) ?? {
      flags: '',
      keys: '$mod+Shift+n',
      command: `exec ${detectTerminalCommand(sway, analysis)}`,
    }
  );
}

export function detectSuggestedCustomVar(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): { name: string; value: string } {
  const used = new Set(sway.variables.custom.map((c) => c.name));
  if (!used.has('browser')) {
    const browser = analysis?.packages.some((p) => p.includes('zen-browser'))
      ? 'zen-browser'
      : analysis?.packages.some((p) => p.includes('chromium'))
      ? 'chromium'
      : 'firefox';
    return { name: 'browser', value: browser };
  }
  if (!used.has('files')) {
    const fm = analysis?.packages.some((p) => p.includes('thunar'))
      ? 'thunar'
      : analysis?.packages.some((p) => p.includes('dolphin'))
      ? 'dolphin'
      : 'nautilus';
    return { name: 'files', value: fm };
  }
  return { name: 'lock', value: 'swaylock -f' };
}

export function detectSuggestedAutostart(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): string {
  const existing = sway.autostart.map((a) => a.command).join('\n');
  if (
    analysis?.detected.networkManagers.some((n) => n.includes('nm-applet') || n.includes('network-manager-applet')) &&
    !existing.includes('nm-applet')
  ) {
    return 'nm-applet --indicator';
  }
  if (
    analysis?.detected.bluetoothTools.some((b) => b.includes('blueman')) &&
    !existing.includes('blueman-applet')
  ) {
    return 'blueman-applet';
  }
  if (analysis?.detected.hasCliphist && !existing.includes('cliphist')) {
    return 'wl-paste --watch cliphist store';
  }
  if (analysis?.detected.notifications.includes('mako') && !existing.includes('mako')) {
    return 'mako';
  }
  if (!existing.includes('wlsunset')) {
    return 'wlsunset -l 55.7 -L 37.6';
  }
  return 'mako';
}

export function detectSuggestedWindowRule(
  sway: SwayConfigModel,
  analysis?: PackageAnalysisResult
): { type: 'for_window' | 'assign' | 'no_focus'; criteria: string; action: string } {
  const existing = new Set(sway.rules.map((r) => r.criteria));
  const hasBlueman = analysis?.detected.bluetoothTools.some((b) => b.includes('blueman')) ?? false;
  const candidates: Array<{ type: 'for_window' | 'assign' | 'no_focus'; criteria: string; action: string }> = [
    { type: 'for_window', criteria: '[app_id="pavucontrol"]', action: 'floating enable' },
    ...(hasBlueman
      ? [{ type: 'for_window' as const, criteria: '[app_id="blueman-manager"]', action: 'floating enable' }]
      : []),
    { type: 'for_window', criteria: '[window_role="dialog"]', action: 'floating enable' },
    { type: 'assign', criteria: '[app_id="firefox"]', action: 'workspace number 2' },
  ];
  return candidates.find((c) => !existing.has(c.criteria)) ?? candidates[0];
}

export function detectGtkTheme(palette: SystemPalette): string {
  return palette.isDark ? 'Adwaita-dark' : 'Adwaita';
}

export function detectIconTheme(
  palette: SystemPalette,
  analysis?: PackageAnalysisResult
): string {
  if (analysis?.packages.some((p) => p.includes('papirus'))) {
    return palette.isDark ? 'Papirus-Dark' : 'Papirus-Light';
  }
  return 'Adwaita';
}

export function detectCursorTheme(analysis?: PackageAnalysisResult): string {
  if (analysis?.packages.some((p) => p.includes('bibata'))) {
    return 'Bibata-Modern-Classic';
  }
  return 'Adwaita';
}

export function detectWaybarPowerCommand(analysis?: PackageAnalysisResult): string {
  if (analysis?.packages.some((p) => p.includes('wlogout'))) return 'wlogout';
  return 'swaylock -f';
}

export function detectCommitMessage(workingDiff: BundleDiffResult, lang: AppLang): string {
  const changed = (Object.keys(workingDiff.files) as Array<keyof typeof workingDiff.files>).filter(
    (k) => workingDiff.files[k].isDirty
  );
  if (changed.length === 0) {
    return lang === 'en' ? 'Snapshot current configuration' : 'Снимок текущей конфигурации';
  }
  const names = changed.join(', ');
  return lang === 'en'
    ? `Update ${names} (+${workingDiff.totalAdded}/-${workingDiff.totalRemoved})`
    : `Обновлены ${names} (+${workingDiff.totalAdded}/-${workingDiff.totalRemoved})`;
}

export function detectBranchName(existingBranches: Record<string, string>, waybar: WaybarConfigModel): string {
  const base = waybar.style.barMode === 'islands' ? 'exp/sage-islands' : 'exp/custom';
  if (!existingBranches[base]) return base;
  let idx = 2;
  while (existingBranches[`${base}-${idx}`]) idx += 1;
  return `${base}-${idx}`;
}
