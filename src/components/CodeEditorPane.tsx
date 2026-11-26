import React, { useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { ConfigFileId } from '../git/gitEngine';
import { SwayDiagnostic } from '../sway/types';
import { WaybarDiagnostic } from '../waybar/types';
import { AutocompleteItem, getAutocompleteSuggestions } from '../sway/autocomplete';
import { getWaybarAutocompleteSuggestions } from '../waybar/autocomplete';
import { AppLang, tr } from '../i18n/translations';

interface CodeEditorPaneProps {
  activeFile: ConfigFileId;
  onSelectFile: (file: ConfigFileId) => void;
  files: Record<ConfigFileId, string>;
  onChangeFile: (file: ConfigFileId, content: string) => void;
  swayDiagnostics: SwayDiagnostic[];
  waybarDiagnostics: WaybarDiagnostic[];
  lang?: AppLang;
}

const FILE_TABS: Array<{ id: ConfigFileId; label: string }> = [
  { id: 'sway/config', label: 'sway/config' },
  { id: 'waybar/config.jsonc', label: 'waybar/config.jsonc' },
  { id: 'waybar/style.css', label: 'waybar/style.css' },
];

export const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  activeFile,
  onSelectFile,
  files,
  onChangeFile,
  swayDiagnostics,
  waybarDiagnostics,
  lang = 'ru',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);

  const [cursorOffset, setCursorOffset] = useState<number>(0);
  const [showAutocomplete, setShowAutocomplete] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const currentContent = files[activeFile] ?? '';
  const lines = useMemo(() => currentContent.split(/\r?\n/), [currentContent]);

  const activeDiagnostics = useMemo(() => {
    if (activeFile === 'sway/config') {
      return swayDiagnostics.map((d) => ({
        line: d.line,
        severity: d.severity,
        message: d.message,
      }));
    }
    return waybarDiagnostics
      .filter((d) => d.file === activeFile)
      .map((d) => ({
        line: d.line,
        severity: d.severity,
        message: d.message,
      }));
  }, [activeFile, swayDiagnostics, waybarDiagnostics]);

  const autocomplete = useMemo(() => {
    if (!showAutocomplete) return { token: '', tokenStart: 0, items: [] as AutocompleteItem[] };
    if (activeFile === 'sway/config') {
      return getAutocompleteSuggestions(currentContent, cursorOffset);
    }
    return getWaybarAutocompleteSuggestions(activeFile, currentContent, cursorOffset);
  }, [activeFile, currentContent, cursorOffset, showAutocomplete]);

  // Compute approximate popup position based on line/col at cursor
  const caretCoords = useMemo(() => {
    const before = currentContent.slice(0, cursorOffset);
    const beforeLines = before.split(/\r?\n/);
    const row = beforeLines.length - 1;
    const col = (beforeLines[row] ?? '').length;
    const scrollTop = textareaRef.current?.scrollTop ?? 0;
    const containerHeight = textareaRef.current?.clientHeight ?? 340;
    const containerWidth = textareaRef.current?.clientWidth ?? 520;

    const lineBottom = (row + 1) * 20 - scrollTop + 14;
    const estimatedPopupHeight = Math.min(autocomplete.items.length * 52 + 8, 256);
    const top =
      lineBottom + estimatedPopupHeight > containerHeight && row * 20 - scrollTop > estimatedPopupHeight
        ? Math.max(8, row * 20 - scrollTop - estimatedPopupHeight + 8)
        : Math.max(24, Math.min(lineBottom, Math.max(24, containerHeight - estimatedPopupHeight - 8)));

    const left = Math.min(Math.max(col * 7.8 + 16, 16), Math.max(16, containerWidth - 332));
    return { top, left };
  }, [currentContent, cursorOffset, autocomplete.items.length]);

  const syncScroll = () => {
    if (!textareaRef.current) return;
    if (preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const applySuggestion = (item: AutocompleteItem) => {
    const beforeToken = currentContent.slice(0, autocomplete.tokenStart);
    const afterCursor = currentContent.slice(cursorOffset);
    const nextText = `${beforeToken}${item.insertText}${afterCursor}`;
    const nextCursor = beforeToken.length + item.insertText.length;

    onChangeFile(activeFile, nextText);
    setShowAutocomplete(false);
    setSelectedIndex(0);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursor, nextCursor);
        setCursorOffset(nextCursor);
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const pos = e.target.selectionStart ?? val.length;
    onChangeFile(activeFile, val);
    setCursorOffset(pos);
    setSelectedIndex(0);

    const lineBefore = val.slice(0, pos).split(/\r?\n/).pop() ?? '';
    if (/[a-zA-Z0-9_$.#"]$/.test(lineBefore)) {
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.code === 'Space') {
      e.preventDefault();
      const pos = e.currentTarget.selectionStart ?? 0;
      setCursorOffset(pos);
      setSelectedIndex(0);
      setShowAutocomplete(true);
      return;
    }

    if (showAutocomplete && autocomplete.items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % autocomplete.items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + autocomplete.items.length) % autocomplete.items.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const item = autocomplete.items[selectedIndex] ?? autocomplete.items[0];
        if (item) applySuggestion(item);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        return;
      }
    }

    if (e.key === 'Tab' && !showAutocomplete) {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const next = `${currentContent.slice(0, start)}    ${currentContent.slice(end)}`;
      onChangeFile(activeFile, next);
      requestAnimationFrame(() => {
        target.setSelectionRange(start + 4, start + 4);
        setCursorOffset(start + 4);
      });
    }
  };

  const highlightLine = (line: string) => {
    const trimmed = line.trim();
    if (
      (activeFile === 'sway/config' && trimmed.startsWith('#')) ||
      (activeFile !== 'sway/config' && (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')))
    ) {
      return <span className="text-slate-500 italic">{line || ' '}</span>;
    }

    if (activeFile === 'sway/config') {
      const m = line.match(/^(\s*)(set|bindsym|bindcode|gaps|smart_gaps|smart_borders|default_border|default_floating_border|hide_edge_borders|workspace_layout|workspace_auto_back_and_forth|focus_wrapping|mouse_warping|popup_during_fullscreen|client\.\S+|output|input|bar|for_window|assign|no_focus|exec_always|exec|font|title_align|focus_follows_mouse|floating_modifier|swaybar_command|position|status_command|height|tray_output|colors|xkb_\S+|tap|natural_scroll|dwt|middle_emulation|repeat_\S+|accel_profile|pointer_accel|scroll_\S+)(\b.*)$/);
      if (m) {
        return (
          <>
            <span>{m[1]}</span>
            <span className="text-sky-400 font-medium">{m[2]}</span>
            <span className="text-slate-200">{highlightInlineTokens(m[3])}</span>
          </>
        );
      }
    }

    return <span className="text-slate-200">{highlightInlineTokens(line) || ' '}</span>;
  };

  const highlightInlineTokens = (text: string) => {
    const parts = text.split(/(#[0-9a-fA-F]{6,8}|\$[a-zA-Z0-9_]+|"[^"]*")/g);
    return parts.map((part, idx) => {
      if (!part) return null;
      if (/^#[0-9a-fA-F]{6,8}$/.test(part)) {
        return (
          <span key={idx} className="text-amber-300 underline decoration-amber-500/60">
            {part}
          </span>
        );
      }
      if (part.startsWith('$')) {
        return (
          <span key={idx} className="text-emerald-300">
            {part}
          </span>
        );
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={idx} className="text-teal-300">
            {part}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  const diagLineMap = useMemo(() => {
    const map = new Map<number, { severity: string; message: string }>();
    for (const d of activeDiagnostics) {
      if (!map.has(d.line)) map.set(d.line, d);
    }
    return map;
  }, [activeDiagnostics]);

  return (
    <div className="flex flex-col h-full bg-[#090D14]">
      {/* File Tabs Bar */}
      <div className="px-3 py-2 border-b border-slate-800/80 bg-[#0E131E] flex flex-wrap items-center justify-between gap-2">
        <div
          className="flex flex-wrap items-center gap-1"
          role="tablist"
          aria-label={tr(lang, 'Файлы конфигурации', 'Configuration files')}
        >
          {FILE_TABS.map((tab) => {
            const isSelected = activeFile === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectFile(tab.id);
                  setShowAutocomplete(false);
                }}
                className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-slate-800 text-sky-300 font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                setCursorOffset(textareaRef.current.selectionStart ?? currentContent.length);
              }
              setSelectedIndex(0);
              setShowAutocomplete((v) => !v);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-sky-300 bg-slate-800/70 hover:bg-slate-800 rounded-md transition-colors"
          >
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            {tr(lang, 'Автодополнение (Ctrl+Space)', 'Autocomplete (Ctrl+Space)')}
          </button>
        </div>
      </div>

      {/* Editor Surface */}
      <div className="relative flex-1 min-h-0 flex overflow-hidden">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="w-12 py-3 pr-2 text-right font-mono text-xs leading-[20px] text-slate-500 bg-[#0B0F17] border-r border-slate-800/60 select-none overflow-hidden tabular-nums shrink-0"
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const diag = diagLineMap.get(lineNum);
            return (
              <div
                key={lineNum}
                className={`h-[20px] px-1 ${
                  diag?.severity === 'error'
                    ? 'text-rose-400 font-semibold bg-rose-500/10'
                    : diag?.severity === 'warning'
                    ? 'text-amber-400 bg-amber-500/10'
                    : ''
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Highlighting Overlay + Editable Textarea */}
        <div className="relative flex-1 min-w-0 overflow-hidden">
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 m-0 py-3 px-3 font-mono text-[13px] leading-[20px] whitespace-pre overflow-hidden pointer-events-none"
          >
            {lines.map((line, idx) => (
              <div key={idx} className="h-[20px]">
                {highlightLine(line)}
              </div>
            ))}
          </pre>

          <textarea
            ref={textareaRef}
            value={currentContent}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={syncScroll}
            onClick={(e) => setCursorOffset(e.currentTarget.selectionStart ?? 0)}
            onBlur={() => {
              setTimeout(() => setShowAutocomplete(false), 180);
            }}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label={tr(lang, `Текстовый редактор ${activeFile}`, `Code editor ${activeFile}`)}
            data-testid="code-editor-textarea"
            className="relative z-10 w-full h-full py-3 px-3 font-mono text-[13px] leading-[20px] bg-transparent text-transparent caret-sky-400 resize-none focus:outline-none whitespace-pre overflow-auto selection:bg-sky-500/30"
          />

          {/* Autocomplete Popup */}
          {showAutocomplete && autocomplete.items.length > 0 && (
            <div
              role="listbox"
              aria-label={tr(lang, 'Варианты автодополнения', 'Autocomplete suggestions')}
              data-testid="autocomplete-popup"
              style={{ top: `${caretCoords.top}px`, left: `${caretCoords.left}px` }}
              className="absolute z-30 w-80 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-[#111827] shadow-2xl divide-y divide-slate-800/80"
            >
              {autocomplete.items.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.label}-${idx}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applySuggestion(item);
                    }}
                    className={`w-full px-3 py-2 text-left transition-colors flex flex-col gap-0.5 ${
                      isSelected ? 'bg-sky-500/20' : 'hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-semibold text-sky-300 truncate">
                        {item.label}
                      </span>
                      <span className="text-[11px] text-slate-400 truncate">
                        {item.detail}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {item.documentation}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Live Diagnostics Strip */}
      <div className="border-t border-slate-800/80 bg-[#0E131E] px-3 py-2 max-h-28 overflow-y-auto">
        {activeDiagnostics.length === 0 ? (
          <div className="text-xs text-emerald-400 flex items-center gap-2">
            <span>
              {tr(
                lang,
                `Синтаксис корректен · ошибок не найдено (${activeFile})`,
                `Syntax valid · 0 errors found (${activeFile})`
              )}
            </span>
          </div>
        ) : (
          <div className="space-y-1">
            {activeDiagnostics.map((d, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 text-xs ${
                  d.severity === 'error' ? 'text-rose-400' : 'text-amber-300'
                }`}
              >
                {d.severity === 'error' ? (
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                )}
                <span className="font-mono tabular-nums shrink-0">
                  {tr(lang, `Стр. ${d.line}:`, `Ln ${d.line}:`)}
                </span>
                <span>{d.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
