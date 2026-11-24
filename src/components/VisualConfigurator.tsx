import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SwayConfigModel } from '../sway/types';
import { COLOR_THEME_PRESETS } from '../sway/presets';
import { WaybarConfigModel } from '../waybar/types';
import { AVAILABLE_WAYBAR_MODULES, WAYBAR_THEME_PRESETS } from '../waybar/presets';
import { BuilderSection } from './SidebarNav';

interface VisualConfiguratorProps {
  section: BuilderSection;
  sway: SwayConfigModel;
  waybar: WaybarConfigModel;
  onUpdateSway: (updater: (prev: SwayConfigModel) => SwayConfigModel) => void;
  onUpdateWaybar: (updater: (prev: WaybarConfigModel) => WaybarConfigModel) => void;
  onApplySyncedTheme: (themeId: string) => void;
}

export const VisualConfigurator: React.FC<VisualConfiguratorProps> = ({
  section,
  sway,
  waybar,
  onUpdateSway,
  onUpdateWaybar,
  onApplySyncedTheme,
}) => {
  const [newBindKeys, setNewBindKeys] = useState('$mod+b');
  const [newBindCmd, setNewBindCmd] = useState('exec firefox');
  const [bindSearch, setBindSearch] = useState('');

  const [newRuleCriteria, setNewRuleCriteria] = useState('[app_id="org.gnome.Calculator"]');
  const [newRuleAction, setNewRuleAction] = useState('floating enable');
  const [newRuleType, setNewRuleType] = useState<'for_window' | 'assign'>('for_window');
  const [newExecCmd, setNewExecCmd] = useState('mako');
  const [newExecAlways, setNewExecAlways] = useState(false);

  const [waybarZoneTarget, setWaybarZoneTarget] = useState<'left' | 'center' | 'right'>('right');

  const inputClass =
    'w-full px-3 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

  if (section === 'general') {
    return (
      <div className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Переменные и поведение окон</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Основные переменные окружения SwayWM, шрифт и механика рамок.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sway-mod" className={labelClass}>
              Модификатор ($mod)
            </label>
            <select
              id="sway-mod"
              value={sway.variables.mod}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, mod: e.target.value },
                }))
              }
              className={inputClass}
            >
              <option value="Mod4">Mod4 (Super / Win)</option>
              <option value="Mod1">Mod1 (Alt)</option>
            </select>
          </div>

          <div>
            <label htmlFor="sway-term" className={labelClass}>
              Терминал ($term)
            </label>
            <input
              id="sway-term"
              type="text"
              value={sway.variables.term}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, term: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="sway-menu" className={labelClass}>
              Лаунчер приложений ($menu)
            </label>
            <input
              id="sway-menu"
              type="text"
              value={sway.variables.menu}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  variables: { ...prev.variables, menu: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sway-font" className={labelClass}>
              Шрифт Pango
            </label>
            <input
              id="sway-font"
              type="text"
              value={sway.general.font}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, font: e.target.value },
                }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-font-size" className={labelClass}>
              Размер шрифта (pt)
            </label>
            <input
              id="sway-font-size"
              type="number"
              min={6}
              max={24}
              value={sway.general.fontSize}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, fontSize: Number(e.target.value) || 10 },
                }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-border-style" className={labelClass}>
              Стиль границ окон (default_border)
            </label>
            <select
              id="sway-border-style"
              value={sway.general.defaultBorder}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    defaultBorder: e.target.value as 'normal' | 'pixel' | 'none',
                  },
                }))
              }
              className={inputClass}
            >
              <option value="pixel">pixel (тонкая рамка без заголовка)</option>
              <option value="normal">normal (рамка + заголовок окна)</option>
              <option value="none">none (без рамок)</option>
            </select>
          </div>

          <div>
            <label htmlFor="sway-border-px" className={labelClass}>
              Толщина рамки (px)
            </label>
            <input
              id="sway-border-px"
              type="number"
              min={0}
              max={10}
              disabled={sway.general.defaultBorder === 'none'}
              value={sway.general.borderThickness}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: { ...prev.general, borderThickness: Number(e.target.value) || 0 },
                }))
              }
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="sway-title-align" className={labelClass}>
              Выравнивание заголовка
            </label>
            <select
              id="sway-title-align"
              value={sway.general.titleAlign}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    titleAlign: e.target.value as 'left' | 'center' | 'right',
                  },
                }))
              }
              className={inputClass}
            >
              <option value="left">По левому краю (left)</option>
              <option value="center">По центру (center)</option>
              <option value="right">По правому краю (right)</option>
            </select>
          </div>

          <div>
            <label htmlFor="sway-focus-mouse" className={labelClass}>
              Фокус по курсору (focus_follows_mouse)
            </label>
            <select
              id="sway-focus-mouse"
              value={sway.general.focusFollowsMouse}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  general: {
                    ...prev.general,
                    focusFollowsMouse: e.target.value as 'yes' | 'no' | 'always',
                  },
                }))
              }
              className={inputClass}
            >
              <option value="yes">yes (при входе в окно)</option>
              <option value="no">no (только по клику/клавиатуре)</option>
              <option value="always">always (всегда)</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'appearance') {
    return (
      <div className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Отступы и единая палитра</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Изменения отступов и цветовой схемы сразу применяются к окнам Sway и панели Waybar.
          </p>
        </div>

        {/* Gaps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gaps-inner" className="text-xs font-medium text-slate-300">
                Внутренние отступы (gaps inner)
              </label>
              <span className="text-xs font-mono text-sky-400 tabular-nums">{sway.gaps.inner}px</span>
            </div>
            <input
              id="gaps-inner"
              type="range"
              min={0}
              max={32}
              value={sway.gaps.inner}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, inner: Number(e.target.value) },
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="gaps-outer" className="text-xs font-medium text-slate-300">
                Внешние отступы (gaps outer)
              </label>
              <span className="text-xs font-mono text-sky-400 tabular-nums">{sway.gaps.outer}px</span>
            </div>
            <input
              id="gaps-outer"
              type="range"
              min={0}
              max={32}
              value={sway.gaps.outer}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: { ...prev.gaps, outer: Number(e.target.value) },
                }))
              }
              className="w-full accent-sky-400"
            />
          </div>

          <div>
            <label htmlFor="smart-gaps" className={labelClass}>
              Умные отступы (smart_gaps)
            </label>
            <select
              id="smart-gaps"
              value={sway.gaps.smartGaps}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: {
                    ...prev.gaps,
                    smartGaps: e.target.value as 'on' | 'off' | 'inverse_outer',
                  },
                }))
              }
              className={inputClass}
            >
              <option value="on">on (убирать при 1 окне)</option>
              <option value="off">off (всегда показывать)</option>
              <option value="inverse_outer">inverse_outer</option>
            </select>
          </div>

          <div>
            <label htmlFor="smart-borders" className={labelClass}>
              Умные рамки (smart_borders)
            </label>
            <select
              id="smart-borders"
              value={sway.gaps.smartBorders}
              onChange={(e) =>
                onUpdateSway((prev) => ({
                  ...prev,
                  gaps: {
                    ...prev.gaps,
                    smartBorders: e.target.value as 'on' | 'off' | 'no_gaps',
                  },
                }))
              }
              className={inputClass}
            >
              <option value="on">on (скрывать при 1 окне)</option>
              <option value="off">off</option>
              <option value="no_gaps">no_gaps</option>
            </select>
          </div>
        </div>

        {/* Synchronized Themes */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">
            Синхронизированные темы (Sway + Waybar)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {COLOR_THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onApplySyncedTheme(preset.id)}
                className="p-3 rounded-lg border border-slate-800 bg-[#090D14] hover:border-sky-400/60 text-left transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-100">{preset.name}</span>
                  <div className="flex items-center gap-1" aria-hidden="true">
                    <span
                      className="w-3 h-3 rounded-sm border border-white/10"
                      style={{ backgroundColor: preset.wallpaper }}
                    />
                    <span
                      className="w-3 h-3 rounded-sm border border-white/10"
                      style={{ backgroundColor: preset.colors.focused.border }}
                    />
                    <span
                      className="w-3 h-3 rounded-sm border border-white/10"
                      style={{ backgroundColor: preset.colors.urgent.border }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Granular Window Border Colors */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">Детальные цвета рамок Sway</h3>
          {(
            [
              { key: 'focused', label: 'Активное окно (client.focused)' },
              { key: 'focusedInactive', label: 'Неактивное в контейнере (focused_inactive)' },
              { key: 'unfocused', label: 'Окно без фокуса (client.unfocused)' },
              { key: 'urgent', label: 'Срочное окно (client.urgent)' },
            ] as const
          ).map((row) => {
            const set = sway.colors[row.key];
            return (
              <div
                key={row.key}
                className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-slate-800/50 last:border-b-0"
              >
                <span className="text-xs text-slate-300">{row.label}</span>
                <div className="flex items-center gap-3">
                  {(
                    [
                      { field: 'border', title: 'Рамка' },
                      { field: 'background', title: 'Фон' },
                      { field: 'text', title: 'Текст' },
                      { field: 'childBorder', title: 'Граница' },
                    ] as const
                  ).map((colField) => (
                    <label key={colField.field} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span>{colField.title}</span>
                      <input
                        type="color"
                        value={set[colField.field]}
                        aria-label={`${row.label} — ${colField.title}`}
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase();
                          onUpdateSway((prev) => ({
                            ...prev,
                            colors: {
                              ...prev.colors,
                              [row.key]: {
                                ...prev.colors[row.key],
                                [colField.field]: val,
                              },
                            },
                          }));
                        }}
                        className="w-6 h-6 rounded bg-transparent border border-slate-700 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section === 'devices') {
    const keyboard = sway.inputs.find((i) => i.identifier.includes('keyboard'));
    const touchpad = sway.inputs.find((i) => i.identifier.includes('touchpad'));
    const mainDisplay = sway.outputs.find((o) => o.name !== '*') ?? sway.outputs[0];
    const bgOutput = sway.outputs.find((o) => o.background);

    return (
      <div className="p-5 space-y-6 overflow-y-auto h-full">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Мониторы и устройства ввода</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Разрешение, масштабирование HiDPI, фон рабочего стола и раскладка клавиатуры.
          </p>
        </div>

        {/* Display Output */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">Дисплей и фон</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="output-name" className={labelClass}>
                Имя выхода (output)
              </label>
              <input
                id="output-name"
                type="text"
                value={mainDisplay?.name ?? 'DP-1'}
                onChange={(e) => {
                  const name = e.target.value;
                  onUpdateSway((prev) => {
                    const nextOutputs = [...prev.outputs];
                    const idx = nextOutputs.findIndex((o) => o.name !== '*');
                    if (idx >= 0) nextOutputs[idx] = { ...nextOutputs[idx], name };
                    else
                      nextOutputs.push({
                        id: 'out-main',
                        name,
                        resolution: '1920x1080',
                        refreshRate: '60Hz',
                        position: '0,0',
                        scale: 1,
                        background: '',
                      });
                    return { ...prev, outputs: nextOutputs };
                  });
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-res" className={labelClass}>
                Разрешение (ШxВ)
              </label>
              <input
                id="output-res"
                type="text"
                value={mainDisplay?.resolution ?? '1920x1080'}
                onChange={(e) => {
                  const resolution = e.target.value;
                  onUpdateSway((prev) => ({
                    ...prev,
                    outputs: prev.outputs.map((o) =>
                      o.id === mainDisplay?.id ? { ...o, resolution } : o
                    ),
                  }));
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-hz" className={labelClass}>
                Частота обновления
              </label>
              <input
                id="output-hz"
                type="text"
                placeholder="144Hz"
                value={mainDisplay?.refreshRate ?? ''}
                onChange={(e) => {
                  const refreshRate = e.target.value;
                  onUpdateSway((prev) => ({
                    ...prev,
                    outputs: prev.outputs.map((o) =>
                      o.id === mainDisplay?.id ? { ...o, refreshRate } : o
                    ),
                  }));
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="output-scale" className={labelClass}>
                Масштаб (scale)
              </label>
              <input
                id="output-scale"
                type="number"
                step="0.25"
                min={0.5}
                max={3}
                value={mainDisplay?.scale ?? 1}
                onChange={(e) => {
                  const scale = Number(e.target.value) || 1;
                  onUpdateSway((prev) => ({
                    ...prev,
                    outputs: prev.outputs.map((o) =>
                      o.id === mainDisplay?.id ? { ...o, scale } : o
                    ),
                  }));
                }}
                className={inputClass}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="output-bg" className={labelClass}>
                Цвет или путь к обоям (output * bg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="Цвет фона рабочего стола"
                  value={
                    bgOutput?.background && /^#[0-9a-fA-F]{6}$/.test(bgOutput.background)
                      ? bgOutput.background
                      : '#0F172A'
                  }
                  onChange={(e) => {
                    const hex = e.target.value.toUpperCase();
                    onUpdateSway((prev) => {
                      const hasStar = prev.outputs.some((o) => o.name === '*');
                      if (hasStar) {
                        return {
                          ...prev,
                          outputs: prev.outputs.map((o) =>
                            o.name === '*' ? { ...o, background: hex } : o
                          ),
                        };
                      }
                      return {
                        ...prev,
                        outputs: [
                          {
                            id: 'out-bg',
                            name: '*',
                            resolution: '',
                            refreshRate: '',
                            position: '',
                            scale: 1,
                            background: hex,
                          },
                          ...prev.outputs,
                        ],
                      };
                    });
                  }}
                  className="w-9 h-9 rounded bg-transparent border border-slate-700 cursor-pointer shrink-0"
                />
                <input
                  id="output-bg"
                  type="text"
                  value={bgOutput?.background ?? '#0F172A'}
                  onChange={(e) => {
                    const background = e.target.value;
                    onUpdateSway((prev) => ({
                      ...prev,
                      outputs: prev.outputs.map((o) =>
                        o.name === '*' ? { ...o, background } : o
                      ),
                    }));
                  }}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard & Touchpad */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-slate-200">Клавиатура и тачпад</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="xkb-layout" className={labelClass}>
                Раскладки (xkb_layout)
              </label>
              <input
                id="xkb-layout"
                type="text"
                value={keyboard?.xkbLayout ?? 'us,ru'}
                onChange={(e) => {
                  const xkbLayout = e.target.value;
                  onUpdateSway((prev) => {
                    const hasKb = prev.inputs.some((i) => i.identifier.includes('keyboard'));
                    if (hasKb) {
                      return {
                        ...prev,
                        inputs: prev.inputs.map((i) =>
                          i.identifier.includes('keyboard') ? { ...i, xkbLayout } : i
                        ),
                      };
                    }
                    return {
                      ...prev,
                      inputs: [
                        ...prev.inputs,
                        {
                          id: 'kb-1',
                          identifier: 'type:keyboard',
                          xkbLayout,
                          xkbVariant: '',
                          xkbOptions: 'grp:alt_shift_toggle',
                          tap: 'disabled',
                          naturalScroll: 'disabled',
                          accelSpeed: 0,
                        },
                      ],
                    };
                  });
                }}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="xkb-options" className={labelClass}>
                Переключение (xkb_options)
              </label>
              <select
                id="xkb-options"
                value={keyboard?.xkbOptions ?? 'grp:alt_shift_toggle'}
                onChange={(e) => {
                  const xkbOptions = e.target.value;
                  onUpdateSway((prev) => ({
                    ...prev,
                    inputs: prev.inputs.map((i) =>
                      i.identifier.includes('keyboard') ? { ...i, xkbOptions } : i
                    ),
                  }));
                }}
                className={inputClass}
              >
                <option value="grp:alt_shift_toggle">Alt + Shift</option>
                <option value="grp:caps_toggle">Caps Lock</option>
                <option value="grp:win_space_toggle">Win + Space</option>
                <option value="grp:ctrl_shift_toggle">Ctrl + Shift</option>
              </select>
            </div>

            <div>
              <label htmlFor="touchpad-tap" className={labelClass}>
                Клик касанием тачпада (tap)
              </label>
              <select
                id="touchpad-tap"
                value={touchpad?.tap ?? 'enabled'}
                onChange={(e) => {
                  const tap = e.target.value as 'enabled' | 'disabled';
                  onUpdateSway((prev) => {
                    const hasTp = prev.inputs.some((i) => i.identifier.includes('touchpad'));
                    if (hasTp) {
                      return {
                        ...prev,
                        inputs: prev.inputs.map((i) =>
                          i.identifier.includes('touchpad') ? { ...i, tap } : i
                        ),
                      };
                    }
                    return {
                      ...prev,
                      inputs: [
                        ...prev.inputs,
                        {
                          id: 'tp-1',
                          identifier: 'type:touchpad',
                          xkbLayout: '',
                          xkbVariant: '',
                          xkbOptions: '',
                          tap,
                          naturalScroll: 'enabled',
                          accelSpeed: 0,
                        },
                      ],
                    };
                  });
                }}
                className={inputClass}
              >
                <option value="enabled">enabled (включён)</option>
                <option value="disabled">disabled (выключен)</option>
              </select>
            </div>

            <div>
              <label htmlFor="touchpad-scroll" className={labelClass}>
                Естественная прокрутка (natural_scroll)
              </label>
              <select
                id="touchpad-scroll"
                value={touchpad?.naturalScroll ?? 'enabled'}
                onChange={(e) => {
                  const naturalScroll = e.target.value as 'enabled' | 'disabled';
                  onUpdateSway((prev) => ({
                    ...prev,
                    inputs: prev.inputs.map((i) =>
                      i.identifier.includes('touchpad') ? { ...i, naturalScroll } : i
                    ),
                  }));
                }}
                className={inputClass}
              >
                <option value="enabled">enabled (включена)</option>
                <option value="disabled">disabled (обычная)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'keybindings') {
    const filtered = sway.keybindings.filter(
      (kb) =>
        kb.keys.toLowerCase().includes(bindSearch.toLowerCase()) ||
        kb.command.toLowerCase().includes(bindSearch.toLowerCase())
    );

    const handleAddBinding = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newBindKeys.trim() || !newBindCmd.trim()) return;
      onUpdateSway((prev) => ({
        ...prev,
        keybindings: [
          ...prev.keybindings,
          {
            id: `bind-${Date.now()}`,
            keys: newBindKeys.trim(),
            command: newBindCmd.trim(),
          },
        ],
      }));
      setNewBindKeys('');
      setNewBindCmd('');
    };

    return (
      <div className="p-5 space-y-5 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-slate-100">Горячие клавиши (bindsym)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Всего {sway.keybindings.length} комбинаций в конфигурации.
            </p>
          </div>
          <input
            type="search"
            aria-label="Поиск горячих клавиш"
            placeholder="Фильтр по клавише или команде..."
            value={bindSearch}
            onChange={(e) => setBindSearch(e.target.value)}
            className="w-56 px-3 py-1.5 text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
          />
        </div>

        {/* Add Keybinding Form */}
        <form onSubmit={handleAddBinding} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-4">
            <label htmlFor="new-bind-keys" className={labelClass}>
              Комбинация
            </label>
            <input
              id="new-bind-keys"
              type="text"
              placeholder="$mod+Shift+x"
              value={newBindKeys}
              onChange={(e) => setNewBindKeys(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-6">
            <label htmlFor="new-bind-cmd" className={labelClass}>
              Команда Sway
            </label>
            <input
              id="new-bind-cmd"
              type="text"
              placeholder="exec firefox"
              value={newBindCmd}
              onChange={(e) => setNewBindCmd(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <button
              type="submit"
              className="w-full py-2 px-3 inline-flex items-center justify-center gap-1 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Добавить
            </button>
          </div>
        </form>

        {/* Table of keybindings */}
        <div className="border border-slate-800/80 rounded-lg overflow-hidden divide-y divide-slate-800/70">
          {filtered.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 text-center">
              Комбинации не найдены.
            </div>
          ) : (
            filtered.map((kb) => (
              <div
                key={kb.id}
                className="px-3 py-2 flex items-center justify-between gap-3 bg-[#090D14] hover:bg-slate-900/60"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="font-mono text-xs text-sky-300 w-36 shrink-0 truncate">
                    {kb.keys}
                  </span>
                  <span className="font-mono text-xs text-slate-300 truncate">{kb.command}</span>
                </div>
                <button
                  type="button"
                  aria-label={`Удалить комбинацию ${kb.keys}`}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      keybindings: prev.keybindings.filter((item) => item.id !== kb.id),
                    }))
                  }
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (section === 'panel') {
    const panelEngine = !sway.bar.enabled
      ? 'none'
      : sway.bar.swaybarCommand === 'waybar'
      ? 'waybar'
      : 'swaybar';

    const toggleModuleInZone = (zone: 'left' | 'center' | 'right', modId: string) => {
      onUpdateWaybar((prev) => {
        const key =
          zone === 'left' ? 'modulesLeft' : zone === 'center' ? 'modulesCenter' : 'modulesRight';
        const list = prev[key];
        const exists = list.includes(modId);
        return {
          ...prev,
          [key]: exists ? list.filter((m) => m !== modId) : [...list, modId],
        };
      });
    };

    return (
      <div className="p-5 space-y-6 overflow-y-auto h-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Панель состояния: Waybar и Swaybar
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Настройте связку SwayWM + Waybar (JSONC + CSS) или встроенный Swaybar.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#090D14] border border-slate-800 rounded-lg">
            {(
              [
                { id: 'waybar', label: 'Waybar' },
                { id: 'swaybar', label: 'Swaybar' },
                { id: 'none', label: 'Без панели' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  if (opt.id === 'none') {
                    onUpdateSway((prev) => ({ ...prev, bar: { ...prev.bar, enabled: false } }));
                  } else {
                    onUpdateSway((prev) => ({
                      ...prev,
                      bar: { ...prev.bar, enabled: true, swaybarCommand: opt.id },
                    }));
                    if (opt.id === 'waybar') {
                      onUpdateWaybar((prev) => ({ ...prev, enabled: true }));
                    }
                  }
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  panelEngine === opt.id
                    ? 'bg-sky-400 text-slate-950 font-semibold'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {panelEngine === 'waybar' && (
          <div className="space-y-6">
            {/* Waybar Geometry */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="wb-pos" className={labelClass}>
                  Позиция
                </label>
                <select
                  id="wb-pos"
                  value={waybar.position}
                  onChange={(e) =>
                    onUpdateWaybar((prev) => ({
                      ...prev,
                      position: e.target.value as 'top' | 'bottom',
                    }))
                  }
                  className={inputClass}
                >
                  <option value="top">top (сверху)</option>
                  <option value="bottom">bottom (снизу)</option>
                </select>
              </div>
              <div>
                <label htmlFor="wb-height" className={labelClass}>
                  Высота (px)
                </label>
                <input
                  id="wb-height"
                  type="number"
                  min={20}
                  max={60}
                  value={waybar.height}
                  onChange={(e) =>
                    onUpdateWaybar((prev) => ({ ...prev, height: Number(e.target.value) || 32 }))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="wb-margin-top" className={labelClass}>
                  Отступ сверху/снизу
                </label>
                <input
                  id="wb-margin-top"
                  type="number"
                  min={0}
                  max={24}
                  value={waybar.position === 'top' ? waybar.marginTop : waybar.marginBottom}
                  onChange={(e) => {
                    const val = Number(e.target.value) || 0;
                    onUpdateWaybar((prev) => ({
                      ...prev,
                      marginTop: prev.position === 'top' ? val : prev.marginTop,
                      marginBottom: prev.position === 'bottom' ? val : prev.marginBottom,
                    }));
                  }}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="wb-bar-radius" className={labelClass}>
                  Скругление панели
                </label>
                <input
                  id="wb-bar-radius"
                  type="number"
                  min={0}
                  max={20}
                  value={waybar.style.barRadius}
                  onChange={(e) =>
                    onUpdateWaybar((prev) => ({
                      ...prev,
                      style: { ...prev.style, barRadius: Number(e.target.value) || 0 },
                    }))
                  }
                  className={inputClass}
                />
              </div>
            </div>

            {/* Waybar Modules Builder */}
            <div className="border-t border-slate-800/80 pt-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-slate-200">
                  Модули Waybar по зонам
                </h3>
                <div className="flex items-center gap-1 p-0.5 bg-[#090D14] border border-slate-800 rounded-md">
                  {(
                    [
                      { id: 'left', label: 'Слева' },
                      { id: 'center', label: 'Центр' },
                      { id: 'right', label: 'Справа' },
                    ] as const
                  ).map((z) => (
                    <button
                      key={z.id}
                      type="button"
                      onClick={() => setWaybarZoneTarget(z.id)}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        waybarZoneTarget === z.id
                          ? 'bg-slate-800 text-sky-300 font-medium'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {z.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_WAYBAR_MODULES.map((mod) => {
                  const zoneList =
                    waybarZoneTarget === 'left'
                      ? waybar.modulesLeft
                      : waybarZoneTarget === 'center'
                      ? waybar.modulesCenter
                      : waybar.modulesRight;
                  const activeInZone = zoneList.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() => toggleModuleInZone(waybarZoneTarget, mod.id)}
                      className={`px-2.5 py-2 rounded-lg border text-left transition-colors ${
                        activeInZone
                          ? 'bg-sky-500/15 border-sky-400/50 text-sky-200'
                          : 'bg-[#090D14] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-mono text-xs truncate">{mod.label}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {mod.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Waybar Module Formats */}
            <div className="border-t border-slate-800/80 pt-5 space-y-3">
              <h3 className="text-xs font-semibold text-slate-200">
                Форматы отображения модулей
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="wb-fmt-clock" className={labelClass}>
                    Часы (clock.format)
                  </label>
                  <input
                    id="wb-fmt-clock"
                    type="text"
                    value={waybar.clockFormat}
                    onChange={(e) =>
                      onUpdateWaybar((prev) => ({ ...prev, clockFormat: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-fmt-cpu" className={labelClass}>
                    Процессор (cpu.format)
                  </label>
                  <input
                    id="wb-fmt-cpu"
                    type="text"
                    value={waybar.cpuFormat}
                    onChange={(e) =>
                      onUpdateWaybar((prev) => ({ ...prev, cpuFormat: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-fmt-mem" className={labelClass}>
                    Память (memory.format)
                  </label>
                  <input
                    id="wb-fmt-mem"
                    type="text"
                    value={waybar.memoryFormat}
                    onChange={(e) =>
                      onUpdateWaybar((prev) => ({ ...prev, memoryFormat: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="wb-fmt-vol" className={labelClass}>
                    Громкость (pulseaudio.format)
                  </label>
                  <input
                    id="wb-fmt-vol"
                    type="text"
                    value={waybar.pulseaudioFormat}
                    onChange={(e) =>
                      onUpdateWaybar((prev) => ({ ...prev, pulseaudioFormat: e.target.value }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Waybar CSS Colors */}
            <div className="border-t border-slate-800/80 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-200">Стиль Waybar (style.css)</h3>
                <select
                  aria-label="Пресет цветов Waybar"
                  onChange={(e) => {
                    const p = WAYBAR_THEME_PRESETS[e.target.value];
                    if (p) {
                      onUpdateWaybar((prev) => ({
                        ...prev,
                        height: p.height,
                        marginTop: p.marginTop,
                        marginLeft: p.marginLeft,
                        marginRight: p.marginRight,
                        spacing: p.spacing,
                        style: { ...p.style },
                      }));
                    }
                  }}
                  defaultValue=""
                  className="px-2.5 py-1 text-xs bg-[#090D14] border border-slate-800 rounded text-slate-300"
                >
                  <option value="" disabled>
                    Применить палитру Waybar...
                  </option>
                  <option value="sway-cobalt">Wayland Cobalt</option>
                  <option value="catppuccin-mocha">Catppuccin Mocha</option>
                  <option value="nord-frost">Nord Frost</option>
                  <option value="gruvbox-dark">Gruvbox Dark</option>
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(
                  [
                    { field: 'background', label: 'Фон панели' },
                    { field: 'moduleBg', label: 'Фон модулей' },
                    { field: 'textColor', label: 'Цвет текста' },
                    { field: 'accentColor', label: 'Активный воркспейс' },
                    { field: 'borderColor', label: 'Рамка панели' },
                    { field: 'urgentColor', label: 'Срочный цвет' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.field}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-800 bg-[#090D14] text-xs text-slate-300"
                  >
                    <span>{item.label}</span>
                    <input
                      type="color"
                      value={waybar.style[item.field]}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        onUpdateWaybar((prev) => ({
                          ...prev,
                          style: { ...prev.style, [item.field]: val },
                        }));
                      }}
                      className="w-6 h-6 bg-transparent border border-slate-700 rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {panelEngine === 'swaybar' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sb-pos" className={labelClass}>
                Позиция Swaybar
              </label>
              <select
                id="sb-pos"
                value={sway.bar.position}
                onChange={(e) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, position: e.target.value as 'top' | 'bottom' },
                  }))
                }
                className={inputClass}
              >
                <option value="top">top (сверху)</option>
                <option value="bottom">bottom (снизу)</option>
              </select>
            </div>
            <div>
              <label htmlFor="sb-height" className={labelClass}>
                Высота (px)
              </label>
              <input
                id="sb-height"
                type="number"
                min={18}
                max={50}
                value={sway.bar.height}
                onChange={(e) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, height: Number(e.target.value) || 26 },
                  }))
                }
                className={inputClass}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="sb-cmd" className={labelClass}>
                Команда статуса (status_command)
              </label>
              <input
                id="sb-cmd"
                type="text"
                value={sway.bar.statusCommand}
                onChange={(e) =>
                  onUpdateSway((prev) => ({
                    ...prev,
                    bar: { ...prev.bar, statusCommand: e.target.value },
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>
        )}

        {panelEngine === 'none' && (
          <div className="p-4 border border-slate-800 rounded-lg bg-[#090D14] text-xs text-slate-400">
            Панель отключена. Вы можете включить Waybar или встроенный Swaybar переключателем выше.
          </div>
        )}
      </div>
    );
  }

  // section === 'rules'
  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-slate-100">Правила окон и автозапуск</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Укажите правила `for_window` / `assign` и фоновые демоны через `exec` / `exec_always`.
        </p>
      </div>

      {/* Add Rule */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-200">Правила окон</h3>
        <div className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-3">
            <label htmlFor="rule-type" className={labelClass}>
              Директива
            </label>
            <select
              id="rule-type"
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as 'for_window' | 'assign')}
              className={inputClass}
            >
              <option value="for_window">for_window</option>
              <option value="assign">assign</option>
            </select>
          </div>
          <div className="col-span-4">
            <label htmlFor="rule-criteria" className={labelClass}>
              Критерий
            </label>
            <input
              id="rule-criteria"
              type="text"
              value={newRuleCriteria}
              onChange={(e) => setNewRuleCriteria(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-3">
            <label htmlFor="rule-action" className={labelClass}>
              Действие
            </label>
            <input
              id="rule-action"
              type="text"
              value={newRuleAction}
              onChange={(e) => setNewRuleAction(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => {
                if (!newRuleCriteria.trim()) return;
                onUpdateSway((prev) => ({
                  ...prev,
                  rules: [
                    ...prev.rules,
                    {
                      id: `rule-${Date.now()}`,
                      type: newRuleType,
                      criteria: newRuleCriteria.trim(),
                      action: newRuleAction.trim(),
                    },
                  ],
                }));
              }}
              className="w-full py-2 px-3 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
            >
              Добавить
            </button>
          </div>
        </div>

        <div className="border border-slate-800/80 rounded-lg divide-y divide-slate-800/70">
          {sway.rules.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">Правила окон пока не добавлены.</div>
          ) : (
            sway.rules.map((r) => (
              <div
                key={r.id}
                className="px-3 py-2 flex items-center justify-between gap-2 bg-[#090D14] text-xs font-mono"
              >
                <div className="truncate text-slate-300">
                  <span className="text-sky-400">{r.type}</span> {r.criteria} {r.action}
                </div>
                <button
                  type="button"
                  aria-label={`Удалить правило ${r.criteria}`}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      rules: prev.rules.filter((item) => item.id !== r.id),
                    }))
                  }
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Autostart */}
      <div className="border-t border-slate-800/80 pt-5 space-y-3">
        <h3 className="text-xs font-semibold text-slate-200">Автозапуск программ</h3>
        <div className="flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="exec-cmd" className={labelClass}>
              Команда
            </label>
            <input
              id="exec-cmd"
              type="text"
              value={newExecCmd}
              onChange={(e) => setNewExecCmd(e.target.value)}
              className={inputClass}
            />
          </div>
          <label className="flex items-center gap-2 py-2 px-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={newExecAlways}
              onChange={(e) => setNewExecAlways(e.target.checked)}
              className="accent-sky-400"
            />
            <span>exec_always</span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (!newExecCmd.trim()) return;
              onUpdateSway((prev) => ({
                ...prev,
                autostart: [
                  ...prev.autostart,
                  { id: `exec-${Date.now()}`, always: newExecAlways, command: newExecCmd.trim() },
                ],
              }));
              setNewExecCmd('');
            }}
            className="py-2 px-4 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors"
          >
            Добавить
          </button>
        </div>

        <div className="border border-slate-800/80 rounded-lg divide-y divide-slate-800/70">
          {sway.autostart.length === 0 ? (
            <div className="p-3 text-xs text-slate-400">Список автозапуска пуст.</div>
          ) : (
            sway.autostart.map((a) => (
              <div
                key={a.id}
                className="px-3 py-2 flex items-center justify-between gap-2 bg-[#090D14] text-xs font-mono"
              >
                <div className="truncate text-slate-300">
                  <span className="text-sky-400">{a.always ? 'exec_always' : 'exec'}</span>{' '}
                  {a.command}
                </div>
                <button
                  type="button"
                  aria-label={`Удалить автозапуск ${a.command}`}
                  onClick={() =>
                    onUpdateSway((prev) => ({
                      ...prev,
                      autostart: prev.autostart.filter((item) => item.id !== a.id),
                    }))
                  }
                  className="p-1 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
