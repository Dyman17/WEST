# WEST Backend Technical Guide

Этот файл нужен следующему backend-разработчику.  
Корневой обзор проекта лежит в `README.md`, а здесь — только backend-детали.

## 1. Назначение backend

Backend WEST сейчас делает 4 вещи:

- даёт auth endpoint-ы для входа / регистрации;
- отдаёт данные для фронта по ролям;
- хранит demo-store или PostgreSQL-данные;
- вызывает AI и пишет историю ответов.

Backend работает с тремя ролями:

- `admin`
- `shipper`
- `carrier`

Старые роли `driver`, `port_manager`, `trainee` больше не используются как пользовательские роли.

## 2. Текущая архитектура

```text
[Vercel Frontend]
      |
      | HTTPS JSON
      v
[WEST Backend Node.js]
      |
      +--> [PostgreSQL / Supabase Postgres]
      |
      +--> [OpenAI Responses API]
```

### Режимы хранения

- если `DATABASE_URL` не задан, backend работает с demo JSON store;
- если `DATABASE_URL` задан, backend работает с Postgres;
- AI-подсистема пишет prompt history и analysis history в БД;
- auth в demo-режиме — локальный token store в памяти;
- для production нужно перейти на Supabase Auth или полноценные JWT-сессии.

## 3. Каноническая схема данных

### Основные таблицы

- `users` — единый профиль;
- `shipper_profiles` — поля грузоотправителя;
- `carrier_profiles` — поля перевозчика;
- `locations` — порты, КПП, города, ж/д терминалы;
- `shipments` — заявки на перевозку;
- `tracking_points` — трекинг;
- `port_bookings` — брони слотов;
- `reviews` — отзывы;
- `violations` — нарушения;
- `tinder_likes` — лайки / дизлайки;
- `matches` — совпадения;
- `empty_load_offers` — попутные / обратные грузы;
- `ai_prompts` — шаблоны AI;
- `ai_analyses` — история AI ответов;
- `akimat_analytics_daily` — дашборд акимата.

### Зачем разделение нужно

- profile data не смешивается с order data;
- shipper и carrier имеют разные поля;
- akimat analytics не живёт в той же таблице, что и заявки;
- проще настраивать RLS и отчёты;
- проще мигрировать backend в настоящий Postgres.

### Legacy compatibility tables

Пока backend ещё использует demo-store имена таблиц:

- `drivers`
- `freights`
- `ports`
- `bookings`
- `lessons`
- `trajectories`
- `rating_rules`
- `freight_decisions`

Их нужно держать, пока слой хранения не переведён полностью на каноническую схему.

## 4. AI layer

### Default model

- `o4-mini`

### Environment variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL=o4-mini`
- `OPENAI_REASONING_EFFORT=medium`

### Prompt policy

Промпты должны:

- использовать только входные данные;
- не выдумывать цены, адреса, координаты и документы;
- явно писать, что данных не хватает;
- отвечать коротко;
- возвращать итог + 2–3 пункта;
- отвечать на языке запроса.

### Main prompt keys

- `map_forecast`
- `order_suggestion`
- `tinder_match`
- `backhaul_match`
- `customs_analysis`
- `dashboard_summary`

### Where prompts live

- seed data: `backend/src/data.js`
- runtime prompts: `ai_prompts`
- runtime history: `ai_analyses`

## 5. Auth and tokens

### Current demo flow

- `POST /api/auth/login` returns `{ token, user }`
- `POST /api/auth/register` returns `{ token, user }`
- frontend stores token in `localStorage`
- frontend sends `Authorization: Bearer <token>`

### Important limitation

Demo token is not a full JWT and lives only in memory on the backend.  
For production, replace it with:

- Supabase Auth;
- or a JWT session store with refresh tokens.

## 6. Main API endpoints

### Auth

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Users / core data

- `GET /api/users`
- `GET /api/drivers`
- `GET /api/drivers/recommendations`
- `GET /api/freights`
- `GET /api/freights/feed`
- `POST /api/freights/:id/decision`
- `GET /api/ports`
- `GET /api/ports/:id`
- `GET /api/ports/:id/slots`
- `GET /api/bookings`
- `POST /api/bookings`
- `GET /api/lessons`
- `GET /api/ratings`
- `GET /api/trajectories`
- `GET /api/dashboard`

### AI

- `GET /api/ai/prompts`
- `GET /api/ai/analyses`
- `GET /api/ai/forecast`
- `POST /api/ai/order-suggestion`
- `POST /api/ai/match-explanation`
- `POST /api/ai/backhaul`
- `POST /api/ai/customs/analyze`

## 7. Frontend integration points

- `MapPage` -> `/api/ai/forecast`
- `CreateOrderPage` -> `/api/ai/order-suggestion`
- `TinderPage` -> `/api/ai/match-explanation`
- `BackhaulPage` -> `/api/ai/backhaul`
- future customs UI -> `/api/ai/customs/analyze`

## 8. Environment variables

### Backend

- `PORT=8787`
- `DATABASE_URL=postgresql://...`
- `OPENAI_API_KEY=sk-...`
- `OPENAI_MODEL=o4-mini`
- `OPENAI_REASONING_EFFORT=medium`
- `FRONTEND_ORIGIN=https://...`
- `NODE_ENV=development|production`
- `WEST_DATA_FILE=./data/west-demo-store.json`

### Frontend

- `VITE_BACKEND_URL=https://your-backend.onrender.com`
- `VITE_API_BASE_URL=https://your-backend.onrender.com`

## 9. Deploy notes

### Render backend

1. Create a Node service.
2. Set env vars.
3. Point `DATABASE_URL` to Supabase / Postgres.
4. Set `OPENAI_MODEL=o4-mini`.
5. Deploy from repository.

### PostgreSQL / Supabase

1. Apply `backend/supabase/schema.sql`.
2. Insert seed data.
3. Enable RLS.
4. Add policies for role isolation.

## 10. What to keep in sync

- if you change roles, update:
  - `backend/src/server.js`
  - `backend/src/storage.js`
  - `backend/src/data.js`
  - frontend role config
  - schema checks
  - docs
- if you change AI prompt logic, update:
  - seed prompts
  - runtime prompt table
  - analysis history format

