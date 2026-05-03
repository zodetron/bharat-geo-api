# Bharat Geo API

A production-grade SaaS platform serving India's complete village-level geographical hierarchy from Census 2011. Covers **619,500+ villages** across **30 states** via an authenticated, rate-limited REST API.

---

## Overview

| | |
|---|---|
| **Data** | Census 2011 — 619,500 villages, 30 states, 640+ districts |
| **Auth** | JWT for dashboard access · API Key (`X-API-Key`) for geo endpoints |
| **Rate Limiting** | Redis-based daily counters — FREE / PREMIUM / PRO / UNLIMITED |
| **Caching** | Upstash Redis — search (5 min), autocomplete (2 min), key validation (1 min) |
| **Deployment** | Docker Compose — single gateway nginx on port 80, path-based routing |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│                                                                 │
│   https://yourdomain.com/admin    → Admin Dashboard             │
│   https://yourdomain.com/client   → Client Portal               │
│   https://yourdomain.com/demo     → Autocomplete Demo           │
│   https://yourdomain.com/api/v1/* → REST API                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ :80
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               bharatgeo_gateway  (nginx)                        │
│                                                                 │
│   location /admin/   → /usr/share/nginx/html/admin/             │
│   location /client/  → /usr/share/nginx/html/client/            │
│   location /demo/    → /usr/share/nginx/html/demo/              │
│   location /api/     → proxy_pass http://api:3000               │
└───────────────────────────┬─────────────────────────────────────┘
                            │ internal :3000
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               bharatgeo_api  (Express)                          │
│                                                                 │
│  requestLogger → apiKeyAuth → rateLimiter → controller          │
│                                                                 │
│  /api/v1/auth/*       JWT authentication                        │
│  /api/v1/api-keys/*   Key management (JWT)                      │
│  /api/v1/admin/*      Admin endpoints (JWT + ADMIN role)        │
│  /api/v1/client/*     Usage endpoints (JWT)                     │
│  /api/v1/states/*  ─┐                                           │
│  /api/v1/districts/* ├─ Geo hierarchy  (API Key required)       │
│  /api/v1/search     ─┘                                          │
└──────────────────┬────────────────────────┬─────────────────────┘
                   │                        │
                   ▼                        ▼
        PostgreSQL (NeonDB)         Redis (Upstash REST)
        Geo hierarchy               Search & autocomplete cache
        Users & API keys            Rate limit counters (daily)
        ApiLogs (BigInt id)         API key validation cache
```

### Docker Compose Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Docker network: bharatgeo_network                             │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  bharatgeo_gateway                            port 80    │  │
│  │                                                          │  │
│  │  nginx — serves all 3 static apps + proxies /api/        │  │
│  │  Built from Dockerfile.gateway (3 parallel build stages) │  │
│  └────────────────────────────┬─────────────────────────────┘  │
│                               │ http://api:3000                 │
│  ┌────────────────────────────▼─────────────────────────────┐  │
│  │  bharatgeo_api                              (internal)   │  │
│  │  Node.js + Express + Prisma                              │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                │
│  External: NeonDB (Postgres)  +  Upstash (Redis REST)          │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| API Server | Node.js + Express |
| ORM | Prisma 6 (PostgreSQL) |
| Database | NeonDB (serverless Postgres) |
| Cache / Rate Limiting | Upstash Redis (HTTP REST) |
| Auth | JWT + bcryptjs |
| Admin Dashboard | React + Vite + Tailwind + Recharts |
| Client Portal | React + Vite + Tailwind + Recharts |
| Demo App | React + Vite + Tailwind |
| Container Runtime | Docker + nginx |
| Data Import | Python 3 + pandas + psycopg2 |

---

## Project Structure

```
bharat-geo-api/
├── server.js                  # Express entry point
├── docker-compose.yml         # 4-service Docker setup
├── Dockerfile                 # API multi-stage build
├── prisma/
│   ├── schema.prisma          # 8 models, 3 enums
│   ├── seed.js                # Seeds Country = India
│   └── migrations/
├── src/
│   ├── lib/
│   │   ├── prisma.js          # Singleton Prisma client
│   │   └── redis.js           # Upstash Redis wrapper
│   ├── middleware/
│   │   ├── authenticate.js    # JWT verify + requireRole()
│   │   ├── apiKeyAuth.js      # X-API-Key validation + Redis cache
│   │   ├── rateLimiter.js     # Daily Redis counter per key
│   │   ├── requestLogger.js   # Async batched request logging
│   │   └── errorHandler.js    # Global 404 + error handler
│   ├── routes/                # auth, apiKey, admin, client, geo, search
│   ├── controllers/           # Thin request handlers
│   └── services/              # Business logic + DB queries
├── scripts/
│   ├── import_data.py         # Census 2011 bulk import
│   └── create-admin.js        # Interactive admin user creator
├── admin/                     # React admin dashboard (:5174)
│   ├── Dockerfile
│   └── nginx.conf
├── client-portal/             # React B2B client portal (:5175)
│   ├── Dockerfile
│   └── nginx.conf
├── demo/                      # React autocomplete demo (:5176)
│   ├── Dockerfile
│   └── nginx.conf
├── .env.example
└── CREATE_ADMIN.md
```

---

## Complete Setup Guide

Follow these steps in order when setting up the project for the first time.

---

### Step 1 — Prerequisites

Install the following before you begin:

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** — runs all four services
- **Node.js v18+** — needed only to run migrations and the admin-user script locally
- **Python 3.9+** — needed only to import the Census dataset (one-time)

External accounts (both have free tiers, no credit card required):

- **[NeonDB](https://neon.tech)** — serverless PostgreSQL
- **[Upstash](https://upstash.com)** — serverless Redis

---

### Step 2 — Clone the repository

```bash
git clone <your-repo-url>
cd bharat-geo-api
```

---

### Step 3 — Create your NeonDB database

1. Sign up at [neon.tech](https://neon.tech) and create a new project
2. In the Neon dashboard, open your project → **Connection Details**
3. Select **Prisma** from the connection string dropdown
4. Copy the connection string — it looks like:
   ```
   postgresql://neondb_owner:<password>@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```

---

### Step 4 — Create your Upstash Redis instance

1. Sign up at [upstash.com](https://upstash.com) and create a new Redis database
2. In the Upstash console, open your database → **REST API** tab
3. Copy the **UPSTASH_REDIS_REST_URL** and **UPSTASH_REDIS_REST_TOKEN** values

---

### Step 5 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in every value:

```env
# ── Database ────────────────────────────────────────────────────
# Paste your NeonDB connection string here (from Step 3)
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require"

# ── JWT ─────────────────────────────────────────────────────────
# Generate a random secret: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET="your-64-char-hex-string-here"
JWT_EXPIRES_IN="7d"

# ── Redis (Upstash) ─────────────────────────────────────────────
# Paste values from the Upstash REST API tab (from Step 4)
UPSTASH_REDIS_REST_URL="https://xxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXxx..."

# ── Server ──────────────────────────────────────────────────────
PORT=3000
NODE_ENV=production

# ── CORS (optional) ─────────────────────────────────────────────
# Leave commented out for local Docker — defaults to localhost ports
# CORS_ORIGINS="https://admin.yourdomain.com,https://portal.yourdomain.com"
```

Generate a secure `JWT_SECRET` in one command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 6 — Run database migrations

This creates all tables in your NeonDB. Run it once from the project root (Node.js must be installed locally for this step):

```bash
npm install
npx prisma migrate deploy
npm run db:seed
```

`db:seed` inserts the root `Country = India` record required by the import script.

---

### Step 7 — Import Census data

This is a one-time operation that loads 619,500 villages into the database.

```bash
# Create a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate         # Windows

# Install dependencies
pip install pandas xlrd openpyxl odfpy psycopg2-binary python-dotenv

# Run the import (takes 5–15 minutes)
python scripts/import_data.py
```

Progress is printed to stdout and saved to a timestamped log file in `scripts/`.

---

### Step 8 — Build and start all containers

```bash
docker-compose up --build -d
```

Docker builds two containers — the API and a single nginx gateway that serves all three frontends:

| URL | Description |
|---|---|
| http://localhost/demo | Autocomplete demo |
| http://localhost/client | B2B client portal |
| http://localhost/admin | Admin dashboard |
| http://localhost/api/v1/health | API health check |

Everything runs on **port 80**. The gateway nginx serves the three React apps as static files and proxies all `/api/*` requests to the API container internally.

Verify the API is running:

```bash
curl http://localhost/api/v1/health
# {"success":true,"status":"ok","timestamp":"..."}
```

---

### Step 9 — Create your admin user

```bash
docker exec -it bharatgeo_api node scripts/create-admin.js
```

Follow the prompts (email, name, password). Then log in at **http://localhost/admin**.

> See [CREATE_ADMIN.md](CREATE_ADMIN.md) for full details and how to reset a forgotten password.

---

### First-time checklist

```
[ ] NeonDB project created, connection string copied
[ ] Upstash Redis created, REST URL and token copied
[ ] .env filled in (DATABASE_URL, JWT_SECRET, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
[ ] npx prisma migrate deploy  — tables created
[ ] npm run db:seed             — Country = India seeded
[ ] python scripts/import_data.py — 619,500 villages imported
[ ] docker-compose up --build -d  — all 4 containers running
[ ] Admin user created via create-admin.js
[ ] Logged in at http://localhost/admin
```

---

## Importing Census Data

The geo hierarchy must be imported before the API returns any data. This is a one-time operation.

### Prerequisites

```bash
python3 -m venv .venv
source .venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows

pip install pandas xlrd openpyxl odfpy psycopg2-binary python-dotenv
```

### Run the import

```bash
python scripts/import_data.py
```

Reads all 30 XLS/ODS files from `/dataset` (Census 2011 village directory) and inserts the full hierarchy. Takes 5–15 minutes depending on connection speed. Progress is printed to stdout and written to a timestamped log file. 

**Result:** 619,500 villages, 30 states, 640+ districts, 5,900+ sub-districts.

---

## Docker Operations

```bash
# Start all containers (detached)
docker-compose up -d

# Rebuild after code changes
docker-compose up --build -d

# View API logs (live)
docker logs -f bharatgeo_api

# View gateway logs (live)
docker logs -f bharatgeo_gateway

# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Restart a single service
docker-compose restart api
docker-compose restart gateway

# Open a shell in the API container
docker exec -it bharatgeo_api sh

# Create admin user
docker exec -it bharatgeo_api node scripts/create-admin.js
```

---

## API Reference

### Authentication

Geo and search endpoints require an API key:
```
X-API-Key: bsk_yourprefix.yoursecret
```

Admin and portal endpoints use JWT:
```
Authorization: Bearer <token>
```

### Endpoints

#### Auth
```
POST /api/v1/auth/register    { email, password, fullName, company? }
POST /api/v1/auth/login       { email, password }
GET  /api/v1/auth/me
```

#### Geo Hierarchy  *(API Key required)*
```
GET /api/v1/states
GET /api/v1/states/:id/districts
GET /api/v1/districts/:id/subdistricts
GET /api/v1/subdistricts/:id/villages
```
All support `?page=1&limit=20` (max: 100).

#### Search  *(API Key required)*
```
GET /api/v1/search?q=mumbai&type=all&page=1&limit=20
GET /api/v1/autocomplete?q=pan&type=village
```
`type`: `state | district | subdistrict | village | all`

#### API Keys  *(JWT required)*
```
POST   /api/v1/api-keys
GET    /api/v1/api-keys
DELETE /api/v1/api-keys/:id
```

#### Admin  *(JWT + ADMIN role)*
```
GET   /api/v1/admin/stats
GET   /api/v1/admin/analytics?days=30
GET   /api/v1/admin/users?status=PENDING&page=1
PATCH /api/v1/admin/users/:id    { status: "ACTIVE"|"SUSPENDED"|"PENDING" }
PATCH /api/v1/admin/api-keys/:id { plan: "FREE"|"PREMIUM"|"PRO"|"UNLIMITED" }
```

#### Client Usage  *(JWT required)*
```
GET /api/v1/client/usage
GET /api/v1/client/usage/daily?days=14
```

### Rate Limits

| Plan | Requests / Day |
|---|---|
| FREE | 5,000 |
| PREMIUM | 50,000 |
| PRO | 300,000 |
| UNLIMITED | 1,000,000 |

Rate limit headers are included on every API response:
```
X-RateLimit-Limit: 5000
X-RateLimit-Remaining: 4850
X-RateLimit-Reset: 1746057600
X-RateLimit-Plan: FREE
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | NeonDB PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens (min 32 chars) |
| `JWT_EXPIRES_IN` | No | Token expiry — default `7d` |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (defaults to localhost ports) |
| `PORT` | No | API port — default `3000` |
| `NODE_ENV` | No | `development` or `production` |

> Redis is optional. Without it, caching and rate limiting are silently disabled and all requests are passed through.

---

## Database Schema

```
Country
  └── State (censusCode)
        └── District (censusCode)
              └── SubDistrict (censusCode)
                    └── Village (censusCode, population fields)

User (role: ADMIN | CLIENT, status: PENDING | ACTIVE | SUSPENDED)
  └── ApiKey (plan: FREE | PREMIUM | PRO | UNLIMITED)
        └── ApiLog (BigInt id — high-volume append-only)
```

---

## npm Scripts

| Script | Description |
|---|---|
| `npm start` | Start production server |
| `npm run dev` | Start dev server with hot reload (nodemon) |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:push` | Push schema changes without migration |
| `npm run db:seed` | Seed Country = India |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |
| `npm run db:generate` | Regenerate Prisma client |
