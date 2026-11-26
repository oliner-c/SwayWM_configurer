import React, { useState } from 'react';
import { LocateFixed, Upload } from 'lucide-react';
import { CONFIG_TEMPLATES, ConfigTemplate } from '../sway/presets';
import { AppLang, TEMPLATE_LOCALE_EN, tr } from '../i18n/translations';

interface TemplatesViewProps {
  onApplyTemplate: (template: ConfigTemplate) => void;
  onImportSwayConfig: (rawConfig: string) => void;
  currentSwayConfig?: string;
  lang?: AppLang;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  onApplyTemplate,
  onImportSwayConfig,
  currentSwayConfig,
  lang = 'ru',
}) => {
  const [pasteText, setPasteText] = useState('');
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportSwayConfig(reader.result);
        setImportFeedback(
          tr(lang, `Загружен файл «${file.name}»`, `Loaded file "${file.name}"`)
        );
      }
    };
    reader.readAsText(file);
  };

  const getTemplateCopy = (tpl: ConfigTemplate) => {
    if (lang === 'en' && TEMPLATE_LOCALE_EN[tpl.id]) {
      return TEMPLATE_LOCALE_EN[tpl.id];
    }
    return { name: tpl.name, subtitle: tpl.subtitle };
  };

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-slate-100">
          {tr(lang, 'Готовые шаблоны и импорт конфигурации', 'Ready Templates & Config Import')}
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {tr(
            lang,
            'Выберите стартовый набор SwayWM + Waybar или импортируйте существующий ~/.config/sway/config.',
            'Pick a SwayWM + Waybar starter preset or import your existing ~/.config/sway/config.'
          )}
        </p>
      </div>

      {/* Preset Templates */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3">
          {CONFIG_TEMPLATES.filter((t) => !t.id.startsWith('sage-')).map((tpl) => {
            const copy = getTemplateCopy(tpl);
            return (
              <div
                key={tpl.id}
                className="p-4 rounded-lg border border-slate-800/80 bg-[#090D14] flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {tpl.swatches && (
                      <span className="inline-flex items-center gap-1" aria-hidden="true">
                        {tpl.swatches.map((hex, idx) => (
                          <span
                            key={`${tpl.id}-sw-${idx}`}
                            className="w-3.5 h-3.5 rounded-[3px] border border-slate-700/80 shrink-0"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </span>
                    )}
                    <h3 className="text-sm font-semibold text-slate-100">{copy.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400">{copy.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onApplyTemplate(tpl)}
                  className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  {tr(lang, 'Применить шаблон', 'Apply Template')}
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              {tr(
                lang,
                'Шалфейная тема (отдельно Dark / Light / Automatic)',
                'Sage Theme (Dark / Light / Automatic)'
              )}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {tr(
                lang,
                'Спокойная природная палитра SwayWM + Waybar в трёх отдельных режимах оформления.',
                'Calm botanical SwayWM + Waybar palette available across three dedicated appearance modes.'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {CONFIG_TEMPLATES.filter((t) => t.id.startsWith('sage-')).map((tpl) => {
              const copy = getTemplateCopy(tpl);
              return (
                <div
                  key={tpl.id}
                  className="p-4 rounded-lg border border-slate-800/80 bg-[#090D14] flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {tpl.swatches && (
                        <span className="inline-flex items-center gap-1" aria-hidden="true">
                          {tpl.swatches.map((hex, idx) => (
                            <span
                              key={`${tpl.id}-sw-${idx}`}
                              className="w-3.5 h-3.5 rounded-[3px] border border-slate-700/80 shrink-0"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </span>
                      )}
                      <h4 className="text-sm font-semibold text-slate-100">{copy.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400">{copy.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onApplyTemplate(tpl)}
                    className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    {tr(lang, 'Применить шаблон', 'Apply Template')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Import Existing Sway Config */}
      <div className="border-t border-slate-800/80 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">
            {tr(lang, 'Импорт собственного sway/config', 'Import Existing sway/config')}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPasteText(currentSwayConfig || CONFIG_TEMPLATES[0].config);
                setImportFeedback(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg transition-colors"
            >
              <LocateFixed className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tr(lang, 'Авто (текущий конфиг)', 'Auto (current config)')}</span>
            </button>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{tr(lang, 'Загрузить файл с диска', 'Upload from disk')}</span>
              <input
                type="file"
                accept=".conf,.cfg,.txt,*"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <textarea
          rows={7}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={tr(
            lang,
            'Вставьте содержимое ~/.config/sway/config (set $mod, bindsym, output, bar { ... }) сюда...',
            'Paste ~/.config/sway/config contents (set $mod, bindsym, output, bar { ... }) here...'
          )}
          aria-label={tr(
            lang,
            'Вставить конфигурацию SwayWM для импорта',
            'Paste SwayWM config to import'
          )}
          className="w-full p-3 font-mono text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400"
        />

        <div className="flex items-center justify-between gap-3">
          {importFeedback ? (
            <span className="text-xs text-emerald-400">{importFeedback}</span>
          ) : (
            <span className="text-xs text-slate-400">
              {tr(
                lang,
                'Парсер автоматически обновит визуальный редактор и предпросмотр.',
                'The parser updates the visual builder and live desktop preview automatically.'
              )}
            </span>
          )}
          <button
            type="button"
            disabled={!pasteText.trim()}
            onClick={() => {
              if (!pasteText.trim()) return;
              onImportSwayConfig(pasteText);
              setImportFeedback(
                tr(lang, 'Конфигурация успешно импортирована', 'Configuration imported')
              );
              setPasteText('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-lg transition-colors"
          >
            {tr(lang, 'Импортировать текст', 'Import Text')}
          </button>
        </div>
      </div>
    </div>
  );
};
