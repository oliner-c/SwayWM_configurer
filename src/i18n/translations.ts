export type AppLang = 'ru' | 'en';

export function tr(lang: AppLang, ru: string, en: string): string {
  return lang === 'en' ? en : ru;
}

export const PRESET_LOCALE_EN: Record<string, { name: string; description: string }> = {
  'sway-cobalt': {
    name: 'Wayland Cobalt',
    description: 'Crisp cool window borders with #38BDF8 sky accent',
  },
  'catppuccin-mocha': {
    name: 'Catppuccin Mocha',
    description: 'Soft pastel dark palette with lavender focus borders',
  },
  'nord-frost': {
    name: 'Nord Frost',
    description: 'Arctic Scandinavian palette with low-contrast frost borders',
  },
  'gruvbox-dark': {
    name: 'Gruvbox Dark',
    description: 'Warm retro palette with amber accents and high legibility',
  },
  'sage-dark': {
    name: 'Sage · Dark',
    description: 'Deep sage wallpaper #242B26, slate islands #2C3438 & cream accent #D0C4A8',
  },
  'sage-light': {
    name: 'Sage · Light',
    description: 'Misty sage canvas #C2CEC1 with forest islands #E6ECE5 / #5B7F63',
  },
};

export const TEMPLATE_LOCALE_EN: Record<string, { name: string; subtitle: string }> = {
  'balanced-desktop': {
    name: 'Balanced Desktop (Waybar)',
    subtitle: 'Super key, foot, wofi, Waybar, 8px gaps, US/RU layout',
  },
  'catppuccin-rice': {
    name: 'Catppuccin Mocha Rice (Waybar)',
    subtitle: '12px gaps, bottom Waybar, soft pastel palette',
  },
  nordic: {
    name: 'Nordic (Waybar)',
    subtitle: 'Arctic Nord palette (#2E3440 / #88C0D0), alacritty, wofi, Waybar, 8px gaps',
  },
  'laptop-hidpi': {
    name: 'HiDPI Laptop + Swaybar',
    subtitle: '1.5x scaling, touchpad gestures, media keys & built-in Swaybar',
  },
  'sage-dark': {
    name: 'Sage · Dark',
    subtitle: 'Alacritty, wofi, Waybar islands (#2C3438 / #908C7C / #D0C4A8), brightnessctl, satty, blueman',
  },
  'sage-light': {
    name: 'Sage · Light',
    subtitle: 'Alacritty, wofi, light Waybar islands (#E6ECE5 / #C5D0C3 / #5B7F63), laptop keybinds',
  },
  'sage-auto': {
    name: 'Sage · Automatic',
    subtitle: 'Alacritty, wofi, Waybar islands with Dark/Light auto-switch (gsettings + darkman)',
  },
};

export const WAYBAR_MODULE_DESC_EN: Record<string, string> = {
  'custom/launcher': 'Application menu button (fuzzel / wofi)',
  'sway/workspaces': 'Sway workspace switcher buttons',
  'sway/mode': 'Active binding mode indicator (resize, etc.)',
  'sway/window': 'Focused window title',
  'sway/language': 'Current keyboard layout',
  clock: 'Clock and date display',
  cpu: 'CPU usage percentage',
  memory: 'System memory (RAM) usage',
  temperature: 'CPU thermal sensor reading',
  network: 'Wi-Fi / Ethernet connection status',
  bluetooth: 'Bluetooth adapter & device status',
  pulseaudio: 'Audio volume (PipeWire / PulseAudio)',
  backlight: 'Display backlight brightness',
  battery: 'Battery charge & status',
  tray: 'System tray icons',
  'custom/power': 'Power & session menu button',
};

export const ANALYZER_FINDING_EN: Record<
  string,
  { title: string; reason: string; recommendation?: string }
> = {
  // Redundant findings
  'net-netctl': {
    title: 'Duplicate network manager (netctl + NetworkManager)',
    reason: 'With NetworkManager active, netctl is usually redundant and may conflict over interfaces.',
    recommendation: 'If you use NetworkManager (nmtui / nmcli / nm-applet), netctl can be safely removed.',
  },
  'net-wifi-daemons': {
    title: 'Two Wi-Fi daemons installed (iwd + wpa_supplicant)',
    reason: 'Arch/CachyOS typically uses either wpa_supplicant (NetworkManager default) or iwd.',
    recommendation: 'Keep only the Wi-Fi backend currently enabled in systemd.',
  },
  'dual-shells': {
    title: 'Two full interactive shell stacks (fish + zsh)',
    reason: 'Separate prompt themes, plugins, and completion suites are installed for both fish and zsh.',
    recommendation: 'Keep your primary shell (echo $SHELL) and remove the unused stack to reduce clutter.',
  },
  'multi-terminals': {
    title: 'Multiple Wayland terminals',
    reason: 'For visual cohesion, configuring a single primary terminal with unified palette and font is cleaner.',
    recommendation: 'Keep your preferred $term in Sway and optionally remove unused terminals.',
  },
  'multi-launchers': {
    title: 'Duplicate application launchers',
    reason: 'Multiple unstyled launchers create a fragmented visual experience.',
    recommendation: 'Pick one $menu launcher and theme its CSS/INI to match Waybar.',
  },
  'multi-browsers': {
    title: 'Multiple browsers installed',
    reason: 'Two full browsers consume significant disk space and update bandwidth.',
    recommendation: 'Remove the backup browser if you primarily use a single one.',
  },
  'multi-editors': {
    title: 'Three terminal editors installed',
    reason: 'One preferred console editor (such as micro or neovim) plus basic nano is usually enough.',
    recommendation: 'Remove any terminal editors you never use.',
  },
  'multi-mirrors': {
    title: 'Duplicate mirror ranking tools (reflector + rate-mirrors)',
    reason: 'CachyOS defaults to cachyos-rate-mirrors / rate-mirrors.',
    recommendation: 'If you do not run reflector manually or via systemd timer, you can remove it.',
  },
  'nvidia-firmware-on-amd': {
    title: 'NVIDIA firmware on an AMD system (linux-firmware-nvidia)',
    reason: 'AMD packages detected with no NVIDIA driver. Often pulled in by the linux-firmware meta-package.',
    recommendation: 'Only remove if splitting linux-firmware, otherwise pacman will re-pull it as a dependency.',
  },
  'heavy-optional': {
    title: 'Large optional suites (review if needed)',
    reason: 'These do not interfere with SwayWM, but use noticeable disk space and update frequency.',
    recommendation: 'Remove only the ones you no longer use.',
  },

  // Missing findings
  'miss-notifications': {
    title: 'Notification daemon (mako or swaync)',
    reason: 'No notification daemon detected — desktop notifications from browsers and apps will not appear.',
  },
  'miss-swaylock': {
    title: 'Screen locker (swaylock)',
    reason: 'Required to lock your laptop screen via keybinding or before suspend.',
  },
  'miss-swayidle': {
    title: 'Idle & auto-lock daemon (swayidle)',
    reason: 'Automatically dims displays and triggers swaylock on idle or lid close.',
  },
  'miss-cliphist': {
    title: 'Clipboard history (cliphist)',
    reason: 'Pairs with wl-clipboard and wofi/fuzzel to recall previous clipboard entries.',
  },
  'miss-qt6-wayland': {
    title: 'Native Qt6 Wayland support (qt6-wayland)',
    reason: 'qt5-wayland or qt6-base is present, but Qt6 apps fall back to blurry XWayland without qt6-wayland.',
  },
  'miss-nm-applet': {
    title: 'Network tray applet (nm-applet)',
    reason: 'Provides a quick Wi-Fi & VPN popup menu right in the Waybar tray.',
  },
  'miss-waybar': {
    title: 'Status bar (waybar)',
    reason: 'Required to display the SwayForge panel and islands layout.',
  },
  'miss-terminal': {
    title: 'Wayland terminal (alacritty)',
    reason: 'No compatible Wayland terminal found for $mod+Return.',
  },
  'miss-launcher': {
    title: 'App launcher (wofi or fuzzel)',
    reason: 'No application launcher found for $mod+d.',
  },
  'miss-grim': {
    title: 'Screenshot utility (grim)',
    reason: 'Core screenshot capture utility for Sway.',
  },
  'miss-slurp': {
    title: 'Region selector (slurp)',
    reason: 'Allows interactive region selection when taking screenshots.',
  },
  'miss-wl-clipboard': {
    title: 'Wayland clipboard (wl-clipboard)',
    reason: 'Needed to copy screenshots and terminal selections to the Wayland clipboard.',
  },
  'miss-brightnessctl': {
    title: 'Backlight control (brightnessctl)',
    reason: 'Required for laptop display brightness hardware keys.',
  },
  'miss-polkit': {
    title: 'Polkit authentication agent (polkit-gnome)',
    reason: 'Allows GUI apps (partition tools, package helpers) to prompt for elevation.',
  },
  'miss-wlsunset': {
    title: 'Night light gamma filter (wlsunset)',
    reason: 'Gently warms display color temperature in the evening.',
  },
  'miss-darkman': {
    title: 'Day/night theme switcher (darkman)',
    reason: 'Automatically toggles Dark/Light mode in the Sage config based on time of day.',
  },
};
