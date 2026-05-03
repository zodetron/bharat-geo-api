# Bharat Geo API — India Village Geo Data API

A production-grade SaaS platform serving India's complete village-level geographical hierarchy from Census 2011. Covers **619,500+ villages** across **30 states** via a authenticated, rate-limited REST API.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Task Breakdown](#task-breakdown)
   - [Task 1 — Database Design](#task-1--database-design)
   - [Task 2 — Database Setup](#task-2--database-setup)
   - [Task 3 — Data Import Script](#task-3--data-import-script)
   - [Task 4 — Basic Backend Setup](#task-4--basic-backend-setup)
   - [Task 5 — Core APIs](#task-5--core-apis)
   - [Task 6 — Search + Autocomplete](#task-6--search--autocomplete)
   - [Task 7 — Auth System](#task-7--auth-system)
   - [Task 8 — API Key System](#task-8--api-key-system)
   - [Task 9 — Rate Limiting](#task-9--rate-limiting)
   - [Task 10 — Logging System](#task-10--logging-system)
   - [Task 11 — Admin Dashboard](#task-11--admin-dashboard)
   - [Task 12 — B2B Client Portal](#task-12--b2b-client-portal)
   - [Task 13 — Demo Client](#task-13--demo-client)
5. [Full Setup Guide](#full-setup-guide)
6. [Running Everything](#running-everything)
7. [API Reference](#api-reference)
8. [Environment Variables](#environment-variables)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Apps                              │
│  demo/ (port 5176)  client-portal/ (5175)  admin/ (5174)       │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP (proxied via Vite dev server)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Express API  (port 3000)                        │
│                                                                 │
│  requestLogger → apiKeyAuth → rateLimiter → controller          │
│                                                                 │
│  /api/v1/auth/*       JWT authentication                        │
│  /api/v1/api-keys/*   API key management (JWT)                  │
│  /api/v1/admin/*      Admin endpoints (JWT + ADMIN role)        │
│  /api/v1/client/*     Client usage endpoints (JWT)              │
│  /api/v1/states/*     Geo hierarchy  ─┐                         │
│  /api/v1/districts/*  Geo hierarchy   ├─ require API Key        │
│  /api/v1/search       Search         ─┘                         │
└───────────────┬─────────────────────┬───────────────────────────┘
                │                     │
                ▼                     ▼
       PostgreSQL (NeonDB)     Redis (Upstash)
       - Geo hierarchy         - Search cache (5 min)
       - Users & ApiKeys       - Autocomplete cache (2 min)
       - ApiLogs (BigInt id)   - Rate limit counters (daily)
                                - API key validation cache (1 min)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Server | Node.js + Express |
| ORM | Prisma 6 (PostgreSQL) |
| Database | NeonDB (serverless Postgres) |
| Cache / Rate Limit | Upstash Redis (REST) |
| Auth | JWT + bcryptjs |
| Admin Dashboard | React + Vite + Tailwind + Recharts |
| Client Portal | React + Vite + Tailwind + Recharts |
| Demo App | React + Vite + Tailwind |
| Data Import | Python 3 + pandas + psycopg2 |

---

## Project Structure

```
Bharat Geo API - 01/
├── server.js                    # Express entry point
├── prisma/
│   ├── schema.prisma            # Database schema (8 models)
│   ├── seed.js                  # Seeds Country = India
│   └── migrations/
│       └── 20240430000000_init/ # Initial SQL migration
│           └── migration.sql
├── src/
│   ├── lib/
│   │   ├── prisma.js            # Singleton Prisma client
│   │   └── redis.js             # Upstash Redis wrapper
│   ├── middleware/
│   │   ├── authenticate.js      # JWT verify + requireRole()
│   │   ├── apiKeyAuth.js        # X-API-Key header validation
│   │   ├── rateLimiter.js       # Redis daily counter per key
│   │   ├── requestLogger.js     # res.on('finish') fire-and-forget
│   │   └── errorHandler.js      # Global 404 + error handler
│   ├── routes/
│   │   ├── index.js             # Mounts all routers
│   │   ├── auth.routes.js       # register / login / me
│   │   ├── apiKey.routes.js     # create / list / revoke
│   │   ├── admin.routes.js      # stats / analytics / users
│   │   ├── client.routes.js     # usage / usage/daily
│   │   ├── geo.routes.js        # states / districts / subdistricts / villages
│   │   └── search.routes.js     # search / autocomplete
│   ├── controllers/             # Thin request handlers
│   ├── services/                # Business logic + DB queries
│       ├── auth.service.js
│       ├── apiKey.service.js
│       ├── admin.service.js
│       ├── client.service.js
│       ├── geo.service.js
│       ├── search.service.js
│       └── log.service.js
├── scripts/
│   └── import_data.py           # Census 2011 data import
├── dataset/                     # 30 XLS/ODS state files (Census 2011)
├── admin/                       # React admin dashboard (port 5174)
├── client-portal/               # React B2B client portal (port 5175)
├── demo/                        # React village autocomplete demo (port 5176)
├── .env                         # Environment variables (not committed)
└── .env.example                 # Template
```

---

## Task Breakdown

### Task 1 — Database Design

**File:** `prisma/schema.prisma`

Designed a normalized PostgreSQL schema (3NF) with 8 models and 3 enums.

**Geographical hierarchy:**
```
Country → State → District → SubDistrict → Village
```

**All models:**

| Model | Key fields | Notes |
|---|---|---|
| `Country` | name, isoCode | Root — seeded with India (IND) |
| `State` | name, censusCode, countryId | Unique per (censusCode, countryId) |
| `District` | name, censusCode, stateId | Unique per (censusCode, stateId) |
| `SubDistrict` | name, censusCode, districtId | Unique per (censusCode, districtId) |
| `Village` | name, censusCode, subDistrictId, population fields | Unique per (censusCode, subDistrictId) |
| `User` | email, passwordHash, fullName, role, status | ADMIN / CLIENT; PENDING / ACTIVE / SUSPENDED |
| `ApiKey` | keyPrefix (public), secretHash, plan, userId | FREE / PREMIUM / PRO / UNLIMITED |
| `ApiLog` | BigInt id, endpoint, method, statusCode, responseTime | Indexed for analytics queries |

Census codes stored as strings to preserve leading zeros (e.g. state `"02"`). Every name column is indexed for fast ILIKE searches. `ApiLog.id` is `BigInt` — this table grows into tens of millions of rows.

---

### Task 2 — Database Setup

**Files:** `package.json`, `.env`, `.env.example`, `.gitignore`, `prisma/migrations/`, `prisma/seed.js`

- Initialized Node.js project with npm scripts for all Prisma operations
- Created `prisma/migrations/20240430000000_init/migration.sql` — hand-crafted SQL matching the schema exactly (all tables, enums, indexes, FK constraints)
- Created `prisma/seed.js` — idempotent upsert of `Country = India`
- Downgraded Prisma to v6 (stable LTS) — Prisma v7 changed the config API requiring TypeScript

**Apply migrations to NeonDB:**
```bash
# 1. Add your DATABASE_URL to .env
# 2. Run:
npx prisma migrate deploy
npm run db:seed
```

---

### Task 3 — Data Import Script

**File:** `scripts/import_data.py`

Reads all 30 XLS/ODS files from `/dataset` (Census 2011 village directory) and imports the full hierarchy into PostgreSQL.

**Key implementation details:**
- Multi-sheet awareness — Madhya Pradesh has 2 sheets; script finds `Village Directory` sheet by name first, falls back to first sheet with matching columns
- Column validation — skips files missing any of the 8 required columns
- Deduplication — `drop_duplicates()` before processing; `ON CONFLICT DO NOTHING/UPDATE` in DB
- Row classification — village rows have `MDDS PLCN > 0`; district/state summary rows are skipped
- Per-file in-memory caches for State, District, SubDistrict IDs — avoids redundant DB round-trips
- Batch inserts of 5,000 villages at a time via `psycopg2.extras.execute_values`
- Timestamped log file written to `scripts/`

**Dataset stats:** 619,500 villages across 30 states, 0 parse errors.

**Run:**
```bash
# Activate venv
source .venv/bin/activate       # macOS/Linux
# or: .venv\Scripts\activate    # Windows

python scripts/import_data.py
```

---

### Task 4 — Basic Backend Setup

**Files:** `server.js`, `src/lib/prisma.js`, `src/middleware/errorHandler.js`, `src/routes/index.js`

- Express server with `dotenv`, `express.json()`, global `requestLogger`
- Singleton Prisma client — prevents connection pool exhaustion
- Global error handler returns `{ success: false, error }` — consistent shape for all errors; stack traces only in `NODE_ENV=development`
- `GET /api/v1/health` returns `{ success: true, status: "ok", timestamp }`
- Clean `SIGINT` handler disconnects Prisma before exit

**Run:**
```bash
npm run dev     # nodemon (hot reload)
npm start       # production
```

---

### Task 5 — Core APIs

**Files:** `src/services/geo.service.js`, `src/controllers/geo.controller.js`, `src/routes/geo.routes.js`

Four paginated endpoints returning the full geo hierarchy. All require an API key (Task 8).

| Endpoint | Description |
|---|---|
| `GET /api/v1/states` | All states, paginated |
| `GET /api/v1/states/:id/districts` | Districts in a state |
| `GET /api/v1/districts/:id/subdistricts` | Sub-districts in a district |
| `GET /api/v1/subdistricts/:id/villages` | Villages in a sub-district |

**Pagination params:** `?page=1&limit=20` (max limit: 100)

**Response shape:**
```json
{
  "success": true,
  "state": { "id": 1, "name": "Himachal Pradesh", "censusCode": "02" },
  "data": [ ... ],
  "pagination": {
    "total": 250, "page": 1, "limit": 20,
    "totalPages": 13, "hasNext": true, "hasPrev": false
  }
}
```

Parent context (state/district/subdistrict) is always included in nested responses. Prisma `$transaction` used to fetch count + data atomically.

---

### Task 6 — Search + Autocomplete

**Files:** `src/lib/redis.js`, `src/services/search.service.js`, `src/controllers/search.controller.js`, `src/routes/search.routes.js`

| Endpoint | Description |
|---|---|
| `GET /api/v1/search?q=&type=&page=&limit=` | Full-text search across all geo levels |
| `GET /api/v1/autocomplete?q=&type=` | Fast dropdown suggestions (top 10) |

**`type` param:** `state | district | subdistrict | village | all` (default: `all` for search, `village` for autocomplete)

**Redis caching:**
- Search results: key `search:{q}:{type}:{page}:{limit}` — **5 min TTL**
- Autocomplete: key `ac:{q}:{type}` — **2 min TTL**
- Redis failure degrades silently to direct DB — API never crashes

**Validation:** `q` must be ≥ 2 characters → `400` otherwise

Case-insensitive matching via Prisma `mode: "insensitive"` (uses `ILIKE` on PostgreSQL).

---

### Task 7 — Auth System

**Files:** `src/services/auth.service.js`, `src/middleware/authenticate.js`, `src/controllers/auth.controller.js`, `src/routes/auth.routes.js`

| Endpoint | Description |
|---|---|
| `POST /api/v1/auth/register` | Creates user with `status=PENDING` |
| `POST /api/v1/auth/login` | Returns JWT (only if `status=ACTIVE`) |
| `GET /api/v1/auth/me` | Current user (requires Bearer token) |

**Security decisions:**
- `register` always creates `PENDING` users — no one gets API access without admin approval
- Login returns generic `"Invalid credentials"` for both wrong email and wrong password (no user enumeration)
- `passwordHash` is never included in any response
- bcrypt cost factor = 12
- `requireRole('ADMIN')` middleware available for admin-only routes

**Usage:**
```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@co.com","password":"secret123","fullName":"Jane Doe","company":"Acme"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@co.com","password":"secret123"}'

# Me
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

### Task 8 — API Key System

**Files:** `src/services/apiKey.service.js`, `src/middleware/apiKeyAuth.js`, `src/controllers/apiKey.controller.js`, `src/routes/apiKey.routes.js`

| Endpoint | Description |
|---|---|
| `POST /api/v1/api-keys` | Generate new key (JWT required) |
| `GET /api/v1/api-keys` | List all your keys (JWT required) |
| `DELETE /api/v1/api-keys/:id` | Revoke a key (JWT required) |

**Key format:** `bsk_<12 hex chars>.<64 hex chars>`
- Prefix (`bsk_xxxxxx`) — stored in DB, used for lookup
- Secret (`yyyyyy…`) — hashed and stored, **shown only once**

**Validation method:** SHA-256 (not bcrypt) with `crypto.timingSafeEqual` — fast enough for per-request middleware, secure for random secrets.

**Redis caching:** validated keys cached for 60 seconds (`apikey:{prefix}`) — cache busted immediately on revoke.

**Usage:**
```bash
# Create key
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{"plan":"FREE"}'

# Use key on geo endpoints
curl http://localhost:3000/api/v1/states \
  -H "X-API-Key: bsk_yourprefix.yoursecret"
```

---

### Task 9 — Rate Limiting

**File:** `src/middleware/rateLimiter.js`

Redis-based daily request counter per API key. Applied after `apiKeyAuth` (so `req.apiKey.plan` is available).

| Plan | Daily Limit |
|---|---|
| FREE | 5,000 |
| PREMIUM | 50,000 |
| PRO | 300,000 |
| UNLIMITED | 1,000,000 |

**Implementation:**
- Redis key: `rl:{apiKeyId}:YYYY-MM-DD` (resets at midnight UTC)
- `INCR` is atomic — safe under concurrent requests
- `EXPIRE` set only on first increment (`count === 1`) — never resets TTL on subsequent requests
- Gracefully allows all traffic if Redis is down

**Response headers on every API call:**
```
X-RateLimit-Limit:     5000
X-RateLimit-Remaining: 4999
X-RateLimit-Reset:     1746057600   (unix timestamp of next midnight UTC)
X-RateLimit-Plan:      FREE
```

**429 response:**
```json
{
  "success": false,
  "error": "Daily rate limit exceeded.",
  "plan": "FREE",
  "limit": 5000,
  "resetAt": "2026-05-01T00:00:00.000Z"
}
```

---

### Task 10 — Logging System

**Files:** `src/services/log.service.js`, `src/middleware/requestLogger.js`

Every API request is logged to the `api_logs` table asynchronously.

**Implementation:**
- `res.on('finish')` fires after response is sent — logging never adds latency
- In-memory queue flushed every 1 second or every 100 entries (whichever comes first)
- `prisma.apiLog.createMany` — single batch insert per flush
- Logging failures are silently caught — never breaks the API
- `SIGINT`/`SIGTERM` handlers flush remaining queue before process exits
- Captures: `endpoint`, `method`, `statusCode`, `responseTime` (ms), `ipAddress`, `userAgent`, `userId`, `apiKeyId`
- Real client IP extracted from `X-Forwarded-For` (Vercel/Nginx proxy aware)

---

### Task 11 — Admin Dashboard

**Backend files:** `src/services/admin.service.js`, `src/controllers/admin.controller.js`, `src/routes/admin.routes.js`

All admin routes require `JWT + role=ADMIN`.

| Endpoint | Description |
|---|---|
| `GET /api/v1/admin/stats` | totalUsers, pendingUsers, activeKeys, todayRequests |
| `GET /api/v1/admin/analytics?days=30` | daily[], endpoints[], plans[] |
| `GET /api/v1/admin/users?status=&page=` | Paginated user list |
| `PATCH /api/v1/admin/users/:id` | `{ status: "ACTIVE" | "SUSPENDED" | "PENDING" }` |

**React app:** `admin/` — runs on port **5174**

| Page | Contents |
|---|---|
| Login | Email/password, rejects non-ADMIN accounts |
| Dashboard | 4 stat cards + 14-day area chart (Recharts) |
| Users | Paginated table, status filter, Approve/Suspend actions |
| Analytics | Daily bar chart, top endpoints table, plan distribution pie chart |

**Run:**
```bash
cd admin
npm run dev    # http://localhost:5174
```

---

### Task 12 — B2B Client Portal

**Backend files:** `src/services/client.service.js`, `src/routes/client.routes.js`

| Endpoint | Description |
|---|---|
| `GET /api/v1/client/usage` | Per-key live counters (from Redis) + recent request log |
| `GET /api/v1/client/usage/daily?days=14` | Daily request aggregation for the authenticated user |

**React app:** `client-portal/` — runs on port **5175**

| Page | Contents |
|---|---|
| Register | Signup form → `status=PENDING` → "awaiting approval" confirmation |
| Login | Standard login; clear error if account is still pending |
| Dashboard | Per-key usage bars (live Redis counters), 14-day chart, recent request log |
| API Keys | Generate key (plan picker), one-time reveal with copy button, revoke |
| Docs | Inline API reference: curl examples, rate limit table, endpoint samples |

**Run:**
```bash
cd client-portal
npm run dev    # http://localhost:5175
```

---

### Task 13 — Demo Client

**React app:** `demo/` — runs on port **5176**

A single-page village autocomplete demo. Shows B2B clients how to use the API for address forms.

**Features:**
- API key gate — form is dimmed until a valid key is entered
- Type ≥2 characters → debounced 300ms → dropdown with village + breadcrumb (`SubDistrict › District › State`)
- Keyboard navigation — Arrow Up/Down to navigate, Enter to select, Escape to close
- Request cancellation via `AbortController` — stale responses discarded
- Selecting a village auto-fills Sub-District, District, State fields with a 1.2s highlight flash
- Census codes shown below the form
- Outside click closes dropdown

**Custom hook:** `src/hooks/useVillageAutocomplete.js` — debounce, abort, error handling, open/close state.

**Run:**
```bash
cd demo
npm run dev    # http://localhost:5176
```

---

## Full Setup Guide

### Prerequisites

- Node.js v18+
- Python 3.9+
- A [NeonDB](https://neon.tech) account (free tier works)
- An [Upstash](https://upstash.com) Redis account (free tier works)

### 1. Clone / open project

```bash
cd "Bharat Geo API - 01"
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"
JWT_SECRET="a-long-random-string-at-least-32-chars"
JWT_EXPIRES_IN="7d"
UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."
PORT=3000
NODE_ENV=development
```

### 3. Install API server dependencies

```bash
npm install
```

### 4. Apply database migrations

```bash
npx prisma migrate deploy
```

### 5. Generate Prisma client

```bash
npx prisma generate
```

### 6. Seed the database (Country = India)

```bash
npm run db:seed
```

### 7. Set up Python environment and import data

```bash
python3 -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows

pip install pandas xlrd openpyxl odfpy psycopg2-binary python-dotenv

python scripts/import_data.py
```

Import takes ~5–15 minutes depending on connection speed. Progress is logged to stdout and a timestamped log file.

### 8. Create an ADMIN user

After running the server, register normally then update the role directly:

```bash
# Using Prisma Studio (GUI)
npx prisma studio

# Or via psql
UPDATE users SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'admin@yourco.com';
```

### 9. Install frontend dependencies

```bash
cd admin && npm install && cd ..
cd client-portal && npm install && cd ..
cd demo && npm install && cd ..
```

---

## Running Everything

Open 4 terminal tabs:

**Tab 1 — API Server**
```bash
# In project root
npm run dev
# → http://localhost:3000
```

**Tab 2 — Admin Dashboard**
```bash
cd admin
npm run dev
# → http://localhost:5174
```

**Tab 3 — Client Portal**
```bash
cd client-portal
npm run dev
# → http://localhost:5175
```

**Tab 4 — Demo App**
```bash
cd demo
npm run dev
# → http://localhost:5176
```

### Verify the API is running

```bash
curl http://localhost:3000/api/v1/health
# {"success":true,"status":"ok","timestamp":"..."}
```

---

## API Reference

### Authentication

All geo/search endpoints require an API key in the header:

```
X-API-Key: bsk_yourprefix.yoursecret
```

Alternatively:
```
Authorization: ApiKey bsk_yourprefix.yoursecret
```

Admin and client management endpoints use JWT:
```
Authorization: Bearer <jwt_token>
```

### Geo Hierarchy Endpoints

```
GET /api/v1/states
GET /api/v1/states/:id/districts
GET /api/v1/districts/:id/subdistricts
GET /api/v1/subdistricts/:id/villages
```

All support `?page=1&limit=20` (max limit: 100).

### Search

```
GET /api/v1/search?q=mumbai&type=all&page=1&limit=20
GET /api/v1/autocomplete?q=pan&type=village
```

`type` options: `state | district | subdistrict | village | all`

### Auth

```
POST /api/v1/auth/register    Body: { email, password, fullName, company? }
POST /api/v1/auth/login       Body: { email, password }
GET  /api/v1/auth/me          Header: Authorization: Bearer <token>
```

### API Key Management (JWT required)

```
POST   /api/v1/api-keys        Body: { plan: "FREE"|"PREMIUM"|"PRO"|"UNLIMITED" }
GET    /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

### Admin (JWT + ADMIN role required)

```
GET   /api/v1/admin/stats
GET   /api/v1/admin/analytics?days=30
GET   /api/v1/admin/users?status=PENDING&page=1
PATCH /api/v1/admin/users/:id   Body: { status: "ACTIVE"|"SUSPENDED"|"PENDING" }
```

### Client Usage (JWT required)

```
GET /api/v1/client/usage
GET /api/v1/client/usage/daily?days=14
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL (caching + rate limiting disabled if absent) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| `PORT` | No | API server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |

> Redis is **optional** — the API works without it. Caching and rate limiting are silently disabled when Redis env vars are not set.

---

## npm Scripts (root)

| Script | Command | Description |
|---|---|---|
| `npm start` | `node server.js` | Start production server |
| `npm run dev` | `nodemon server.js` | Start dev server with hot reload |
| `npm run db:migrate` | `prisma migrate dev` | Create and apply a new migration |
| `npm run db:push` | `prisma db push` | Push schema without migration (dev only) |
| `npm run db:seed` | `node prisma/seed.js` | Seed Country = India |
| `npm run db:studio` | `prisma studio` | Open Prisma DB GUI |
| `npm run db:generate` | `prisma generate` | Re-generate Prisma client |
