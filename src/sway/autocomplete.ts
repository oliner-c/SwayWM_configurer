export interface AutocompleteItem {
  label: string;
  insertText: string;
  category: 'directive' | 'variable' | 'key' | 'command' | 'option';
  detail: string;
  documentation: string;
}

export const TOP_LEVEL_SUGGESTIONS: AutocompleteItem[] = [
  {
    label: 'set',
    insertText: 'set $name value',
    category: 'directive',
    detail: 'Переменная',
    documentation: 'Объявляет переменную Sway (например, set $mod Mod4).',
  },
  {
    label: 'bindsym',
    insertText: 'bindsym $mod+Return exec $term',
    category: 'directive',
    detail: 'Горячая клавиша',
    documentation: 'Привязывает комбинацию клавиш к команде Sway или запуску программы.',
  },
  {
    label: 'gaps inner',
    insertText: 'gaps inner 8',
    category: 'directive',
    detail: 'Внутренние отступы',
    documentation: 'Устанавливает отступ между соседними окнами в пикселях.',
  },
  {
    label: 'gaps outer',
    insertText: 'gaps outer 4',
    category: 'directive',
    detail: 'Внешние отступы',
    documentation: 'Устанавливает отступ от окон до краёв экрана.',
  },
  {
    label: 'smart_gaps',
    insertText: 'smart_gaps on',
    category: 'directive',
    detail: 'Умные отступы',
    documentation: 'Отключает отступы, когда на рабочем столе открыто только одно окно.',
  },
  {
    label: 'smart_borders',
    insertText: 'smart_borders on',
    category: 'directive',
    detail: 'Умные рамки',
    documentation: 'Скрывает рамки окна, если оно единственное на рабочем пространстве.',
  },
  {
    label: 'default_border',
    insertText: 'default_border pixel 2',
    category: 'directive',
    detail: 'Стиль рамок',
    documentation: 'Задаёт стиль границ новых окон: normal, pixel <px> или none.',
  },
  {
    label: 'client.focused',
    insertText: 'client.focused #38BDF8 #1E293B #F8FAFC #7DD3FC #38BDF8',
    category: 'directive',
    detail: 'Цвета активного окна',
    documentation: 'Цвета рамки, фона заголовка, текста, индикатора сплита и дочерней рамки.',
  },
  {
    label: 'client.unfocused',
    insertText: 'client.unfocused #1E293B #0F172A #64748B #1E293B #1E293B',
    category: 'directive',
    detail: 'Цвета неактивного окна',
    documentation: 'Палитра окон, не находящихся в фокусе.',
  },
  {
    label: 'client.urgent',
    insertText: 'client.urgent #EF4444 #7F1D1D #FEF2F2 #F87171 #EF4444',
    category: 'directive',
    detail: 'Цвета срочного окна',
    documentation: 'Подсветка окна, требующего внимания (urgency hint).',
  },
  {
    label: 'output',
    insertText: 'output * resolution 1920x1080@60Hz position 0,0 scale 1',
    category: 'directive',
    detail: 'Монитор и обои',
    documentation: 'Настройка разрешения, частоты, масштаба, позиции и фона экрана.',
  },
  {
    label: 'input',
    insertText: 'input type:keyboard {\n    xkb_layout us,ru\n    xkb_options grp:alt_shift_toggle\n}',
    category: 'directive',
    detail: 'Клавиатура / тачпад',
    documentation: 'Блок конфигурации устройств ввода Wayland.',
  },
  {
    label: 'for_window',
    insertText: 'for_window [app_id="pavucontrol"] floating enable',
    category: 'directive',
    detail: 'Правило окна',
    documentation: 'Применяет команду к окнам, подходящим под критерии (app_id, class, title).',
  },
  {
    label: 'assign',
    insertText: 'assign [app_id="firefox"] workspace number 2',
    category: 'directive',
    detail: 'Привязка к воркспейсу',
    documentation: 'Автоматически отправляет окно приложения на указанное рабочее пространство.',
  },
  {
    label: 'exec',
    insertText: 'exec mako',
    category: 'directive',
    detail: 'Автозапуск',
    documentation: 'Запускает команду один раз при старте Sway.',
  },
  {
    label: 'exec_always',
    insertText: 'exec_always pkill waybar; waybar',
    category: 'directive',
    detail: 'Перезапуск при reload',
    documentation: 'Запускает команду при старте и при каждом reload конфигурации.',
  },
  {
    label: 'bar',
    insertText: 'bar {\n    position top\n    status_command i3status\n}',
    category: 'directive',
    detail: 'Панель состояния',
    documentation: 'Конфигурация встроенной панели swaybar.',
  },
  {
    label: 'font',
    insertText: 'font pango:JetBrains Mono 10',
    category: 'directive',
    detail: 'Шрифт',
    documentation: 'Шрифт заголовков окон и панели swaybar.',
  },
  {
    label: 'focus_follows_mouse',
    insertText: 'focus_follows_mouse yes',
    category: 'directive',
    detail: 'Фокус по курсору',
    documentation: 'Определяет, следует ли фокус окна за движением курсора (yes/no/always).',
  },
  {
    label: 'floating_modifier',
    insertText: 'floating_modifier $mod normal',
    category: 'directive',
    detail: 'Модификатор плавающих окон',
    documentation: 'Клавиша для перемещения и ресайза плавающих окон мышью.',
  },
  {
    label: 'title_align',
    insertText: 'title_align center',
    category: 'directive',
    detail: 'Выравнивание заголовка',
    documentation: 'Выравнивание текста в заголовке окна: left, center, right.',
  },
];

const BAR_SUGGESTIONS: AutocompleteItem[] = [
  { label: 'position', insertText: 'position top', category: 'option', detail: 'Позиция панели', documentation: 'top или bottom' },
  { label: 'status_command', insertText: 'status_command i3status', category: 'option', detail: 'Команда статуса', documentation: 'Скрипт или утилита вывода текста в правую часть панели' },
  { label: 'font', insertText: 'font pango:JetBrains Mono 10', category: 'option', detail: 'Шрифт панели', documentation: 'Pango-шрифт для swaybar' },
  { label: 'height', insertText: 'height 28', category: 'option', detail: 'Высота (px)', documentation: 'Фиксированная высота панели в пикселях' },
  { label: 'tray_output', insertText: 'tray_output primary', category: 'option', detail: 'Системный трей', documentation: 'Вывод трея: primary, none или имя монитора' },
  { label: 'workspace_buttons', insertText: 'workspace_buttons yes', category: 'option', detail: 'Кнопки рабочих столов', documentation: 'Показывать или скрывать номера воркспейсов' },
  { label: 'colors', insertText: 'colors {\n        background #0F172A\n        statusline #E2E8F0\n    }', category: 'option', detail: 'Блок цветов панели', documentation: 'Настройка цветов фона, текста и воркспейсов' },
];

const INPUT_SUGGESTIONS: AutocompleteItem[] = [
  { label: 'xkb_layout', insertText: 'xkb_layout us,ru', category: 'option', detail: 'Раскладки клавиатуры', documentation: 'Список раскладок через запятую' },
  { label: 'xkb_options', insertText: 'xkb_options grp:alt_shift_toggle', category: 'option', detail: 'Опции XKB', documentation: 'Комбинация переключения раскладки (grp:alt_shift_toggle, grp:caps_toggle)' },
  { label: 'xkb_variant', insertText: 'xkb_variant ', category: 'option', detail: 'Вариант раскладки', documentation: 'Например: winkeys или dvorak' },
  { label: 'tap', insertText: 'tap enabled', category: 'option', detail: 'Тап по тачпаду', documentation: 'enabled или disabled' },
  { label: 'natural_scroll', insertText: 'natural_scroll enabled', category: 'option', detail: 'Естественная прокрутка', documentation: 'enabled или disabled' },
  { label: 'dwt', insertText: 'dwt enabled', category: 'option', detail: 'Disable while typing', documentation: 'Отключать тачпад при наборе текста' },
  { label: 'pointer_accel', insertText: 'pointer_accel 0.2', category: 'option', detail: 'Ускорение указателя', documentation: 'Значение от -1.0 до 1.0' },
  { label: 'repeat_delay', insertText: 'repeat_delay 300', category: 'option', detail: 'Задержка повтора (мс)', documentation: 'Задержка перед автоповтором клавиши' },
  { label: 'repeat_rate', insertText: 'repeat_rate 40', category: 'option', detail: 'Частота повтора', documentation: 'Количество повторов в секунду' },
];

const KEY_AND_COMMAND_SUGGESTIONS: AutocompleteItem[] = [
  { label: 'exec', insertText: 'exec ', category: 'command', detail: 'Запуск команды', documentation: 'Запустить приложение или shell-команду' },
  { label: 'kill', insertText: 'kill', category: 'command', detail: 'Закрыть окно', documentation: 'Закрывает сфокусированное окно' },
  { label: 'fullscreen toggle', insertText: 'fullscreen toggle', category: 'command', detail: 'На весь экран', documentation: 'Переключает полноэкранный режим' },
  { label: 'floating toggle', insertText: 'floating toggle', category: 'command', detail: 'Плавающее окно', documentation: 'Переключает окно между тайлингом и плавающим режимом' },
  { label: 'focus mode_toggle', insertText: 'focus mode_toggle', category: 'command', detail: 'Смена фокуса слоя', documentation: 'Переключает фокус между плавающими и тайловыми окнами' },
  { label: 'workspace number', insertText: 'workspace number 1', category: 'command', detail: 'Переключить стол', documentation: 'Переходит на указанное рабочее пространство' },
  { label: 'move container to workspace number', insertText: 'move container to workspace number 1', category: 'command', detail: 'Перенести окно', documentation: 'Перемещает текущее окно на другой рабочий стол' },
  { label: 'layout tabbed', insertText: 'layout tabbed', category: 'command', detail: 'Вкладки', documentation: 'Переключает контейнер в режим вкладок' },
  { label: 'layout toggle split', insertText: 'layout toggle split', category: 'command', detail: 'Сплит-сетка', documentation: 'Чередует горизонтальное и вертикальное разделение' },
  { label: 'reload', insertText: 'reload', category: 'command', detail: 'Перезагрузить конфиг', documentation: 'Применяет изменения конфигурации Sway без выхода' },
  { label: 'exit', insertText: 'exit', category: 'command', detail: 'Выйти из Sway', documentation: 'Завершает сеанс Wayland/Sway' },
  { label: 'XF86AudioRaiseVolume', insertText: 'XF86AudioRaiseVolume', category: 'key', detail: 'Клавиша громкости +', documentation: 'Мультимедийная клавиша увеличения громкости' },
  { label: 'XF86AudioLowerVolume', insertText: 'XF86AudioLowerVolume', category: 'key', detail: 'Клавиша громкости -', documentation: 'Мультимедийная клавиша уменьшения громкости' },
  { label: 'XF86MonBrightnessUp', insertText: 'XF86MonBrightnessUp', category: 'key', detail: 'Клавиша яркости +', documentation: 'Увеличение яркости дисплея' },
  { label: 'Print', insertText: 'Print', category: 'key', detail: 'Скриншот', documentation: 'Клавиша PrintScreen' },
  { label: 'Return', insertText: 'Return', category: 'key', detail: 'Enter', documentation: 'Клавиша Enter' },
];

export interface AutocompleteContextResult {
  token: string;
  tokenStart: number;
  items: AutocompleteItem[];
}

export function getAutocompleteSuggestions(
  text: string,
  cursorOffset: number
): AutocompleteContextResult {
  const beforeCursor = text.slice(0, cursorOffset);
  const lines = beforeCursor.split(/\r?\n/);
  const currentLine = lines[lines.length - 1] ?? '';
  const lineStartOffset = beforeCursor.length - currentLine.length;

  // Detect active block depth
  let blockType: 'top' | 'bar' | 'input' = 'top';
  const stack: Array<'bar' | 'input' | 'other'> = [];
  for (let i = 0; i < lines.length - 1; i++) {
    const l = lines[i].trim();
    if (l === '}') {
      stack.pop();
    } else if (/^bar\s*\{$/.test(l)) {
      stack.push('bar');
    } else if (/^input\s+.*\{$/.test(l)) {
      stack.push('input');
    } else if (l.endsWith('{')) {
      stack.push('other');
    }
  }
  const topBlock = stack[stack.length - 1];
  if (topBlock === 'bar') blockType = 'bar';
  else if (topBlock === 'input') blockType = 'input';

  // Extract defined variables from entire document
  const vars: AutocompleteItem[] = [];
  const varMatches = text.matchAll(/^\s*set\s+(\$[a-zA-Z0-9_]+)\s+(.+)$/gm);
  const seenVars = new Set<string>();
  for (const m of varMatches) {
    if (!seenVars.has(m[1])) {
      seenVars.add(m[1]);
      vars.push({
        label: m[1],
        insertText: m[1],
        category: 'variable',
        detail: m[2].trim(),
        documentation: `Пользовательская переменная из этого конфига: ${m[2].trim()}`,
      });
    }
  }

  // Extract current word token (including $ or .)
  const tokenMatch = currentLine.match(/([a-zA-Z0-9_$.]+)$/);
  const token = tokenMatch ? tokenMatch[1] : '';
  const tokenStart = lineStartOffset + currentLine.length - token.length;

  // If typing a $variable
  if (token.startsWith('$')) {
    const filteredVars = vars.filter((v) =>
      v.label.toLowerCase().startsWith(token.toLowerCase())
    );
    return { token, tokenStart, items: filteredVars };
  }

  const trimmedLine = currentLine.trimStart();
  const isFirstTokenOnLine = trimmedLine === token;

  let pool: AutocompleteItem[] = [];
  if (blockType === 'bar' && isFirstTokenOnLine) {
    pool = BAR_SUGGESTIONS;
  } else if (blockType === 'input' && isFirstTokenOnLine) {
    pool = INPUT_SUGGESTIONS;
  } else if (/^bindsym\s+/.test(trimmedLine)) {
    pool = [...vars, ...KEY_AND_COMMAND_SUGGESTIONS];
  } else if (isFirstTokenOnLine) {
    pool = TOP_LEVEL_SUGGESTIONS;
  } else {
    pool = [...vars, ...KEY_AND_COMMAND_SUGGESTIONS];
  }

  const query = token.toLowerCase();
  const items = query
    ? pool.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.detail.toLowerCase().includes(query)
      )
    : pool;

  return { token, tokenStart, items: items.slice(0, 10) };
}
