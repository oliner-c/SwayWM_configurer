import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, LocateFixed } from 'lucide-react';
import { AppLang, tr } from '../i18n/translations';

export interface SmartOption {
  value: string;
  label?: string;
}

interface SmartInputProps {
  id?: string;
  type?: 'text' | 'number' | 'search';
  value: string | number | undefined;
  placeholder: string;
  onCommit: (nextRaw: string) => void;
  onAutoDetect: () => string | number;
  options?: Array<SmartOption | string>;
  lang?: AppLang;
  autoTitle?: string;
  ariaLabel?: string;
  className?: string;
  wrapperClassName?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number | string;
  compact?: boolean;
  /**
   * When true, clearing the input to "" immediately invokes onCommit("").
   * When false (for required Sway/Waybar directives or numeric fields that fall back on empty),
   * the input visually stays "" showing ONLY the placeholder hint until the user types or clicks Auto.
   */
  allowEmpty?: boolean;
  dataTestId?: string;
}

export const SmartInput: React.FC<SmartInputProps> = ({
  id,
  type = 'text',
  value,
  placeholder,
  onCommit,
  onAutoDetect,
  options,
  lang = 'ru',
  autoTitle,
  ariaLabel,
  className = '',
  wrapperClassName = '',
  disabled = false,
  min,
  max,
  step,
  compact = false,
  allowEmpty = false,
  dataTestId,
}) => {
  const externalStr = value === undefined || value === null ? '' : String(value);
  const [draft, setDraft] = useState<string>(externalStr);
  const prevExternalRef = useRef<string>(externalStr);

  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [openUpward, setOpenUpward] = useState<boolean>(false);
  const [highlightIdx, setHighlightIdx] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();

  const normalizedOptions = useMemo<Array<{ value: string; label: string }>>(() => {
    if (!options || options.length === 0) return [];
    return options.map((opt) =>
      typeof opt === 'string'
        ? { value: opt, label: opt }
        : { value: opt.value, label: opt.label ?? opt.value }
    );
  }, [options]);

  const hasOptions = normalizedOptions.length > 0;

  useEffect(() => {
    if (externalStr !== prevExternalRef.current) {
      prevExternalRef.current = externalStr;
      setDraft(externalStr);
    }
  }, [externalStr]);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setHighlightIdx(-1);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen]);

  const openMenu = () => {
    if (disabled || !hasOptions) return;
    if (containerRef.current && typeof window !== 'undefined') {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 220 && rect.top > 220);
    }
    const currentIdx = normalizedOptions.findIndex((o) => o.value === draft);
    setHighlightIdx(currentIdx >= 0 ? currentIdx : 0);
    setMenuOpen(true);
  };

  const commitValue = (next: string) => {
    prevExternalRef.current = next;
    setDraft(next);
    onCommit(next);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDraft(next);

    if (next === '') {
      if (allowEmpty) {
        prevExternalRef.current = '';
        onCommit('');
      }
      return;
    }

    if (type === 'number') {
      const parsed = Number(next);
      if (Number.isNaN(parsed)) return;
    }

    onCommit(next);
  };

  const handleAuto = () => {
    if (disabled) return;
    const detected = String(onAutoDetect());
    commitValue(detected);
    setMenuOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!hasOptions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!menuOpen) {
        openMenu();
      } else {
        setHighlightIdx((idx) => (idx + 1) % normalizedOptions.length);
      }
    } else if (e.key === 'ArrowUp' && menuOpen) {
      e.preventDefault();
      setHighlightIdx((idx) => (idx <= 0 ? normalizedOptions.length - 1 : idx - 1));
    } else if (e.key === 'Enter' && menuOpen && highlightIdx >= 0) {
      e.preventDefault();
      const chosen = normalizedOptions[highlightIdx];
      if (chosen) {
        commitValue(chosen.value);
        setMenuOpen(false);
        setHighlightIdx(-1);
      }
    } else if (e.key === 'Escape' && menuOpen) {
      e.preventDefault();
      setMenuOpen(false);
      setHighlightIdx(-1);
    }
  };

  const buttonLabel = tr(lang, 'Авто', 'Auto');
  const resolvedTitle =
    autoTitle ?? tr(lang, 'Автоматически определить значение', 'Auto-detect value');
  const dropdownLabel = tr(lang, 'Выбрать из списка', 'Choose from list');

  return (
    <div ref={containerRef} className={`flex items-center gap-1.5 min-w-0 ${wrapperClassName}`}>
      <div className="relative flex-1 min-w-0">
        <input
          ref={inputRef}
          id={id}
          type={type}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          value={draft}
          placeholder={placeholder}
          aria-label={ariaLabel}
          role={hasOptions ? 'combobox' : undefined}
          aria-expanded={hasOptions ? menuOpen : undefined}
          aria-controls={hasOptions ? listboxId : undefined}
          aria-autocomplete={hasOptions ? 'list' : undefined}
          data-testid={dataTestId}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className={`w-full min-w-0 ${className} ${
            hasOptions ? 'pr-7' : ''
          } ${
            type === 'number' && hasOptions
              ? '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
              : ''
          } placeholder:text-slate-500`}
        />

        {hasOptions && (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            aria-label={dropdownLabel}
            title={dropdownLabel}
            aria-expanded={menuOpen}
            aria-controls={listboxId}
            onClick={() => {
              if (menuOpen) {
                setMenuOpen(false);
              } else {
                openMenu();
                inputRef.current?.focus();
              }
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-sky-300 hover:bg-slate-800/70 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${menuOpen ? 'rotate-180 text-sky-300' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}

        {menuOpen && hasOptions && (
          <ul
            id={listboxId}
            role="listbox"
            className={`absolute left-0 min-w-full w-max max-w-[320px] z-50 max-h-56 overflow-y-auto rounded-lg border border-slate-700 bg-[#0B101B] shadow-2xl py-1 ${
              openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
            }`}
          >
            {normalizedOptions.map((opt, idx) => {
              const isSelected = draft === opt.value;
              const isHighlighted = idx === highlightIdx;
              const displayLabel =
                opt.label && opt.label !== opt.value ? opt.label : null;
              return (
                <li
                  key={`${opt.value}-${idx}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    commitValue(opt.value);
                    setMenuOpen(false);
                    setHighlightIdx(-1);
                  }}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`px-2.5 py-1.5 cursor-pointer flex items-center justify-between gap-3 text-xs transition-colors ${
                    isSelected
                      ? 'bg-sky-500/20 text-sky-200'
                      : isHighlighted
                      ? 'bg-slate-800 text-slate-100'
                      : 'text-slate-300 hover:bg-slate-800/70'
                  }`}
                >
                  <span className="font-mono truncate">
                    {opt.value === '' ? tr(lang, '(пусто)', '(empty)') : opt.value}
                  </span>
                  {displayLabel && (
                    <span className="text-[11px] text-slate-400 truncate">
                      {displayLabel}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={handleAuto}
        title={resolvedTitle}
        aria-label={resolvedTitle}
        className={`inline-flex items-center justify-center gap-1 rounded-lg border border-slate-800 bg-[#090D14] text-sky-300 hover:bg-slate-800 hover:border-sky-400/50 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0 ${
          compact ? 'px-2 py-2' : 'px-2.5 py-2 text-[11px] font-medium'
        }`}
      >
        <LocateFixed className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        {!compact && <span>{buttonLabel}</span>}
      </button>
    </div>
  );
};
