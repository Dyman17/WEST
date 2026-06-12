# WEST — technical overview

`README.md` is the top-level project handoff for the next developer.  
It is intentionally outside `frontend/`, `backend/`, and `backend/supabase/`.

## 1) Product

WEST is a logistics digital twin for Mangystau.
It has exactly three roles:

- `shipper` — грузоотправитель
- `carrier` — перевозчик
- `admin` — акимат / system administrator

Core rule:

- on first visit the user lands on auth;
- after login the UI shows only the role-specific interface;
- roles are isolated in both frontend routing and backend access control.

## 2) User flow

### Public entry

- Landing page shows product pitch and auth entry points.
- Language and theme toggles are available before login.
- Registration requires role selection.

### After authentication

- `shipper` sees shipper dashboard only.
- `carrier` sees carrier dashboard only.
- `admin` sees akimat analytics only.
- Each role has a compact profile card after login.

### Main actions by role

**Shipper**

- create shipment request;
- choose carrier manually or by recommendation;
- track shipment on the map;
- pay in demo mode;
- leave a review after delivery.

**Carrier**

- browse freight feed;
- swipe like/dislike;
- accept matched shipment;
- start transit and finish delivery;
- book port slots;
- view reputation and training content.

**Admin**

- monitor regional statistics;
- inspect carrier rankings;
- view congestion and forecast;
- update demo congestion data when needed.

## 3) Architecture

```text
[Vercel Frontend]
      |
      | HTTPS / JSON
      v
[Render / Node.js API]
      |
      +--> [PostgreSQL]
      +--> [OpenAI o4-mini]
      +--> [Storage / seed data]
```

### Frontend

- React + Vite
- role-based routing
- auth-first navigation
- Leaflet map
- local UI state for theme/language only
- backend-driven data for business entities

### Backend

- Express API
- PostgreSQL-first
- legacy/demo compatibility layer is still supported
- AI endpoints are isolated from the business CRUD layer

## 4) Frontend structure

Important pages:

- `AuthPage` — login / register
- `HomePage` — landing
- `DashboardPage` — akimat analytics
- `TinderPage` — freight feed
- `TrackingPage` — live shipment tracking
- `BookingPage` — port reservation slots
- `CarriersPage` — carrier directory
- `RatingPage` — carrier reputation
- `BackhaulPage` — return / along-way offers
- `CreateOrderPage` — shipment creation

The frontend should not contain business fallbacks for these pages.
It must call the backend API and render backend data.

## 5) Backend data model

### Canonical tables

- `users` — shared identity record
- `shipper_profiles` — shipper-specific data
- `carrier_profiles` — carrier-specific data
- `shipments` — freight orders
- `locations` — ports, borders, cities, rail terminals
- `tracking_points` — GPS history
- `port_bookings` — reserved port slots
- `reviews` — delivery reviews
- `violations` — late / cancel / damage penalties
- `tinder_likes` — swipe actions
- `matches` — matched orders
- `empty_load_offers` — along-way / return suggestions
- `ai_prompts` — reusable prompt templates
- `ai_analyses` — AI output history
- `akimat_analytics_daily` — daily analytics cache

### Legacy compatibility tables

These still exist for current demo compatibility:

- `drivers`
- `freights`
- `ports`
- `bookings`
- `lessons`
- `trajectories`
- `rating_rules`
- `freight_decisions`

They should be treated as compatibility data, not the final canonical model.

## 6) API surface

Base URL in production:

- `https://api.west.kz/v1`

Auth:

- `Authorization: Bearer <JWT>`

### Auth and profile

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/me`
- `PUT /api/auth/me/role-details`

### Shipments

- `POST /api/shipments`
- `GET /api/shipments`
- `GET /api/shipments/:id`
- `PUT /api/shipments/:id/assign`
- `PUT /api/shipments/:id/status`
- `DELETE /api/shipments/:id`

### Freight Tinder

- `GET /api/freights/feed`
- `POST /api/freights/:id/decision`
- `GET /api/freights/recommendations`

### Tracking

- `POST /api/tracking/update`
- `GET /api/tracking/shipment/:id`
- `GET /api/trajectories`

### Carriers

- `GET /api/drivers`
- `GET /api/drivers/recommendations`
- `GET /api/ratings`

### Ports and booking

- `GET /api/ports`
- `GET /api/ports/:id`
- `GET /api/ports/:id/slots`
- `GET /api/bookings`
- `POST /api/bookings`

### AI

- `GET /api/ai/prompts`
- `GET /api/ai/analyses`
- `GET /api/ai/forecast`
- `GET /api/ai/order-suggestion`
- `GET /api/ai/match-explanation`
- `GET /api/ai/backhaul`
- `POST /api/ai/customs/analyze`

### Admin

- `GET /api/dashboard`
- `GET /api/admin/stats/overview`
- `GET /api/admin/stats/saved`
- `GET /api/admin/carriers`
- `GET /api/congestion/latest`
- `GET /api/predictions`

### Training

- `GET /api/lessons`

## 7) AI layer

### Model

- `o4-mini`

### Required environment variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL=o4-mini`
- `OPENAI_REASONING_EFFORT=medium`

### Prompt rules

Use strict prompts. The model must:

- use only the provided input;
- never invent missing documents, distances, prices, or dates;
- state uncertainty clearly;
- return short structured output;
- keep a machine-readable JSON block for the UI.

### Recommended customs prompt

```text
You are WEST Customs Translator for logistics documents.
Analyze only the provided input.

Rules:
1. Do not invent missing facts.
2. If data is incomplete, say exactly what is missing.
3. Return concise output in the same language as the input.
4. Always produce valid JSON with these keys:
   - summary
   - warnings
   - missing_docs
   - risk_level
   - recommendations
5. If the route crosses a border, mention only the documents that are actually required for that route.
6. If there is no reliable evidence, mark the item as "unknown".

Input:
{document_text}
```

### Example output

```json
{
  "summary": "Possible transit route with border checks",
  "warnings": [
    "Certificate of origin is missing",
    "Transit declaration is required"
  ],
  "missing_docs": ["Certificate of Origin", "Transit Declaration"],
  "risk_level": "medium",
  "recommendations": [
    "Verify border requirements before dispatch",
    "Attach the missing documents"
  ]
}
```

## 8) Database workflow

### Local / production setup

1. Create PostgreSQL database.
2. Set `DATABASE_URL`.
3. Run migrations:
   - `npm run migrate`
4. Seed demo data:
   - `npm run seed`
5. Start backend:
   - `npm run backend:dev`
6. Start frontend:
   - `npm run dev`

### What the seeds should contain

- 3 demo users for each role
- sample ports
- demo shipments
- demo tracking points
- demo port bookings
- demo reviews
- demo AI prompt templates
- demo analytics rows

## 9) Environment variables

### Backend

- `DATABASE_URL`
- `PORT`
- `CORS_ORIGIN`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_REASONING_EFFORT`
- `OPENWEATHER_API_KEY` if weather is enabled

### Frontend

- `VITE_API_BASE_URL`
- `VITE_APP_NAME`
- `VITE_DEFAULT_THEME`

### Deployment

- Render backend uses `DATABASE_URL` and OpenAI vars.
- Vercel frontend uses `VITE_API_BASE_URL`.
- Postgres can be managed PostgreSQL, Supabase, Railway, or Render Postgres.

## 10) Deployment plan

### Backend on Render

1. Connect repo or deploy backend directory.
2. Set environment variables.
3. Run `npm install`.
4. Run migrations and seeds once.
5. Start backend service.

### Frontend on Vercel

1. Point Vercel to the frontend build entry.
2. Set `VITE_API_BASE_URL`.
3. Build command: `npm run build`.
4. Output is the Vite production bundle.

### Database

1. Provision PostgreSQL.
2. Apply `backend/supabase/schema.sql`.
3. Run `npm run migrate` if the DB is empty.
4. Run `npm run seed`.

## 11) Demo accounts

Use these for local demo:

- `admin@west.local / 1234`
- `shipper@west.local / 1234`
- `carrier@west.local / 1234`
- `port@west.local / 1234`
- `driver@west.local / 1234`
- `trainee@west.local / 1234`

## 12) Current status

Current high-value items are already in place:

- auth-first routing;
- role isolation;
- backend-driven pages for the main workflows;
- Leaflet map;
- freight feed;
- port booking;
- rating/reputation;
- admin analytics;
- PostgreSQL migration/seed scripts;
- build passes after removing the analytics placeholder.

## 13) Next cleanup items

- keep removing any remaining demo-only UI data;
- replace legacy compatibility tables only after the canonical tables are fully adopted;
- connect production environments:
  - Render for backend
  - Vercel for frontend
  - Postgres for data
- keep AI responses strict and structured.

## 14) Windows launcher

`run-west.bat` is the local launcher for Windows.
It should:

- build the frontend/backend bundle;
- start the stack;
- fail fast if build fails.

#   W E S T  
 