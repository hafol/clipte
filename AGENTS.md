<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Mandatory Project Context Guidelines for AI Agents
1. **Always read `PROJECT_CONTEXT.md`** at the beginning of any session or prompt.
2. **Mandatory 3-Language Support (EN / RU / KK)**: Any UI text, button, modal, badge, or message must always be added/updated across all 3 locale dictionaries: `src/locales/en.json`, `src/locales/ru.json`, and `src/locales/kk.json`. Never hardcode raw strings in components.
3. **Always update the Changelog section in `PROJECT_CONTEXT.md`** after completing any task or user request (specify date, changed files, reasons, and current state).
4. **Strict Zero-Emoji & Anti-AI-Slop Policy**: NEVER use unicode emojis in UI strings, buttons, badges, logs, or codebase text. Use clean Lucide SVG icons or minimalist typography instead. AI slop and decorative emojis are strictly prohibited.
5. **Strict No-Internal-Labels Policy**: NEVER output internal reference labels, design source names (e.g. "Whop Replica", "Whop Mode", "Figma Spec", "AI Generated", "Debug Badge"), or arbitrary developer commentary into user-facing UI. Every string visible to users must be 100% production-ready, clean, authentic to the product, and localized.
6. **Strict 100% Pixel-Perfect Copying Standard («Копируй на 100%»)**: Когда пользователь просит скопировать дизайн/страницу на 100% («сделай точную копию», «копируй на 100%», «1:1 копия»), агент **ОБЯЗАН** производить глубокий реверс-инжиниринг исходника (распаковка MHTML/DOM, извлечение точных CSS-классов, радиальных градиентов, многослойных теней, физических кривых анимаций, точных размеров шрифтов и отступов, оригинальных SVG-иконок и адаптивных брейкпоинтов) и выдавать бескомпромиссно аутентичный, пиксель-перфект результат высочайшего уровня без упрощений и шаблонных заглушек.


