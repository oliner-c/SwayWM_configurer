import { AutocompleteContextResult, AutocompleteItem } from '../sway/autocomplete';
import { AVAILABLE_WAYBAR_MODULES } from './presets';

const WAYBAR_JSON_KEYS: AutocompleteItem[] = [
  { label: '"layer"', insertText: '"layer": "top",', category: 'directive', detail: 'Слой Waybar', documentation: '"top" или "bottom"' },
  { label: '"position"', insertText: '"position": "top",', category: 'directive', detail: 'Позиция на экране', documentation: '"top", "bottom", "left" или "right"' },
  { label: '"height"', insertText: '"height": 32,', category: 'directive', detail: 'Высота (px)', documentation: 'Фиксированная высота панели в пикселях' },
  { label: '"spacing"', insertText: '"spacing": 6,', category: 'directive', detail: 'Интервал между модулями', documentation: 'Отступ между соседними модулями' },
  { label: '"margin-top"', insertText: '"margin-top": 6,', category: 'directive', detail: 'Верхний отступ', documentation: 'Отступ панели от верхнего края монитора' },
  { label: '"modules-left"', insertText: '"modules-left": ["sway/workspaces", "sway/mode"],', category: 'directive', detail: 'Левые модули', documentation: 'Список модулей в левой части Waybar' },
  { label: '"modules-center"', insertText: '"modules-center": ["clock"],', category: 'directive', detail: 'Центральные модули', documentation: 'Список модулей в центре панели' },
  { label: '"modules-right"', insertText: '"modules-right": ["pulseaudio", "network", "cpu", "tray"],', category: 'directive', detail: 'Правые модули', documentation: 'Список модулей в правой части Waybar' },
  ...AVAILABLE_WAYBAR_MODULES.map((m) => ({
    label: `"${m.id}"`,
    insertText: `"${m.id}"`,
    category: 'option' as const,
    detail: 'Модуль Waybar',
    documentation: m.description,
  })),
];

const WAYBAR_CSS_SELECTORS: AutocompleteItem[] = [
  { label: 'window#waybar', insertText: 'window#waybar {\n  background-color: #0F172A;\n  color: #E2E8F0;\n}', category: 'directive', detail: 'Контейнер панели', documentation: 'Основные стили окна Waybar' },
  { label: '#workspaces button.focused', insertText: '#workspaces button.focused {\n  background-color: #38BDF8;\n  color: #0F172A;\n}', category: 'directive', detail: 'Активный воркспейс', documentation: 'Подсветка текущего рабочего стола Sway' },
  { label: '#workspaces button.urgent', insertText: '#workspaces button.urgent {\n  background-color: #EF4444;\n  color: #FFFFFF;\n}', category: 'directive', detail: 'Срочный воркспейс', documentation: 'Воркспейс с уведомлением' },
  { label: '#mode', insertText: '#mode {\n  background-color: #EF4444;\n}', category: 'directive', detail: 'Индикатор режима Sway', documentation: 'Стили блока sway/mode (например resize)' },
  { label: '#clock', insertText: '#clock {\n  padding: 2px 10px;\n}', category: 'option', detail: 'Виджет часов', documentation: 'Стили модуля времени' },
  { label: '#pulseaudio', insertText: '#pulseaudio {\n  padding: 2px 10px;\n}', category: 'option', detail: 'Виджет звука', documentation: 'Стили модуля громкости' },
  { label: '#network', insertText: '#network {\n  padding: 2px 10px;\n}', category: 'option', detail: 'Виджет сети', documentation: 'Стили сетевого модуля' },
  { label: '#battery.warning', insertText: '#battery.warning {\n  color: #EF4444;\n}', category: 'option', detail: 'Предупреждение батареи', documentation: 'Стили при низком заряде' },
  { label: 'border-radius', insertText: 'border-radius: 6px;', category: 'command', detail: 'Скругление', documentation: 'Радиус скругления углов в пикселях' },
  { label: 'background-color', insertText: 'background-color: #1E293B;', category: 'command', detail: 'Цвет фона', documentation: 'HEX или rgba() цвет фона элемента' },
];

export function getWaybarAutocompleteSuggestions(
  file: 'waybar/config.jsonc' | 'waybar/style.css',
  text: string,
  cursorOffset: number
): AutocompleteContextResult {
  const beforeCursor = text.slice(0, cursorOffset);
  const lines = beforeCursor.split(/\r?\n/);
  const currentLine = lines[lines.length - 1] ?? '';
  const lineStartOffset = beforeCursor.length - currentLine.length;

  const tokenMatch = currentLine.match(/([a-zA-Z0-9_#"./-]+)$/);
  const token = tokenMatch ? tokenMatch[1] : '';
  const tokenStart = lineStartOffset + currentLine.length - token.length;

  const pool = file === 'waybar/config.jsonc' ? WAYBAR_JSON_KEYS : WAYBAR_CSS_SELECTORS;
  const query = token.toLowerCase().replace(/^"/, '');
  const items = query
    ? pool.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.detail.toLowerCase().includes(query)
      )
    : pool;

  return { token, tokenStart, items: items.slice(0, 10) };
}
