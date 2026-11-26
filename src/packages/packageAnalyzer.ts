import { SwayConfigModel } from '../sway/types';

export interface RedundantPackageFinding {
  id: string;
  title: string;
  severity: 'warning' | 'info';
  matchedPackages: string[];
  reason: string;
  recommendation: string;
  removeCommand?: string;
}

export interface MissingPackageFinding {
  id: string;
  packageName: string;
  alternatives?: string[];
  category: 'notifications' | 'lock' | 'clipboard' | 'wayland' | 'tray' | 'core';
  priority: 'required' | 'recommended' | 'optional';
  title: string;
  reason: string;
}

export interface DetectedEcosystemCapabilities {
  terminals: string[];
  launchers: string[];
  notifications: string[];
  lockers: string[];
  idleDaemons: string[];
  fileManagers: string[];
  browsers: string[];
  screenshotTools: string[];
  audioTools: string[];
  brightnessTools: string[];
  networkManagers: string[];
  bluetoothTools: string[];
  gtkTools: string[];
  fonts: string[];
  hasDarkman: boolean;
  hasWlsunset: boolean;
  hasCliphist: boolean;
}

export interface PackageAnalysisResult {
  totalPackages: number;
  packages: string[];
  detected: DetectedEcosystemCapabilities;
  redundant: RedundantPackageFinding[];
  missing: MissingPackageFinding[];
  recommendedTerm: 'alacritty' | 'foot' | 'kitty';
  recommendedMenu: 'wofi --show drun' | 'fuzzel' | 'rofi -show drun' | 'wmenu-run';
  recommendedFont: string;
  installCommand: string;
}

export const SAMPLE_ARCH_SWAY_PACKAGES = `# Пример вывода pacman -Qq (ноутбук CachyOS / Arch + Sway)
alacritty
amd-ucode
blueman
bluez
brightnessctl
cachyos-rate-mirrors
firefox
fish
fish-pure-prompt
foot
grim
iwd
libreoffice-still
libnotify
linux-firmware
linux-firmware-amdgpu
linux-firmware-nvidia
micro
nano
netctl
networkmanager
oh-my-zsh-git
pavucontrol
playerctl
polkit-gnome
portproton
qt5-wayland
qt6-base
rate-mirrors
reflector
satty
slurp
sway
swaybg
thunar
ttf-jetbrains-mono-nerd
vim
vulkan-radeon
waybar
wireplumber
wl-clipboard
wmenu
wofi
wpa_supplicant
xdg-desktop-portal-wlr
zen-browser-bin
zsh
zsh-theme-powerlevel10k`;

/**
 * Parses pasted `pacman -Q`, `pacman -Qq`, `pacman -Qe`, or space/comma-separated package lists.
 */
export function parsePackageList(raw: string): string[] {
  const seen = new Set<string>();
  const lines = raw.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // If line looks like `pkg-name 1.2.3-1` or `extra/pkg-name 1.2.3-1 [installed]`, take token 0.
    // If line has multiple comma-separated names, split by commas/spaces when there are no version digits.
    const parts = trimmed.split(/\s+/);
    const looksLikeVersionLine =
      parts.length >= 2 &&
      (/^[\dvr]/.test(parts[1]) || parts[1].includes('.') || parts[1].startsWith('['));

    const candidateTokens = looksLikeVersionLine
      ? [parts[0]]
      : trimmed.split(/[\s,;]+/).filter(Boolean);

    for (const token of candidateTokens) {
      if (token.startsWith('[') || token.startsWith('(')) continue;
      const cleanName = token.includes('/') ? token.split('/').pop() ?? token : token;
      const normalized = cleanName.trim().toLowerCase();
      if (normalized && /^[a-z0-9@._+-]+$/.test(normalized)) {
        seen.add(normalized);
      }
    }
  }

  return Array.from(seen);
}

function pickMatches(pkgSet: Set<string>, candidates: string[]): string[] {
  return candidates.filter((c) => pkgSet.has(c));
}

function hasAny(pkgSet: Set<string>, candidates: string[]): boolean {
  return candidates.some((c) => pkgSet.has(c));
}

export function analyzeInstalledPackages(packages: string[]): PackageAnalysisResult {
  const pkgSet = new Set(packages.map((p) => p.toLowerCase()));

  const detected: DetectedEcosystemCapabilities = {
    terminals: pickMatches(pkgSet, ['alacritty', 'foot', 'kitty', 'wezterm', 'ghostty']),
    launchers: pickMatches(pkgSet, ['wofi', 'fuzzel', 'rofi-wayland', 'rofi', 'wmenu', 'bemenu', 'tofi']),
    notifications: pickMatches(pkgSet, ['mako', 'swaync', 'dunst']),
    lockers: pickMatches(pkgSet, ['swaylock', 'swaylock-effects', 'gtklock', 'hyprlock']),
    idleDaemons: pickMatches(pkgSet, ['swayidle']),
    fileManagers: pickMatches(pkgSet, ['thunar', 'pcmanfm', 'nautilus', 'yazi', 'ranger']),
    browsers: pickMatches(pkgSet, ['zen-browser-bin', 'firefox', 'chromium', 'google-chrome', 'vivaldi']),
    screenshotTools: pickMatches(pkgSet, ['grim', 'slurp', 'satty', 'swappy', 'grimshot']),
    audioTools: pickMatches(pkgSet, ['wireplumber', 'pipewire-pulse', 'pavucontrol', 'pamixer']),
    brightnessTools: pickMatches(pkgSet, ['brightnessctl', 'light']),
    networkManagers: pickMatches(pkgSet, ['networkmanager', 'network-manager-applet', 'netctl', 'iwd', 'wpa_supplicant']),
    bluetoothTools: pickMatches(pkgSet, ['blueman', 'bluez', 'bluetui']),
    gtkTools: pickMatches(pkgSet, ['polkit-gnome', 'nwg-look', 'lxappearance']),
    fonts: pickMatches(pkgSet, [
      'ttf-jetbrains-mono-nerd',
      'ttf-jetbrains-mono',
      'ttf-meslo-nerd',
      'ttf-fira-code',
      'noto-fonts',
      'noto-fonts-emoji',
    ]),
    hasDarkman: pkgSet.has('darkman'),
    hasWlsunset: pkgSet.has('wlsunset'),
    hasCliphist: pkgSet.has('cliphist'),
  };

  const redundant: RedundantPackageFinding[] = [];

  // 1. Network stack conflicts / duplicates
  const hasNM = pkgSet.has('networkmanager');
  const hasNetctl = pkgSet.has('netctl');
  const hasIwd = pkgSet.has('iwd');
  const hasWpa = pkgSet.has('wpa_supplicant');

  if (hasNM && hasNetctl) {
    redundant.push({
      id: 'net-netctl',
      title: 'Дублирующий сетевой менеджер (netctl + NetworkManager)',
      severity: 'warning',
      matchedPackages: ['netctl', 'networkmanager'],
      reason: 'При активном NetworkManager утилита netctl обычно не нужна и может конфликтовать за интерфейсы.',
      recommendation: 'Если вы используете NetworkManager (nmtui / nmcli / nm-applet), пакет netctl можно удалить.',
      removeCommand: 'sudo pacman -Rns netctl',
    });
  }

  if (hasIwd && hasWpa) {
    redundant.push({
      id: 'net-wifi-daemons',
      title: 'Два Wi-Fi демона одновременно (iwd + wpa_supplicant)',
      severity: 'warning',
      matchedPackages: ['iwd', 'wpa_supplicant'],
      reason: 'В Arch/CachyOS обычно используется либо wpa_supplicant (по умолчанию для NetworkManager), либо iwd.',
      recommendation: 'Оставьте только тот Wi-Fi бэкенд, который реально запущен в systemd.',
    });
  }

  // 2. Dual interactive shells
  const fishStack = pickMatches(pkgSet, [
    'fish',
    'cachyos-fish-config',
    'fish-autopair',
    'fish-pure-prompt',
    'fisher',
  ]);
  const zshStack = pickMatches(pkgSet, [
    'zsh',
    'cachyos-zsh-config',
    'oh-my-zsh-git',
    'zsh-theme-powerlevel10k',
    'zsh-autosuggestions',
    'zsh-syntax-highlighting',
    'zsh-completions',
    'zsh-history-substring-search',
  ]);

  if (pkgSet.has('fish') && pkgSet.has('zsh')) {
    redundant.push({
      id: 'dual-shells',
      title: 'Установлены две полные экосистемы оболочек (fish + zsh)',
      severity: 'info',
      matchedPackages: [...fishStack, ...zshStack],
      reason: 'И для fish, и для zsh поставлены отдельные наборы тем, плагинов и автодополнения.',
      recommendation: 'Оставьте основную оболочку (echo $SHELL), а вторую связку можно удалить для чистоты системы.',
    });
  }

  // 3. Multiple terminals
  if (detected.terminals.length > 1) {
    const preferred = detected.terminals.includes('alacritty') ? 'alacritty' : detected.terminals[0];
    const extras = detected.terminals.filter((t) => t !== preferred);
    redundant.push({
      id: 'multi-terminals',
      title: `Несколько Wayland-терминалов (${detected.terminals.join(', ')})`,
      severity: 'info',
      matchedPackages: detected.terminals,
      reason: 'Для цельного внешнего вида удобнее настроить один основной терминал под единую палитру и шрифт.',
      recommendation: `Оставьте ${preferred} как основной $term в Sway, остальные при желании можно удалить.`,
      removeCommand: `sudo pacman -Rns ${extras.join(' ')}`,
    });
  }

  // 4. Multiple app launchers
  if (detected.launchers.length > 1) {
    const preferred = detected.launchers.includes('wofi')
      ? 'wofi'
      : detected.launchers.includes('fuzzel')
      ? 'fuzzel'
      : detected.launchers[0];
    const extras = detected.launchers.filter((l) => l !== preferred);
    redundant.push({
      id: 'multi-launchers',
      title: `Дублирующие лаунчеры приложений (${detected.launchers.join(', ')})`,
      severity: 'info',
      matchedPackages: detected.launchers,
      reason: 'Разные лаунчеры без единого стиля создают визуальную «мозайку» при запуске программ.',
      recommendation: `Выберите ${preferred} как единый $menu и оформите его CSS/INI под тему Waybar.`,
      removeCommand: `sudo pacman -Rns ${extras.join(' ')}`,
    });
  }

  // 5. Multiple browsers
  const browsers = pickMatches(pkgSet, ['firefox', 'zen-browser-bin', 'chromium', 'google-chrome', 'vivaldi']);
  if (browsers.length > 1) {
    redundant.push({
      id: 'multi-browsers',
      title: `Установлено несколько браузеров (${browsers.join(', ')})`,
      severity: 'info',
      matchedPackages: browsers,
      reason: 'Два крупных браузера занимают место на диске и обновляются параллельно.',
      recommendation: 'Удалите запасной браузер, если используете только один основной.',
    });
  }

  // 6. Multiple terminal editors
  const editors = pickMatches(pkgSet, ['micro', 'vim', 'neovim', 'nano']);
  if (editors.length >= 3) {
    redundant.push({
      id: 'multi-editors',
      title: `Три консольных редактора (${editors.join(', ')})`,
      severity: 'info',
      matchedPackages: editors,
      reason: 'Обычно хватает одного привычного редактора (например, micro или neovim) и базового nano.',
      recommendation: 'Удалите те редакторы, которыми вы не пользуетесь в терминале.',
    });
  }

  // 7. Duplicate mirror tools
  const mirrorTools = pickMatches(pkgSet, ['reflector', 'rate-mirrors', 'cachyos-rate-mirrors']);
  if (pkgSet.has('reflector') && (pkgSet.has('rate-mirrors') || pkgSet.has('cachyos-rate-mirrors'))) {
    redundant.push({
      id: 'multi-mirrors',
      title: 'Дублирующие утилиты обновления зеркал (reflector + rate-mirrors)',
      severity: 'info',
      matchedPackages: mirrorTools,
      reason: 'В CachyOS по умолчанию используется cachyos-rate-mirrors / rate-mirrors.',
      recommendation: 'Если вы не запускаете reflector вручную или по таймеру, его можно убрать.',
      removeCommand: 'sudo pacman -Rns reflector',
    });
  }

  // 8. Mismatched GPU firmware
  const isAmdSystem = pkgSet.has('amd-ucode') || pkgSet.has('vulkan-radeon') || pkgSet.has('xf86-video-amdgpu');
  const hasNvidiaDriver = pkgSet.has('nvidia') || pkgSet.has('nvidia-dkms') || pkgSet.has('nvidia-open') || pkgSet.has('nvidia-utils');
  if (isAmdSystem && !hasNvidiaDriver && pkgSet.has('linux-firmware-nvidia')) {
    redundant.push({
      id: 'nvidia-firmware-on-amd',
      title: 'Прошивки NVIDIA на AMD-системе (linux-firmware-nvidia)',
      severity: 'info',
      matchedPackages: ['linux-firmware-nvidia'],
      reason: 'Обнаружены пакеты AMD и не найден драйвер NVIDIA. Часто ставится в составе метапакета linux-firmware.',
      recommendation: 'Удаляйте только при отказе от общего метапакета linux-firmware (иначе pacman вернёт его как зависимость).',
    });
  }

  // 9. Heavy optional suites
  const heavySuites = pickMatches(pkgSet, [
    'qemu-system-x86',
    'godot-mono',
    'dotnet-sdk',
    'portproton',
    'libreoffice-still',
    'libreoffice-fresh',
    'cachyos-hello',
  ]);
  if (heavySuites.length > 0) {
    redundant.push({
      id: 'heavy-optional',
      title: 'Крупные прикладные пакеты (проверьте актуальность)',
      severity: 'info',
      matchedPackages: heavySuites,
      reason: 'Эти пакеты не мешают SwayWM, но занимают заметный объём диска и часто обновляются.',
      recommendation: 'Удалите только те из них, которыми точно не пользуетесь.',
    });
  }

  // --- Missing Packages for cohesive SwayWM + Waybar ---
  const missing: MissingPackageFinding[] = [];

  if (!hasAny(pkgSet, ['mako', 'swaync', 'dunst'])) {
    missing.push({
      id: 'miss-notifications',
      packageName: 'mako',
      alternatives: ['swaync', 'dunst'],
      category: 'notifications',
      priority: 'required',
      title: 'Демон уведомлений (mako или swaync)',
      reason: 'Ни один демон уведомлений не установлен — уведомления от браузера, мессенджеров и системы не отображаются.',
    });
  }

  if (!hasAny(pkgSet, ['swaylock', 'swaylock-effects', 'gtklock'])) {
    missing.push({
      id: 'miss-swaylock',
      packageName: 'swaylock',
      alternatives: ['swaylock-effects'],
      category: 'lock',
      priority: 'required',
      title: 'Экран блокировки (swaylock)',
      reason: 'Нужен для безопасной блокировки ноутбука по горячей клавише и перед сном.',
    });
  }

  if (!pkgSet.has('swayidle')) {
    missing.push({
      id: 'miss-swayidle',
      packageName: 'swayidle',
      category: 'lock',
      priority: 'required',
      title: 'Менеджер простоя и автоблокировки (swayidle)',
      reason: 'Автоматически гасит экран и запускает swaylock при бездействии или закрытии крышки.',
    });
  }

  if (!pkgSet.has('cliphist')) {
    missing.push({
      id: 'miss-cliphist',
      packageName: 'cliphist',
      category: 'clipboard',
      priority: 'recommended',
      title: 'История буфера обмена (cliphist)',
      reason: 'В связке с wl-clipboard и wofi/fuzzel позволяет выбирать прошлые скопированные фрагменты.',
    });
  }

  if (!pkgSet.has('qt6-wayland') && (pkgSet.has('qt6-base') || pkgSet.has('qt5-wayland') || pkgSet.has('satty'))) {
    missing.push({
      id: 'miss-qt6-wayland',
      packageName: 'qt6-wayland',
      category: 'wayland',
      priority: 'recommended',
      title: 'Нативная поддержка Wayland для Qt6 (qt6-wayland)',
      reason: 'qt5-wayland или qt6-base уже есть, но без qt6-wayland современные Qt6-приложения падают в XWayland и выглядят размыто.',
    });
  }

  if (pkgSet.has('networkmanager') && !pkgSet.has('network-manager-applet')) {
    missing.push({
      id: 'miss-nm-applet',
      packageName: 'network-manager-applet',
      category: 'tray',
      priority: 'recommended',
      title: 'Графический апплет сети для трея (nm-applet)',
      reason: 'Даёт удобное всплывающее меню Wi-Fi и VPN прямо в трее Waybar.',
    });
  }

  if (!pkgSet.has('waybar')) {
    missing.push({
      id: 'miss-waybar',
      packageName: 'waybar',
      category: 'core',
      priority: 'required',
      title: 'Верхняя/нижняя панель (waybar)',
      reason: 'Необходим для отображения настроенной в SwayForge панели и островков.',
    });
  }

  if (!hasAny(pkgSet, ['alacritty', 'foot', 'kitty', 'wezterm'])) {
    missing.push({
      id: 'miss-terminal',
      packageName: 'alacritty',
      alternatives: ['foot', 'kitty'],
      category: 'core',
      priority: 'required',
      title: 'Wayland-терминал (alacritty)',
      reason: 'Не найден ни один совместимый терминал для запуска по $mod+Return.',
    });
  }

  if (!hasAny(pkgSet, ['wofi', 'fuzzel', 'rofi-wayland', 'wmenu'])) {
    missing.push({
      id: 'miss-launcher',
      packageName: 'wofi',
      alternatives: ['fuzzel'],
      category: 'core',
      priority: 'required',
      title: 'Лаунчер приложений (wofi или fuzzel)',
      reason: 'Не найдено меню запуска программ для $mod+d.',
    });
  }

  if (!pkgSet.has('grim')) {
    missing.push({
      id: 'miss-grim',
      packageName: 'grim',
      category: 'core',
      priority: 'recommended',
      title: 'Скриншоты экрана (grim)',
      reason: 'Базовая утилита снятия скриншотов в Sway.',
    });
  }

  if (!pkgSet.has('slurp')) {
    missing.push({
      id: 'miss-slurp',
      packageName: 'slurp',
      category: 'core',
      priority: 'recommended',
      title: 'Выделение области экрана (slurp)',
      reason: 'Позволяет выбирать область при съёмке скриншота.',
    });
  }

  if (!pkgSet.has('wl-clipboard')) {
    missing.push({
      id: 'miss-wl-clipboard',
      packageName: 'wl-clipboard',
      category: 'clipboard',
      priority: 'required',
      title: 'Системный буфер обмена Wayland (wl-clipboard)',
      reason: 'Необходим для копирования скриншотов и работы буфера обмена в терминале.',
    });
  }

  if (!pkgSet.has('brightnessctl')) {
    missing.push({
      id: 'miss-brightnessctl',
      packageName: 'brightnessctl',
      category: 'core',
      priority: 'recommended',
      title: 'Управление яркостью экрана (brightnessctl)',
      reason: 'Нужен для работы функциональных клавиш яркости ноутбука.',
    });
  }

  if (!pkgSet.has('polkit-gnome')) {
    missing.push({
      id: 'miss-polkit',
      packageName: 'polkit-gnome',
      category: 'wayland',
      priority: 'recommended',
      title: 'Агент прав администратора (polkit-gnome)',
      reason: 'Без него графические приложения не смогут запрашивать пароль root.',
    });
  }

  if (!pkgSet.has('wlsunset')) {
    missing.push({
      id: 'miss-wlsunset',
      packageName: 'wlsunset',
      category: 'wayland',
      priority: 'optional',
      title: 'Ночная цветовая температура экрана (wlsunset)',
      reason: 'Мягко снижает синий свет вечером — бережёт глаза и дополняет тёмные темы.',
    });
  }

  if (!pkgSet.has('darkman')) {
    missing.push({
      id: 'miss-darkman',
      packageName: 'darkman',
      category: 'wayland',
      priority: 'optional',
      title: 'Автосмена темы день/ночь (darkman)',
      reason: 'Автоматически переключает Dark/Light режим в шалфейном конфиге по времени суток.',
    });
  }

  const recommendedTerm: 'alacritty' | 'foot' | 'kitty' = pkgSet.has('alacritty')
    ? 'alacritty'
    : pkgSet.has('foot')
    ? 'foot'
    : pkgSet.has('kitty')
    ? 'kitty'
    : 'alacritty';

  const recommendedMenu: 'wofi --show drun' | 'fuzzel' | 'rofi -show drun' | 'wmenu-run' = pkgSet.has('wofi')
    ? 'wofi --show drun'
    : pkgSet.has('fuzzel')
    ? 'fuzzel'
    : pkgSet.has('rofi-wayland') || pkgSet.has('rofi')
    ? 'rofi -show drun'
    : pkgSet.has('wmenu')
    ? 'wmenu-run'
    : 'wofi --show drun';

  const recommendedFont = pkgSet.has('ttf-jetbrains-mono-nerd')
    ? 'JetBrainsMono Nerd Font'
    : pkgSet.has('ttf-meslo-nerd')
    ? 'MesloLGS Nerd Font'
    : pkgSet.has('ttf-jetbrains-mono')
    ? 'JetBrains Mono'
    : 'JetBrainsMono Nerd Font';

  const autoInstallList = missing
    .filter((m) => m.priority !== 'optional')
    .map((m) => m.packageName);

  const installCommand =
    autoInstallList.length > 0
      ? `sudo pacman -S ${autoInstallList.join(' ')}`
      : '# Все базовые пакеты для SwayWM + Waybar уже установлены';

  return {
    totalPackages: packages.length,
    packages,
    detected,
    redundant,
    missing,
    recommendedTerm,
    recommendedMenu,
    recommendedFont,
    installCommand,
  };
}

/**
 * Updates SwayConfigModel variables, font, and safe autostart entries to match detected packages.
 */
export function applyPackagesToSwayModel(
  prev: SwayConfigModel,
  analysis: PackageAnalysisResult
): SwayConfigModel {
  const nextAutostart = [...prev.autostart];

  const ensureExec = (matchSubstr: string, command: string) => {
    if (!nextAutostart.some((a) => a.command.includes(matchSubstr))) {
      nextAutostart.push({
        id: `pkg-exec-${Math.random().toString(36).slice(2, 7)}`,
        always: false,
        command,
      });
    }
  };

  if (analysis.detected.notifications.includes('mako')) {
    ensureExec('mako', 'mako');
  } else if (analysis.detected.notifications.includes('swaync')) {
    ensureExec('swaync', 'swaync');
  }

  if (analysis.detected.gtkTools.includes('polkit-gnome')) {
    ensureExec('polkit-gnome', '/usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1');
  }

  if (analysis.detected.bluetoothTools.includes('blueman')) {
    ensureExec('blueman-applet', 'blueman-applet');
  }

  if (analysis.detected.networkManagers.includes('network-manager-applet')) {
    ensureExec('nm-applet', 'nm-applet --indicator');
  }

  if (analysis.detected.hasCliphist) {
    ensureExec('cliphist', 'wl-paste --watch cliphist store');
  }

  if (analysis.detected.lockers.includes('swaylock') && analysis.detected.idleDaemons.includes('swayidle')) {
    ensureExec(
      'swayidle',
      `swayidle -w timeout 300 'swaylock -f' timeout 600 'swaymsg "output * power off"'`
    );
  }

  return {
    ...prev,
    variables: {
      ...prev.variables,
      term: analysis.recommendedTerm,
      menu: analysis.recommendedMenu,
    },
    general: {
      ...prev.general,
      font: analysis.recommendedFont,
    },
    autostart: nextAutostart,
  };
}

export type AppConfigSectionId =
  | 'app-alacritty'
  | 'app-foot'
  | 'app-wofi'
  | 'app-fuzzel'
  | 'app-mako'
  | 'app-swaylock'
  | 'app-gtk';

export interface DetectedConfigurableSection {
  id: AppConfigSectionId;
  label: string;
  packageName: string;
  configPath: string;
}

/**
 * Returns only configurable application sections that correspond to packages actually detected in the analysis.
 */
export function getConfigurableAppsFromAnalysis(
  analysis: PackageAnalysisResult
): DetectedConfigurableSection[] {
  if (analysis.totalPackages === 0) return [];

  const pkgSet = new Set(analysis.packages.map((p) => p.toLowerCase()));
  const sections: DetectedConfigurableSection[] = [];

  if (pkgSet.has('alacritty')) {
    sections.push({
      id: 'app-alacritty',
      label: 'Alacritty',
      packageName: 'alacritty',
      configPath: '~/.config/alacritty/alacritty.toml',
    });
  }

  if (pkgSet.has('foot')) {
    sections.push({
      id: 'app-foot',
      label: 'Foot',
      packageName: 'foot',
      configPath: '~/.config/foot/foot.ini',
    });
  }

  if (pkgSet.has('wofi')) {
    sections.push({
      id: 'app-wofi',
      label: 'Wofi',
      packageName: 'wofi',
      configPath: '~/.config/wofi/style.css',
    });
  }

  if (pkgSet.has('fuzzel')) {
    sections.push({
      id: 'app-fuzzel',
      label: 'Fuzzel',
      packageName: 'fuzzel',
      configPath: '~/.config/fuzzel/fuzzel.ini',
    });
  }

  if (pkgSet.has('mako')) {
    sections.push({
      id: 'app-mako',
      label: 'Mako',
      packageName: 'mako',
      configPath: '~/.config/mako/config',
    });
  }

  const lockerPkg = pkgSet.has('swaylock-effects')
    ? 'swaylock-effects'
    : pkgSet.has('swaylock')
    ? 'swaylock'
    : null;
  if (lockerPkg) {
    sections.push({
      id: 'app-swaylock',
      label: 'Swaylock',
      packageName: lockerPkg,
      configPath: '~/.config/swaylock/config',
    });
  }

  const gtkMatched = ['thunar', 'pavucontrol', 'blueman', 'gtk3', 'polkit-gnome', 'nwg-look'].find(
    (p) => pkgSet.has(p)
  );
  if (gtkMatched) {
    sections.push({
      id: 'app-gtk',
      label: pkgSet.has('thunar') ? 'GTK (Thunar)' : 'GTK 3/4',
      packageName: gtkMatched,
      configPath: '~/.config/gtk-3.0/settings.ini',
    });
  }

  return sections;
}

