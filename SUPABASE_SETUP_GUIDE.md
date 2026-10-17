# 🚀 ПОШАГОВОЕ РУКОВОДСТВО ПО ПОДКЛЮЧЕНИЮ SUPABASE И GOOGLE AUTH

Данное руководство позволит вам с нуля создать и подключить **бэкенд Supabase** к вашему приложению **Clipte / Clipping.net**.

---

## 📌 СОДЕРЖАНИЕ
1. [Создание бесплатного проекта в Supabase](#1-создание-проекта-в-supabase)
2. [Получение ключей доступа (URL и Anon Key)](#2-получение-ключей-доступа)
3. [Настройка локального файла `.env.local`](#3-настройка-envlocal)
4. [Развертывание базы данных через SQL Editor](#4-развертывание-структуры-базы-данных)
5. [Настройка входа через Google OAuth](#5-настройка-входа-через-google-oauth)
6. [Проверка работы интеграции](#6-проверка-работы)

---

## 1. СОЗДАНИЕ ПРОЕКТА В SUPABASE

1. Перейдите на сайт **[https://supabase.com](https://supabase.com)**.
2. Нажмите зеленую кнопку **`Start your project`** или **`Sign in`**.
3. Войдите через **GitHub** аккаунт (наиболее простой способ).
4. На главной панели выберите **`New Project`** (Новый проект).
5. Заполните форму создания:
   * **Organization**: выберите вашу организацию или личный профиль.
   * **Name**: введите имя проекта (например, `clipping-backend`).
   * **Database Password**: нажмите *Generate a password* или введите надежный пароль (сохраните его).
   * **Region**: выберите ближайший регион (например, `Frankfurt (eu-central-1)`).
   * **Pricing Plan**: выберите **Free Tier** ($0/месяц).
6. Нажмите **`Create new project`** и подождите 1–2 минуты, пока создастся инфраструктура базы данных.

---

## 2. ПОЛУЧЕНИЕ КЛЮЧЕЙ ДОСТУПА

Когда проект создастся, вы окажетесь на главной панели управления (Dashboard):

1. В левой боковой панели нажмите на значок шестеренки **`Project Settings`** (Настройки проекта).
2. Выберите пункт **`API`** в меню слева.
3. В блоке **Project API keys** найдите и скопируйте следующие значения:

> 🔹 **Project URL**: выглядит как `https://xyzsomething.supabase.co`  
> 🔹 **`anon` `public` key**: длинная строка ключа, начинающаяся на `eyJhbGci...`

---

## 3. НАСТРОЙКА `.env.local`

1. Откройте ваш проект в редакторе кода.
2. Найдите файл **[`.env.local`](file:///c:/Users/erkez/OneDrive/Рабочий%20стол/Clipping landing page/.env.local)** (он находится в корневом каталоге проекта).
3. Вставьте свои скопированные значения вместо заглушек:

```env
# ========================================================
# SUPABASE API CREDENTIALS
# ========================================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

4. Сохраните файл (`Ctrl + S`).

---

## 4. РАЗВЕРТЫВАНИЕ СТРУКТУРЫ БАЗЫ ДАННЫХ

Чтобы создать все необходимые таблицы (`profiles`, `social_accounts`, `campaigns`, `clips`, `payouts`) и правила безопасности (RLS):

1. В панели **Supabase** в левом меню нажмите на значок **`SQL Editor`** (Иконка `>/_`).
2. Нажмите кнопку **`+ New Query`** (Новый запрос).
3. Откройте в вашем проекте готовый файл **[`supabase/schema.sql`](file:///c:/Users/erkez/OneDrive/Рабочий%20стол/Clipping landing page/supabase/schema.sql)**.
4. Скопируйте **весь текст** из этого файла и вставьте в текстовое поле SQL Editor в Supabase.
5. Нажмите зеленую кнопку **`Run`** (или `Ctrl + Enter`).
6. Внизу появится сообщение **`Success. No rows returned`**.

> ✅ **Что создано:**
> * 🗄️ `profiles` — профили пользователей и аватарок.
> * 🎵 `social_accounts` — привязанные аккаунты TikTok, Instagram, YouTube, X.
> * 💰 `campaigns` — активные баунти-кампании.
> * 📹 `clips` — загруженные клипы и статистика просмотров.
> * 💸 `payouts` — выплатные кошельки и история транзакций.
> * ⚡ Автоматический триггер `handle_new_user()`, создающий профиль при входе.

---

## 5. НАСТРОЙКА ВХОДА ЧЕРЕЗ GOOGLE OAUTH

### А. Настройка в Google Cloud Console:
1. Перейдите в **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Создайте новый проект или выберите существующий.
3. Перейдите в **APIs & Services ➔ OAuth consent screen** и выберите *External*.
4. Заполните имя приложения (`Clipte`), email поддержки и сохраните.
5. Перейдите в **APIs & Services ➔ Credentials**.
6. Нажмите **`Create Credentials` ➔ `OAuth client ID`**.
7. Выберите тип: **Web application**.
8. В поле **Authorized redirect URIs** добавьте URL из Supabase:
   `https://<YOUR-PROJECT-REF>.supabase.co/auth/v1/callback`
9. Нажмите **Create** и скопируйте **Client ID** и **Client Secret**.

### Б. Активация в Supabase:
1. В панели **Supabase** выберите **Authentication ➔ Providers**.
2. Найдите **Google** и переключите в положение **Enabled**.
3. Вставьте скопированные **Client ID** и **Client Secret**.
4. В разделе **URL Configuration** проверьте **Redirect URLs**:
   Добавьте `http://localhost:3000/auth/callback` и `http://localhost:3000/**`.
5. Нажмите **Save**.

---

## 6. ПРОВЕРКА РАБОТЫ

1. Убедитесь, что локальный сервер запущен (`npm run dev`).
2. Откройте в браузере эндпоинт проверки бэкенда:
   **[http://localhost:3000/api/health/supabase](http://localhost:3000/api/health/supabase)**
3. Вы должны увидеть ответ:
   ```json
   {
     "status": "healthy",
     "connected": true,
     "timestamp": "..."
   }
   ```
4. Откройте страницу **[http://localhost:3000/dashboard/accounts](http://localhost:3000/dashboard/accounts)** и нажмите **`+ Add Social Media`** — все созданные данные будут напрямую уходить в ваш Supabase!


---

## 7. ФАЗА 2 — БЕЗОПАСНАЯ СХЕМА, СЕКРЕТНЫЙ КЛЮЧ, ТРЕКИНГ (2026-10-11)

> ⚠️ Используйте **новый** `supabase/schema.sql` (v2). Старая версия сохранена в `supabase/legacy/` — она небезопасна (любой пользователь мог начислить себе деньги), не запускайте её.

1. **Если в проекте уже есть старые таблицы** (ошибка вида `column "bio" does not exist`): сначала SQL Editor → `supabase/reset.sql` → Run. ⚠️ Удаляет все таблицы Clipte с данными — только пока нет реальных пользователей (аккаунты входа сохраняются, профили создадутся заново).
   Затем **запустите схему**: SQL Editor → новый запрос → весь `supabase/schema.sql` → Run.
2. **Сделайте себя админом** (после первой регистрации на сайте):
   `update public.profiles set role = 'admin' where email = 'ваш@email';`
3. **Секретный ключ** → `.env.local`, строка `SUPABASE_SECRET_KEY=`:
   Supabase → **Project Settings → API Keys** → блок **Secret keys** → `sb_secret_…` (или в разделе *Legacy API keys* — `service_role`). Никогда не добавляйте к нему `NEXT_PUBLIC_` и не публикуйте.
4. **CRON_SECRET** — любая длинная случайная строка. Планировщик вызывает `GET /api/tracking/run` с заголовком `Authorization: Bearer <CRON_SECRET>` (например, раз в час: Vercel Cron, cron-job.org или GitHub Actions).
5. **YOUTUBE_API_KEY** (необязательно): Google Cloud → APIs & Services → включить *YouTube Data API v3* → Credentials → API key. Без него YouTube читается с публичной страницы.
6. **CryptoPay webhook**: в @CryptoBot / Crypto Pay → Webhooks укажите `https://ВАШ-ДОМЕН/api/payments/crypto/webhook`. Локально вебхук не дойдёт — оплату подтверждает `check-invoice`.
7. **Проверка схемы локально**: `npm run test:db` (60 тестов безопасности и денежных сценариев на встроенном Postgres).

---

## 8. ОБНОВЛЕНИЕ СХЕМЫ v2.1 (2026-10-12)

Если `schema.sql` (v2) уже запущен, **один раз** выполните в SQL Editor файл
`supabase/migrations/2026-10-12_v2_1.sql` (повторный запуск безопасен). Он добавляет:
- поля брифа кампании: `description`, `dos`, `donts`, `brand_handle`;
- функции только для чтения агрегатов: `campaign_leaderboard`, `campaign_public_stats`,
  `creator_public_stats`, `my_referral_count`;
- `staff_verify_account` — модератор подтверждает TikTok/Instagram-аккаунт вручную.

Для новой базы достаточно `reset.sql` → `schema.sql` (v2.1 уже внутри).
Оплата CryptoPay теперь выставляется в USD (`currency_type: fiat`) — плательщик сам выбирает монету.

---

## 9. ОБНОВЛЕНИЕ СХЕМЫ v2.2 и v2.3 (2026-10-13)

Выполните по порядку в SQL Editor (оба файла можно запускать повторно):
1. `supabase/migrations/2026-10-12_v2_2.sql` — аватары клиперов на карточках Discover.
2. `supabase/migrations/2026-10-13_v2_3.sql` — настоящий мессенджер и уведомления:
   - сообщения нельзя редактировать, «прочитано» ставит только получатель;
   - чаты создаются только функциями: `start_direct` (личный чат, нужен статус команды / бренд / заработок от $1), `my_support_conversation`, `staff_room`, `campaign_room`;
   - предупреждение о контактах (Telegram, WhatsApp, телефон, email) ставит сервер;
   - таблица `notifications` заполняется триггерами (клип проверен/отклонён, кампания оплачена/одобрена/отклонена/завершена, выплата отправлена/не прошла, аккаунт подтверждён, новый клип у бренда) и добавлена в Realtime.

Проверка: Database → Replication → `supabase_realtime` должен содержать `conversations`, `direct_messages`, `notifications`.

## 10. ОБНОВЛЕНИЯ v2.4–v2.6 (2026-10-13 – 2026-10-18)

Выполните по порядку в SQL Editor (все файлы можно запускать повторно):
1. `supabase/migrations/2026-10-13_v2_4.sql` — публичные профили через `list_public_profiles()`, анонимам закрыто.
2. `supabase/migrations/2026-10-17_v2_5.sql` — чаты кампаний читают только вошедшие пользователи.
3. `supabase/migrations/2026-10-18_v2_6.sql` — проверка владельца клипа:
   - сервер при отправке клипа узнаёт, кто опубликовал видео, и сравнивает с подтверждёнными аккаунтами клипера;
     - чужое видео отклоняется;
     - если владельца прочитать не удалось, клип принимается со статусом `owner_check = 'unconfirmed'`;
   - `settle_clip` не платит за клип, у которого владелец не подтверждён: клип уходит во «Флаг», и модератор проверяет его и нажимает «Вернуть»;
   - уже существующие клипы помечаются как подтверждённые.

Необязательно: `YOUTUBE_API_KEY` в `.env.local` делает проверку владельца и подсчёт просмотров YouTube надёжнее. Без ключа используются публичные страницы.

## 11. АВТОМАТИЧЕСКИЙ ПОДСЧЁТ ПРОСМОТРОВ (2026-10-18)

1. Выполните `supabase/migrations/2026-10-18_v2_7.sql`: создаётся журнал проходов `tracking_runs`, его видят только модераторы и админы.
2. До деплоя: Админ → вкладка «Трекинг» → «Запустить сейчас».
3. После деплоя на Vercel:
   - задайте в Vercel → Settings → Environment Variables те же ключи, что в `.env.local` (включая `CRON_SECRET`);
   - скопируйте `supabase/cron/schedule_tracking.sql` в SQL Editor и **только там** замените `YOUR-SITE` и `YOUR-CRON-SECRET` в шаге 1 (секрет не сохраняйте в файл — он на GitHub);
   - выполните. Supabase будет вызывать `/api/tracking/run` каждый час (pg_cron + pg_net, значения хранятся в Vault), а ночью чистить старые логи. Скрипт можно запускать повторно, например чтобы исправить опечатку.
   - `vercel.json` дополнительно вызывает трекинг раз в день: бесплатный план Vercel чаще не позволяет.
4. Источники просмотров:
   - **YouTube:** публичная страница, с `YOUTUBE_API_KEY` — официальный API.
   - **TikTok:** embed-страница, затем страница видео. TikTok периодически блокирует серверы.
   - **Instagram:** публичная страница. Просмотры Reels чаще всего скрыты.
   - **Платный резерв для TikTok/Instagram:** `SCRAPECREATORS_API_KEY` (scrapecreators.com, ~1 кредит за запрос). Без ключа такие клипы уходят модераторам: они вносят просмотры по скриншоту аналитики.

## 12. СТАТИСТИКА И СОХРАНЁННЫЕ КАМПАНИИ — v2.8 (2026-10-18)

Выполните `supabase/migrations/2026-10-18_v2_8.sql` (можно запускать повторно):
- `clip_earnings` — журнал начислений: каждая выплата по клипу пишется отдельной строкой (`settle_clip` обновлён). Старые начисления переносятся одной строкой на клип.
- `saved_campaigns` — закладки на Discover (каждый видит только свои).
- `stats_series(scope, id, days, tz)` — дневные просмотры, деньги и клипы для графиков. Права проверяются внутри функции:
  - `me` — свои клипы;
  - `brand` — клипы на своих кампаниях;
  - `campaign` — бренд кампании или staff;
  - `clip` — владелец, бренд или staff;
  - `platform` — только staff.
- `campaign_analytics(id)` — сводка по кампании (бренд или staff), `platform_analytics(days)` — сводка по платформе (только админ).

Без миграции всё работает как раньше, просто графики пустые.
