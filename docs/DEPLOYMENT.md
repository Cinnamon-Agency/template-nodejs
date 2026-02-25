# Docker & Deployment

## Dockerfile

**File:** `Dockerfile`

- **Multi-stage build:** Builder stage (full deps for compilation) → Production stage (slim image, production deps only)
- **Builder image:** `node:22` — installs all dependencies, compiles TypeScript
- **Production image:** `node:22-slim` — production dependencies only, copies compiled output + Prisma schema
- **Memory:** `NODE_OPTIONS="--max-old-space-size=3072"` for memory optimization
- **Package manager:** npm with `package-lock.json`

```dockerfile
# --- Build stage ---
FROM node:22 AS builder
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Production stage ---
FROM node:22-slim
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=builder /usr/src/app/build ./build
COPY --from=builder /usr/src/app/prisma ./prisma
RUN npx prisma generate
ENV NODE_OPTIONS="--max-old-space-size=3072"
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Docker Compose (Development)

**File:** `docker-compose.yml`

Three services for local development:

### API Service
- Builds from local `Dockerfile`
- Mounts `src/` and `prisma/` volumes for hot-reload
- Runs `npm run dev` (ts-node-dev with respawn)
- Reads environment from `.env` file
- Waits for database and Redis health checks before starting

### Database Service
- **Image:** `postgres:16-alpine`
- **Default credentials:** `postgres` / `postgres`
- **Default database:** `template_nodejs`
- **Port:** `5432`
- **Data persistence:** `postgres_data` named volume
- **Health check:** `pg_isready` every 5 seconds

### Redis Service
- **Image:** `redis:7-alpine`
- **Port:** `6379`
- **Data persistence:** `redis_data` named volume
- **Health check:** `redis-cli ping` every 5 seconds
- **Note:** Optional — the application falls back to in-memory caching if Redis is unavailable

### Usage

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Run migrations inside container
docker-compose exec api npm run migrate:deploy

# Seed database
docker-compose exec api npm run seed

# Stop all services
docker-compose down

# Stop and remove volumes (reset database + Redis)
docker-compose down -v
```

---

## Production Deployment

### Build and Run

```bash
# Build production image
docker build -t template-nodejs .

# Run with environment file
docker run -p 3000:3000 --env-file .env template-nodejs
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong, unique values for `ACCESS_TOKEN_SECRET` and `REFRESH_TOKEN_SECRET`
- [ ] Set `DOCS_USER` and `DOCS_PASSWORD` for Swagger UI protection
- [ ] Configure `ALLOWED_ORIGINS` to your frontend domain(s)
- [ ] Use IAM roles instead of `AWS_ACCESS_KEY`/`AWS_SECRET` for AWS services
- [ ] Use GCP Workload Identity instead of service account key file
- [ ] Set `DATABASE_URL` to your production PostgreSQL instance
- [ ] Run `npm run migrate:deploy` before starting the application
- [ ] Set `LOG_TO_CONSOLE=false` if using CloudWatch exclusively
- [ ] Increase `SALT_ROUNDS` to 12+ for stronger password hashing
- [ ] Configure `REDIS_URL` for production Redis instance (optional — falls back to in-memory)
- [ ] Configure appropriate rate limiter values for production traffic

### Health Check

The application exposes a health check endpoint:

```
GET /api/v1/healthcheck → { "status": "ok" }
```

Use this for load balancer health checks and container orchestration readiness probes.

### Graceful Shutdown

The server handles `SIGINT` and `SIGTERM` signals with a graceful shutdown sequence:

1. Set `shuttingDown` flag → new requests receive 503
2. Disconnect Prisma client
3. Close WebSocket server
4. Close HTTP server
5. 10-second timeout safety net → force exit

---

## Database Deployment

```bash
# Full bootstrap (generate client + migrate + seed)
npm run db:bootstrap

# Or step by step:
npm run prisma:generate    # Generate Prisma client
npm run migrate:deploy     # Apply pending migrations
npm run seed               # Seed roles and superadmin
```

---

## Environment Configuration

See [ENVIRONMENT.md](./ENVIRONMENT.md) for the full list of environment variables and their descriptions.
