# Bharat Geo API Docker Setup

Complete Docker containerization for Bharat Geo API — a production-grade SaaS platform for India's village-level geographical data.

## Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git (to clone the repo)

### 1. Environment Setup

Create a `.env.docker` file in the project root:

```env
# Database
DB_USER=postgres
DB_PASSWORD=bharatgeo_secure_password_123
DB_NAME=bharatgeo

# JWT
JWT_SECRET=your-long-random-secret-key-change-in-production

# Optional: Upstash Redis (leave empty for local Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Or use the provided `.env` and modify as needed.

### 2. Start All Services

```bash
# Start all containers (API, databases, and frontends)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Completely remove (including volumes)
docker-compose down -v
```

### 3. Initialize Database

On first run, run migrations and optionally seed data:

```bash
# Run inside the API container
docker-compose exec api npx prisma migrate deploy

# Create admin user (interactive)
docker-compose exec api node scripts/create-admin.js

# Seed sample data (if seed script exists)
docker-compose exec api npm run db:seed

# Import Census 2011 data (requires dataset files in /dataset)
docker-compose exec api python scripts/import_data.py
```

Or, for the last one via Python venv in the container:
```bash
docker-compose exec api /bin/sh -c 'python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python scripts/import_data.py'
```

## Services & Ports

| Service | URL | Purpose |
|---------|-----|---------|
| **API Server** | http://localhost:3000 | REST API backend |
| **Admin Dashboard** | http://localhost:5174 | Admin interface (stats, users, API key management) |
| **Client Portal** | http://localhost:5175 | Client interface (API keys, usage analytics) |
| **Demo App** | http://localhost:5176 | Public demo (village autocomplete, API testing) |
| **PostgreSQL** | localhost:5432 | Database (user: `postgres`) |
| **Redis** | localhost:6379 | Cache & rate limiting |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Docker Compose                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   Admin     │  │   Client    │  │     Demo     │  │
│  │  Dashboard  │  │   Portal    │  │     App      │  │
│  │  :5174      │  │  :5175      │  │   :5176      │  │
│  └──────┬──────┘  └──────┬──────┘  └───────┬──────┘  │
│         │                │                 │         │
│         └────────────────┴─────────────────┘         │
│                        │                              │
│                   ┌────▼─────┐                        │
│                   │    API    │                        │
│                   │  Server   │                        │
│                   │  :3000    │                        │
│                   └────┬──────┘                        │
│                        │                              │
│         ┌──────────────┼──────────────┐              │
│         │              │              │              │
│    ┌────▼────┐    ┌───▼────┐    ┌──▼──────┐       │
│    │Database │    │  Redis │    │  Upstash│       │
│    │   PG    │    │ Cache  │    │  (opt)  │       │
│    │ :5432   │    │ :6379  │    │         │       │
│    └─────────┘    └────────┘    └─────────┘       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Common Docker Commands

### View Running Containers
```bash
docker-compose ps
```

### Execute Commands Inside Containers
```bash
# Bash shell in API container
docker-compose exec api sh

# Run Prisma Studio (DB UI)
docker-compose exec api npx prisma studio

# Run migrations
docker-compose exec api npx prisma migrate deploy

# Check logs
docker-compose logs api        # Last 100 lines
docker-compose logs -f api     # Follow (live)
docker-compose logs --tail=50 api
```

### Rebuild Images (after code changes)
```bash
# Rebuild specific service
docker-compose up -d --build api

# Rebuild all
docker-compose up -d --build
```

### Database Operations
```bash
# Connect to PostgreSQL from host
psql -h localhost -U postgres -d bharatgeo

# Inside container
docker-compose exec postgres psql -U postgres -d bharatgeo

# View Redis data
docker-compose exec redis redis-cli KEYS '*'
```

## Development with Docker

### Hot Reload

- **Frontend apps** (admin, client-portal, demo): Volume mounts auto-reload on file changes via Vite
- **Backend API**: Volume mount on `src/` — nodemon is configured to watch and restart

To enable nodemon in the Dockerfile for development, update `Dockerfile`:
```dockerfile
# Instead of: CMD ["node", "server.js"]
# Use:
CMD ["npx", "nodemon", "server.js"]
```

### Using .env Files

The Docker setup respects `.env` files. You can have multiple:
- `.env` — default (local machine)
- `.env.docker` — Docker-specific overrides

Pass custom env file:
```bash
docker-compose --env-file .env.docker up -d
```

## Production Deployment

For production, you should:

1. **Use managed databases** (NeonDB for PostgreSQL, Upstash for Redis) — don't use local containers
2. **Build images once**, deploy to registry (Docker Hub, ECR, etc.)
3. **Use environment variables** for secrets (never commit `.env` files)
4. **Set replica count** for redundancy
5. **Use orchestration** (Kubernetes, ECS, etc.)

### Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  api:
    image: myregistry/bharatgeo-api:1.0.0
    environment:
      DATABASE_URL: ${DATABASE_URL}  # NeonDB connection string
      UPSTASH_REDIS_REST_URL: ${UPSTASH_REDIS_REST_URL}
      UPSTASH_REDIS_REST_TOKEN: ${UPSTASH_REDIS_REST_TOKEN}
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "3000:3000"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

Then run migrations once:
```bash
docker-compose run --rm api npx prisma migrate deploy
```

## Troubleshooting

### API won't start: "Can't reach database"
- Ensure PostgreSQL is running and healthy: `docker-compose ps`
- Check connection string in `.env`
- Verify network connectivity: `docker-compose exec api ping postgres`

### Redis errors
- Confirm Redis is running: `docker-compose ps`
- Test Redis connection: `docker-compose exec redis redis-cli ping`

### Port conflicts
- If port 5432, 6379, 3000, etc. are already in use, modify `docker-compose.yml` port mappings
- Or kill existing processes: `lsof -iTCP:3000`

### Rebuild needed
- After dependency changes in package.json: `docker-compose up -d --build`
- After Prisma schema changes: `docker-compose exec api npx prisma generate`

### View database contents
```bash
docker-compose exec postgres psql -U postgres -d bharatgeo -c "SELECT * FROM users;"
```

## Monitoring & Logs

```bash
# All service logs combined
docker-compose logs

# Follow API logs in real-time
docker-compose logs -f api

# Show last N lines
docker-compose logs --tail=100 api

# Filter by timestamp
docker-compose logs --since 10m api
```

## Cleanup

```bash
# Stop all services (keep data)
docker-compose stop

# Remove containers but keep volumes
docker-compose down

# Remove everything including data
docker-compose down -v

# Remove images too
docker-compose down -v --rmi all
```

## Summary

Docker Compose makes local development, testing, and CI/CD seamless. The entire Bharat Geo API stack (API, 3 frontends, PostgreSQL, Redis) starts with a single command:

```bash
docker-compose up -d
```

All services are configured with health checks, proper networking, and hot-reload for frontend development. For production, use managed services (NeonDB, Upstash) and orchestration platforms like Kubernetes or ECS.
