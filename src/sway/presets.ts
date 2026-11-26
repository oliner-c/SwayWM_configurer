import { ColorThemePreset } from './types';

export const COLOR_THEME_PRESETS: ColorThemePreset[] = [
  {
    id: 'sway-cobalt',
    name: 'Wayland Cobalt',
    description: 'Чёткие холодные границы с акцентом #38BDF8',
    wallpaper: '#0F172A',
    colors: {
      focused: {
        border: '#38BDF8',
        background: '#1E293B',
        text: '#F8FAFC',
        indicator: '#7DD3FC',
        childBorder: '#38BDF8',
      },
      focusedInactive: {
        border: '#334155',
        background: '#1E293B',
        text: '#94A3B8',
        indicator: '#475569',
        childBorder: '#334155',
      },
      unfocused: {
        border: '#1E293B',
        background: '#0F172A',
        text: '#64748B',
        indicator: '#1E293B',
        childBorder: '#1E293B',
      },
      urgent: {
        border: '#EF4444',
        background: '#7F1D1D',
        text: '#FEF2F2',
        indicator: '#F87171',
        childBorder: '#EF4444',
      },
    },
    barColors: {
      background: '#0F172A',
      statusline: '#E2E8F0',
      separator: '#334155',
      focusedWorkspaceBorder: '#38BDF8',
      focusedWorkspaceBg: '#1E293B',
      focusedWorkspaceText: '#F8FAFC',
      inactiveWorkspaceBorder: '#0F172A',
      inactiveWorkspaceBg: '#0F172A',
      inactiveWorkspaceText: '#94A3B8',
      urgentWorkspaceBorder: '#EF4444',
      urgentWorkspaceBg: '#991B1B',
      urgentWorkspaceText: '#FFFFFF',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    description: 'Мягкая пастельная тёмная палитра с лавандовым фокусом',
    wallpaper: '#181825',
    colors: {
      focused: {
        border: '#B4BEFE',
        background: '#1E1E2E',
        text: '#CDD6F4',
        indicator: '#F5E0DC',
        childBorder: '#B4BEFE',
      },
      focusedInactive: {
        border: '#45475A',
        background: '#1E1E2E',
        text: '#A6ADC8',
        indicator: '#45475A',
        childBorder: '#45475A',
      },
      unfocused: {
        border: '#313244',
        background: '#181825',
        text: '#6C7086',
        indicator: '#313244',
        childBorder: '#313244',
      },
      urgent: {
        border: '#F38BA8',
        background: '#452433',
        text: '#CDD6F4',
        indicator: '#F38BA8',
        childBorder: '#F38BA8',
      },
    },
    barColors: {
      background: '#1E1E2E',
      statusline: '#CDD6F4',
      separator: '#45475A',
      focusedWorkspaceBorder: '#B4BEFE',
      focusedWorkspaceBg: '#313244',
      focusedWorkspaceText: '#CDD6F4',
      inactiveWorkspaceBorder: '#1E1E2E',
      inactiveWorkspaceBg: '#1E1E2E',
      inactiveWorkspaceText: '#7F849C',
      urgentWorkspaceBorder: '#F38BA8',
      urgentWorkspaceBg: '#F38BA8',
      urgentWorkspaceText: '#11111B',
    },
  },
  {
    id: 'nord-frost',
    name: 'Nord Frost',
    description: 'Арктическая скандинавская палитра с низким контрастом границ',
    wallpaper: '#2E3440',
    colors: {
      focused: {
        border: '#88C0D0',
        background: '#3B4252',
        text: '#ECEFF4',
        indicator: '#8FBCBB',
        childBorder: '#88C0D0',
      },
      focusedInactive: {
        border: '#4C566A',
        background: '#3B4252',
        text: '#D8DEE9',
        indicator: '#4C566A',
        childBorder: '#4C566A',
      },
      unfocused: {
        border: '#2E3440',
        background: '#2E3440',
        text: '#81A1C1',
        indicator: '#2E3440',
        childBorder: '#2E3440',
      },
      urgent: {
        border: '#BF616A',
        background: '#BF616A',
        text: '#ECEFF4',
        indicator: '#D08770',
        childBorder: '#BF616A',
      },
    },
    barColors: {
      background: '#2E3440',
      statusline: '#ECEFF4',
      separator: '#4C566A',
      focusedWorkspaceBorder: '#88C0D0',
      focusedWorkspaceBg: '#434C5E',
      focusedWorkspaceText: '#ECEFF4',
      inactiveWorkspaceBorder: '#2E3440',
      inactiveWorkspaceBg: '#2E3440',
      inactiveWorkspaceText: '#D8DEE9',
      urgentWorkspaceBorder: '#BF616A',
      urgentWorkspaceBg: '#BF616A',
      urgentWorkspaceText: '#ECEFF4',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    description: 'Тёплая ретро-палитра с янтарным акцентом и высокой читаемостью',
    wallpaper: '#1D2021',
    colors: {
      focused: {
        border: '#D79921',
        background: '#3C3836',
        text: '#EBDBB2',
        indicator: '#FABD2F',
        childBorder: '#D79921',
      },
      focusedInactive: {
        border: '#504945',
        background: '#282828',
        text: '#A89984',
        indicator: '#504945',
        childBorder: '#504945',
      },
      unfocused: {
        border: '#282828',
        background: '#1D2021',
        text: '#928374',
        indicator: '#282828',
        childBorder: '#282828',
      },
      urgent: {
        border: '#CC241D',
        background: '#9D0006',
        text: '#FBF1C7',
        indicator: '#FB4934',
        childBorder: '#CC241D',
      },
    },
    barColors: {
      background: '#282828',
      statusline: '#EBDBB2',
      separator: '#504945',
      focusedWorkspaceBorder: '#D79921',
      focusedWorkspaceBg: '#3C3836',
      focusedWorkspaceText: '#FBF1C7',
      inactiveWorkspaceBorder: '#282828',
      inactiveWorkspaceBg: '#282828',
      inactiveWorkspaceText: '#A89984',
      urgentWorkspaceBorder: '#CC241D',
      urgentWorkspaceBg: '#CC241D',
      urgentWorkspaceText: '#FBF1C7',
    },
  },
  {
    id: 'sage-dark',
    name: 'Шалфей · Dark',
    description: 'Тёмный шалфейный фон #242B26, графитовые островки #2C3438 и кремовый акцент #D0C4A8',
    wallpaper: '#242B26',
    colors: {
      focused: {
        border: '#D0C4A8',
        background: '#2C3438',
        text: '#EDF0EC',
        indicator: '#908C7C',
        childBorder: '#D0C4A8',
      },
      focusedInactive: {
        border: '#49524C',
        background: '#252C28',
        text: '#AEB6AE',
        indicator: '#5D665F',
        childBorder: '#49524C',
      },
      unfocused: {
        border: '#2E3631',
        background: '#1E2420',
        text: '#7D877E',
        indicator: '#2E3631',
        childBorder: '#2E3631',
      },
      urgent: {
        border: '#D4776B',
        background: '#522B27',
        text: '#FDF2F0',
        indicator: '#E08B7F',
        childBorder: '#D4776B',
      },
    },
    barColors: {
      background: '#2C3438',
      statusline: '#D8DDD9',
      separator: '#404448',
      focusedWorkspaceBorder: '#D0C4A8',
      focusedWorkspaceBg: '#D0C4A8',
      focusedWorkspaceText: '#1C2124',
      inactiveWorkspaceBorder: '#2C3438',
      inactiveWorkspaceBg: '#3A4246',
      inactiveWorkspaceText: '#D8DDD9',
      urgentWorkspaceBorder: '#D4776B',
      urgentWorkspaceBg: '#D4776B',
      urgentWorkspaceText: '#FFFFFF',
    },
  },
  {
    id: 'sage-light',
    name: 'Шалфей · Light',
    description: 'Светлый туманно-шалфейный фон #C2CEC1 с лесными островками #E6ECE5 / #5B7F63',
    wallpaper: '#C2CEC1',
    colors: {
      focused: {
        border: '#5B7F63',
        background: '#DDE6DC',
        text: '#1E2620',
        indicator: '#769A7E',
        childBorder: '#5B7F63',
      },
      focusedInactive: {
        border: '#A9B7A8',
        background: '#D5DFD4',
        text: '#465448',
        indicator: '#95A595',
        childBorder: '#A9B7A8',
      },
      unfocused: {
        border: '#B8C4B6',
        background: '#C8D3C6',
        text: '#5D6C5F',
        indicator: '#B8C4B6',
        childBorder: '#B8C4B6',
      },
      urgent: {
        border: '#C2594E',
        background: '#F5DCD9',
        text: '#54201B',
        indicator: '#D46D62',
        childBorder: '#C2594E',
      },
    },
    barColors: {
      background: '#E6ECE5',
      statusline: '#1E2620',
      separator: '#B5C2B4',
      focusedWorkspaceBorder: '#5B7F63',
      focusedWorkspaceBg: '#5B7F63',
      focusedWorkspaceText: '#F8FAF8',
      inactiveWorkspaceBorder: '#E6ECE5',
      inactiveWorkspaceBg: '#D4DDD2',
      inactiveWorkspaceText: '#1E2620',
      urgentWorkspaceBorder: '#C2594E',
      urgentWorkspaceBg: '#C2594E',
      urgentWorkspaceText: '#FFFFFF',
    },
  },
];

export interface ConfigTemplate {
  id: string;
  themeId: string;
  mode?: 'Dark' | 'Light' | 'Automatic';
  swatches?: [string, string, string];
  name: string;
  subtitle: string;
  config: string;
}

export function buildSageSwayConfig(variant: 'dark' | 'light' | 'auto', resolvedDark = true): string {
  const isDark = variant === 'dark' || (variant === 'auto' && resolvedDark);
  const title =
    variant === 'dark'
      ? 'Шалфей (Dark)'
      : variant === 'light'
      ? 'Шалфей (Light)'
      : 'Шалфей (Automatic Dark/Light)';

  const colorsBlock = isDark
    ? `### Цвета окон (Шалфей · Dark)
client.focused          #D0C4A8 #2C3438 #EDF0EC #908C7C #D0C4A8
client.focused_inactive #49524C #252C28 #AEB6AE #5D665F #49524C
client.unfocused        #2E3631 #1E2420 #7D877E #2E3631 #2E3631
client.urgent           #D4776B #522B27 #FDF2F0 #E08B7F #D4776B

### Мониторы
output * bg #242B26 solid_color`
    : `### Цвета окон (Шалфей · Light)
client.focused          #5B7F63 #DDE6DC #1E2620 #769A7E #5B7F63
client.focused_inactive #A9B7A8 #D5DFD4 #465448 #95A595 #A9B7A8
client.unfocused        #B8C4B6 #C8D3C6 #5D6C5F #B8C4B6 #B8C4B6
client.urgent           #C2594E #F5DCD9 #54201B #D46D62 #C2594E

### Мониторы
output * bg #C2CEC1 solid_color`;

  const autoExec =
    variant === 'auto'
      ? `
# Автопереключение Dark/Light (опционально установите darkman)
exec_always sh -c 'command -v darkman >/dev/null 2>&1 && darkman run || true'
exec gsettings set org.gnome.desktop.interface color-scheme ${isDark ? 'prefer-dark' : 'prefer-light'}`
      : variant === 'dark'
      ? `
exec gsettings set org.gnome.desktop.interface color-scheme prefer-dark`
      : `
exec gsettings set org.gnome.desktop.interface color-scheme prefer-light`;

  return `# SwayWM Configuration — ${title} (подобрано под установленные пакеты)

### Переменные
set $mod Mod4
set $left h
set $down j
set $up k
set $right l
set $term alacritty
set $menu wofi --show drun

### Шрифт и поведение окон
font pango:JetBrainsMono Nerd Font 10
default_border pixel 2
title_align center
focus_follows_mouse yes
floating_modifier $mod normal

### Отступы
gaps inner 10
gaps outer 4
smart_gaps on
smart_borders on

${colorsBlock}
output eDP-1 scale 1

### Устройства ввода
input type:keyboard {
    xkb_layout us,ru
    xkb_options grp:alt_shift_toggle
}

input type:touchpad {
    tap enabled
    natural_scroll enabled
    dwt enabled
}

### Горячие клавиши
bindsym $mod+Return exec $term
bindsym $mod+d exec $menu
bindsym $mod+e exec thunar
bindsym $mod+Shift+q kill
bindsym $mod+Shift+c reload
bindsym $mod+Shift+e exit
bindsym $mod+f fullscreen toggle
bindsym $mod+Shift+space floating toggle
bindsym $mod+space focus mode_toggle
bindsym $mod+$left focus left
bindsym $mod+$down focus down
bindsym $mod+$up focus up
bindsym $mod+$right focus right
bindsym $mod+1 workspace number 1
bindsym $mod+2 workspace number 2
bindsym $mod+3 workspace number 3
bindsym $mod+4 workspace number 4
bindsym $mod+5 workspace number 5
bindsym $mod+Shift+1 move container to workspace number 1
bindsym $mod+Shift+2 move container to workspace number 2
bindsym $mod+Shift+3 move container to workspace number 3
bindsym $mod+Shift+4 move container to workspace number 4
bindsym $mod+Shift+5 move container to workspace number 5

### Мультимедиа, яркость и скриншоты (wireplumber, playerctl, brightnessctl, grim+slurp+satty)
bindsym --locked XF86AudioRaiseVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
bindsym --locked XF86AudioLowerVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindsym --locked XF86AudioMute exec wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
bindsym --locked XF86AudioPlay exec playerctl play-pause
bindsym --locked XF86AudioNext exec playerctl next
bindsym --locked XF86AudioPrev exec playerctl previous
bindsym XF86MonBrightnessUp exec brightnessctl set +5%
bindsym XF86MonBrightnessDown exec brightnessctl set 5%-
bindsym Print exec grim -g "$(slurp)" - | wl-copy
bindsym $mod+Shift+s exec grim -g "$(slurp)" - | satty --filename -

### Правила окон и автозапуск
for_window [app_id="pavucontrol"] floating enable
for_window [app_id="blueman-manager"] floating enable
for_window [app_id="satty"] floating enable
exec dbus-update-activation-environment --systemd WAYLAND_DISPLAY XDG_CURRENT_DESKTOP=sway
exec /usr/lib/polkit-gnome/polkit-gnome-authentication-agent-1
exec blueman-applet${autoExec}

### Панель состояния (Waybar)
bar {
    swaybar_command waybar
}
`;
}

export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'balanced-desktop',
    themeId: 'sway-cobalt',
    name: 'Сбалансированный десктоп (Waybar)',
    subtitle: 'Super-клавиша, foot, wofi, Waybar, отступы 8px, US/RU',
    config: `# SwayWM Configuration — Сбалансированный десктоп

### Переменные
set $mod Mod4
set $left h
set $down j
set $up k
set $right l
set $term foot
set $menu wofi --show drun

### Шрифт и поведение окон
font pango:JetBrains Mono 10
default_border pixel 2
title_align center
focus_follows_mouse yes
floating_modifier $mod normal

### Отступы
gaps inner 8
gaps outer 4
smart_gaps on
smart_borders on

### Цвета окон (Wayland Cobalt)
client.focused          #38BDF8 #1E293B #F8FAFC #7DD3FC #38BDF8
client.focused_inactive #334155 #1E293B #94A3B8 #475569 #334155
client.unfocused        #1E293B #0F172A #64748B #1E293B #1E293B
client.urgent           #EF4444 #7F1D1D #FEF2F2 #F87171 #EF4444

### Мониторы
output * bg #0F172A solid_color
output DP-1 resolution 1920x1080@144Hz position 0,0 scale 1

### Устройства ввода
input type:keyboard {
    xkb_layout us,ru
    xkb_options grp:alt_shift_toggle
}

input type:touchpad {
    tap enabled
    natural_scroll enabled
}

### Горячие клавиши
bindsym $mod+Return exec $term
bindsym $mod+d exec $menu
bindsym $mod+Shift+q kill
bindsym $mod+Shift+c reload
bindsym $mod+Shift+e exit
bindsym $mod+f fullscreen toggle
bindsym $mod+Shift+space floating toggle
bindsym $mod+space focus mode_toggle
bindsym $mod+$left focus left
bindsym $mod+$down focus down
bindsym $mod+$up focus up
bindsym $mod+$right focus right
bindsym $mod+1 workspace number 1
bindsym $mod+2 workspace number 2
bindsym $mod+3 workspace number 3
bindsym $mod+4 workspace number 4
bindsym $mod+Shift+1 move container to workspace number 1
bindsym $mod+Shift+2 move container to workspace number 2
bindsym $mod+Shift+3 move container to workspace number 3
bindsym $mod+Shift+4 move container to workspace number 4

### Правила окон и автозапуск
for_window [app_id="pavucontrol"] floating enable
for_window [window_role="dialog"] floating enable
assign [app_id="firefox"] workspace number 2
exec mako
exec wl-paste --watch cliphist store

### Панель состояния (Waybar / Swaybar)
bar {
    swaybar_command waybar
}
`,
  },
  {
    id: 'catppuccin-rice',
    themeId: 'catppuccin-mocha',
    name: 'Catppuccin Mocha Rice (Waybar)',
    subtitle: 'Мягкие отступы 12px, нижний Waybar, пастельная палитра',
    config: `# SwayWM Configuration — Catppuccin Mocha

### Переменные
set $mod Mod4
set $left h
set $down j
set $up k
set $right l
set $term alacritty
set $menu fuzzel

### Шрифт и поведение окон
font pango:Plus Jakarta Sans 10
default_border pixel 2
title_align center
focus_follows_mouse no
floating_modifier $mod normal

### Отступы
gaps inner 12
gaps outer 6
smart_gaps off
smart_borders on

### Цвета окон (Catppuccin Mocha)
client.focused          #B4BEFE #1E1E2E #CDD6F4 #F5E0DC #B4BEFE
client.focused_inactive #45475A #1E1E2E #A6ADC8 #45475A #45475A
client.unfocused        #313244 #181825 #6C7086 #313244 #313244
client.urgent           #F38BA8 #452433 #CDD6F4 #F38BA8 #F38BA8

### Мониторы
output * bg #181825 solid_color
output HDMI-A-1 resolution 2560x1440@120Hz position 0,0 scale 1

### Устройства ввода
input type:keyboard {
    xkb_layout us,ru
    xkb_options grp:caps_toggle
}

### Горячие клавиши
bindsym $mod+Return exec $term
bindsym $mod+d exec $menu
bindsym $mod+q kill
bindsym $mod+Shift+r reload
bindsym $mod+f fullscreen toggle
bindsym $mod+v floating toggle
bindsym $mod+1 workspace number 1
bindsym $mod+2 workspace number 2
bindsym $mod+3 workspace number 3
bindsym $mod+4 workspace number 4

### Правила окон и автозапуск
for_window [app_id="org.gnome.Calculator"] floating enable

### Панель состояния (Waybar / Swaybar)
bar {
    swaybar_command waybar
}
`,
  },
  {
    id: 'nordic',
    themeId: 'nord-frost',
    swatches: ['#2E3440', '#3B4252', '#88C0D0'],
    name: 'Nordic (Waybar)',
    subtitle: 'Арктическая палитра Nord (#2E3440 / #88C0D0), alacritty, wofi, Waybar, отступы 8px',
    config: `# SwayWM Configuration — Nordic

### Переменные
set $mod Mod4
set $left h
set $down j
set $up k
set $right l
set $term alacritty
set $menu wofi --show drun

### Шрифт и поведение окон
font pango:JetBrainsMono Nerd Font 10
default_border pixel 2
title_align center
focus_follows_mouse yes
floating_modifier $mod normal

### Отступы
gaps inner 8
gaps outer 4
smart_gaps on
smart_borders on

### Цвета окон (Nord Frost)
client.focused          #88C0D0 #3B4252 #ECEFF4 #8FBCBB #88C0D0
client.focused_inactive #4C566A #3B4252 #D8DEE9 #4C566A #4C566A
client.unfocused        #2E3440 #2E3440 #81A1C1 #2E3440 #2E3440
client.urgent           #BF616A #BF616A #ECEFF4 #D08770 #BF616A

### Мониторы
output * bg #2E3440 solid_color
output eDP-1 resolution 1920x1080@60Hz position 0,0 scale 1

### Устройства ввода
input type:keyboard {
    xkb_layout us,ru
    xkb_options grp:alt_shift_toggle
}

input type:touchpad {
    tap enabled
    natural_scroll enabled
    dwt enabled
}

### Горячие клавиши
bindsym $mod+Return exec $term
bindsym $mod+d exec $menu
bindsym $mod+Shift+q kill
bindsym $mod+Shift+c reload
bindsym $mod+Shift+e exit
bindsym $mod+f fullscreen toggle
bindsym $mod+Shift+space floating toggle
bindsym $mod+space focus mode_toggle
bindsym $mod+$left focus left
bindsym $mod+$down focus down
bindsym $mod+$up focus up
bindsym $mod+$right focus right
bindsym $mod+1 workspace number 1
bindsym $mod+2 workspace number 2
bindsym $mod+3 workspace number 3
bindsym $mod+4 workspace number 4
bindsym $mod+5 workspace number 5
bindsym $mod+Shift+1 move container to workspace number 1
bindsym $mod+Shift+2 move container to workspace number 2
bindsym $mod+Shift+3 move container to workspace number 3
bindsym $mod+Shift+4 move container to workspace number 4
bindsym $mod+Shift+5 move container to workspace number 5
bindsym --locked XF86AudioRaiseVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
bindsym --locked XF86AudioLowerVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindsym --locked XF86AudioMute exec wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
bindsym XF86MonBrightnessUp exec brightnessctl set +5%
bindsym XF86MonBrightnessDown exec brightnessctl set 5%-
bindsym Print exec grim -g "$(slurp)" - | wl-copy

### Правила окон и автозапуск
for_window [app_id="pavucontrol"] floating enable
for_window [window_role="dialog"] floating enable
exec mako
exec wl-paste --watch cliphist store

### Панель состояния (Waybar)
bar {
    swaybar_command waybar
}
`,
  },
  {
    id: 'laptop-hidpi',
    themeId: 'nord-frost',
    name: 'Ноутбук HiDPI + Swaybar',
    subtitle: 'Масштаб 1.5x, тачпад, кнопки громкости и встроенный Swaybar',
    config: `# SwayWM Configuration — Ноутбук HiDPI

### Переменные
set $mod Mod4
set $left h
set $down j
set $up k
set $right l
set $term kitty
set $menu fuzzel

### Шрифт и поведение окон
font pango:JetBrains Mono 11
default_border pixel 2
title_align left
focus_follows_mouse yes
floating_modifier $mod normal

### Отступы
gaps inner 6
gaps outer 2
smart_gaps on
smart_borders on

### Цвета окон (Nord Frost)
client.focused          #88C0D0 #3B4252 #ECEFF4 #8FBCBB #88C0D0
client.focused_inactive #4C566A #3B4252 #D8DEE9 #4C566A #4C566A
client.unfocused        #2E3440 #2E3440 #81A1C1 #2E3440 #2E3440
client.urgent           #BF616A #BF616A #ECEFF4 #D08770 #BF616A

### Мониторы
output * bg #2E3440 solid_color
output eDP-1 resolution 2880x1800@90Hz position 0,0 scale 1.5

### Устройства ввода
input type:keyboard {
    xkb_layout us,ru
    xkb_options grp:win_space_toggle
}

input type:touchpad {
    tap enabled
    natural_scroll enabled
}

### Горячие клавиши
bindsym $mod+Return exec $term
bindsym $mod+d exec $menu
bindsym $mod+Shift+q kill
bindsym XF86AudioRaiseVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
bindsym XF86AudioLowerVolume exec wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%-
bindsym XF86AudioMute exec wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
bindsym XF86MonBrightnessUp exec brightnessctl set +5%
bindsym XF86MonBrightnessDown exec brightnessctl set 5%-
bindsym Print exec grim -g "$(slurp)" - | wl-copy
bindsym $mod+1 workspace number 1
bindsym $mod+2 workspace number 2
bindsym $mod+3 workspace number 3

### Автозапуск
exec swayidle -w timeout 300 'swaylock -f' timeout 600 'swaymsg "output * power off"'

### Панель состояния (Waybar / Swaybar)
bar {
    position top
    status_command while date +'%H:%M · %d %b'; do sleep 5; done
    font pango:JetBrains Mono 10
    height 26
    colors {
        background #2E3440
        statusline #ECEFF4
        separator #4C566A
        focused_workspace  #88C0D0 #434C5E #ECEFF4
        inactive_workspace #2E3440 #2E3440 #D8DEE9
        urgent_workspace   #BF616A #BF616A #ECEFF4
    }
}
`,
  },
  {
    id: 'sage-dark',
    themeId: 'sage-dark',
    mode: 'Dark',
    swatches: ['#2C3438', '#908C7C', '#D0C4A8'],
    name: 'Шалфей · Dark',
    subtitle: 'Alacritty, wofi, Waybar островки (#2C3438 / #908C7C / #D0C4A8), brightnessctl, satty, blueman',
    config: buildSageSwayConfig('dark', true),
  },
  {
    id: 'sage-light',
    themeId: 'sage-light',
    mode: 'Light',
    swatches: ['#C2CEC1', '#E6ECE5', '#5B7F63'],
    name: 'Шалфей · Light',
    subtitle: 'Alacritty, wofi, светлые островки Waybar (#E6ECE5 / #C5D0C3 / #5B7F63), ноутбук-бинды',
    config: buildSageSwayConfig('light', false),
  },
  {
    id: 'sage-auto',
    themeId: 'sage-auto',
    mode: 'Automatic',
    swatches: ['#2C3438', '#908C7C', '#C2CEC1'],
    name: 'Шалфей · Automatic',
    subtitle: 'Alacritty, wofi, островки Waybar с автопереключением Dark/Light (gsettings + darkman)',
    config: buildSageSwayConfig('auto', true),
  },
];
