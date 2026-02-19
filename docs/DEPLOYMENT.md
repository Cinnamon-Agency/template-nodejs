# Docker & Deployment

## Dockerfile

**File:** `Dockerfile`

- **Base image:** `node:22`
- **Build steps:** Install dependencies → Copy source → Build TypeScript → Expose port 3000
- **Memory:** `NODE_OPTIONS="--max-old-space-size=3072"` for memory optimization
- **Package manager:** Yarn with `--frozen-lockfile`

```dockerfile
FROM node:22
WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ENV NODE_OPTIONS="--max-old-space-size=3072"
RUN yarn build
EXPOSE 3000
CMD ["yarn", "start"]
```

---

## Docker Compose (Development)

**File:** `docker-compose.yml`

Two services for local development:

### API Service
- Builds from local `Dockerfile`
- Mounts `src/` and `prisma/` volumes for hot-reload
- Runs `npm run dev` (ts-node-dev with respawn)
- Reads environment from `.env` file
- Waits for database health check before starting

### Database Service
- **Image:** `postgres:16-alpine`
- **Default credentials:** `postgres` / `postgres`
- **Default database:** `template_nodejs`
- **Port:** `5432`
- **Data persistence:** `postgres_data` named volume
- **Health check:** `pg_isready` every 5 seconds

### Usage

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Run migrations inside container
docker-compose exec api yarn migrate:deploy

# Seed database
docker-compose exec api yarn seed

# Stop all services
docker-compose down

# Stop and remove volumes (reset database)
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
- [ ] Run `yarn migrate:deploy` before starting the application
- [ ] Set `LOG_TO_CONSOLE=false` if using CloudWatch exclusively
- [ ] Increase `SALT_ROUNDS` to 12+ for stronger password hashing
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
yarn db:bootstrap

# Or step by step:
yarn prisma:generate    # Generate Prisma client
yarn migrate:deploy     # Apply pending migrations
yarn seed               # Seed roles and superadmin
```

---

## Environment Configuration

See [ENVIRONMENT.md](./ENVIRONMENT.md) for the full list of environment variables and their descriptions.
