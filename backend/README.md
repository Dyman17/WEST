# WEST Backend

Demo backend for the hackathon frontend with file-backed persistence and a Postgres-ready schema.

## Run

```bash
cd backend
npm run dev
```

Default base URL: `http://localhost:8787`

## Persistence

- Demo data is saved to `data/west-demo-store.json` by default.
- Override with `WEST_DATA_FILE` if you want to store it elsewhere.
- `supabase/schema.sql` contains a starter Postgres schema that matches the demo API.
- The backend seeds both the demo tables and the AI prompt/history tables on first Postgres start.
- Full handoff doc: `TECHNICAL_GUIDE.md`

## AI

- Set `OPENAI_API_KEY` to enable real analysis generation.
- Default model: `o4-mini`.
- If the key is missing, the backend falls back to deterministic demo analysis so the app still runs.

## Demo accounts

All demo passwords are `1234`.

| Login | Role |
| --- | --- |
| `admin@west.local` | `admin` |
| `shipper@west.local` | `shipper` |
| `carrier@west.local` | `carrier` |

## Main endpoints

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `GET /api/users`
- `GET /api/drivers`
- `GET /api/drivers/recommendations`
- `GET /api/freights`
- `GET /api/freights/feed`
- `POST /api/freights/:id/decision`
- `GET /api/ports`
- `GET /api/ports/:id/slots`
- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/lessons`
- `GET /api/ratings`
- `GET /api/trajectories`
- `GET /api/dashboard`
- `GET /api/ai/prompts`
- `GET /api/ai/analyses`
- `GET /api/ai/forecast`
- `POST /api/ai/order-suggestion`
- `POST /api/ai/match-explanation`
- `POST /api/ai/backhaul`
- `POST /api/ai/customs/analyze`

## Notes

- CORS is enabled for local frontend development.
- The API can be migrated to Postgres/Supabase without changing the frontend contract.
