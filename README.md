# SwayForge — Конфигуратор SwayWM + Waybar

Интерактивный редактор конфигураций для **SwayWM** (`~/.config/sway/config`) и **Waybar** (`~/.config/waybar/config.jsonc`, `~/.config/waybar/style.css`) с контекстным автодополнением, живым предпросмотром рабочего стола и встроенной системой контроля версий Git.

## Локальный запуск

```bash
npm install
npm run dev
```

Проверка типов, тесты и production-сборка:

```bash
npm run lint
npm test
npm run build
```

## Деплой на Vercel

Проект полностью статический (Vite + React SPA), не требует серверной базы данных или переменных окружения и готов к запуску на Vercel из коробки (`vercel.json` уже настроен):

1. Импортируйте репозиторий в [Vercel Dashboard](https://vercel.com/new) **или** выполните в корне проекта:
   ```bash
   npx vercel --prod
   ```
2. Параметры сборки определяются автоматически из `vercel.json`:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
