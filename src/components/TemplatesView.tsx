import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { CONFIG_TEMPLATES, ConfigTemplate } from '../sway/presets';

interface TemplatesViewProps {
  onApplyTemplate: (template: ConfigTemplate) => void;
  onImportSwayConfig: (rawConfig: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({
  onApplyTemplate,
  onImportSwayConfig,
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
        setImportFeedback(`Загружен файл «${file.name}»`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-5 space-y-6 overflow-y-auto h-full">
      <div>
        <h2 className="text-base font-semibold text-slate-100">
          Готовые шаблоны и импорт конфигурации
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Выберите стартовый набор SwayWM + Waybar или импортируйте существующий ~/.config/sway/config.
        </p>
      </div>

      {/* Preset Templates */}
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3">
          {CONFIG_TEMPLATES.filter((t) => !t.id.startsWith('sage-')).map((tpl) => (
            <div
              key={tpl.id}
              className="p-4 rounded-lg border border-slate-800/80 bg-[#090D14] flex flex-wrap items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-slate-100">{tpl.name}</h3>
                <p className="text-xs text-slate-400">{tpl.subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => onApplyTemplate(tpl)}
                className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Применить шаблон
              </button>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800/80 pt-5 space-y-3">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Шалфейная тема (отдельно Dark / Light / Automatic)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Спокойная природная палитра SwayWM + Waybar в трёх отдельных режимах оформления.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {CONFIG_TEMPLATES.filter((t) => t.id.startsWith('sage-')).map((tpl) => (
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
                    <h4 className="text-sm font-semibold text-slate-100">{tpl.name}</h4>
                  </div>
                  <p className="text-xs text-slate-400">{tpl.subtitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onApplyTemplate(tpl)}
                  className="px-4 py-2 text-xs font-semibold bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  Применить шаблон
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Import Existing Sway Config */}
      <div className="border-t border-slate-800/80 pt-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-semibold text-slate-200">
            Импорт собственного sway/config
          </h3>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-lg cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Загрузить файл с диска</span>
            <input
              type="file"
              accept=".conf,.cfg,.txt,*"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>

        <textarea
          rows={7}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Вставьте содержимое ~/.config/sway/config сюда..."
          aria-label="Вставить конфигурацию SwayWM для импорта"
          className="w-full p-3 font-mono text-xs bg-[#090D14] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-400"
        />

        <div className="flex items-center justify-between gap-3">
          {importFeedback ? (
            <span className="text-xs text-emerald-400">{importFeedback}</span>
          ) : (
            <span className="text-xs text-slate-400">
              Парсер автоматически обновит визуальный редактор и предпросмотр.
            </span>
          )}
          <button
            type="button"
            disabled={!pasteText.trim()}
            onClick={() => {
              if (!pasteText.trim()) return;
              onImportSwayConfig(pasteText);
              setImportFeedback('Конфигурация успешно импортирована');
              setPasteText('');
            }}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-100 rounded-lg transition-colors"
          >
            Импортировать текст
          </button>
        </div>
      </div>
    </div>
  );
};
