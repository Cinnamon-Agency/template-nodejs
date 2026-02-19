# Getting Started

## Prerequisites

- **Node.js** >= 22
- **Yarn** package manager
- **PostgreSQL** 16+ (or use Docker)
- **AWS Account** (for SES, Pinpoint SMS, CloudWatch)
- **Google Cloud** project (for Cloud Storage)

---

## Quick Start with Docker

```bash
# 1. Clone the repository
git clone <repository-url>
cd template-nodejs

# 2. Create environment file
cp .env.template .env
# Edit .env with your values

# 3. Start services (API + PostgreSQL)
docker-compose up -d

# 4. Run database migrations and seed
docker-compose exec api yarn migrate:deploy
docker-compose exec api yarn seed
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api-docs`.

---

## Local Development (without Docker)

```bash
# 1. Install dependencies
yarn install

# 2. Create environment file
cp .env.template .env
# Edit .env - set DATABASE_URL to your local PostgreSQL

# 3. Generate Prisma client
yarn prisma:generate

# 4. Run migrations
yarn migrate:deploy

# 5. Seed the database
yarn seed

# 6. Start development server (hot-reload)
yarn dev
```

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| `yarn dev` | `ts-node-dev --respawn -r dotenv/config src/server.ts` | Development server with hot-reload |
| `yarn build` | `tsc` | Compile TypeScript to JavaScript |
| `yarn start` | `node -r dotenv/config build/server.js` | Start production server |
| `yarn lint` | `eslint src/` | Run ESLint |
| `yarn lint:fix` | `eslint src/ --fix` | Fix ESLint issues |
| `yarn format` | `prettier --write "src/**/*.ts"` | Format code with Prettier |
| `yarn seed` | `prisma db seed` | Seed database |
| `yarn prisma:generate` | `prisma generate` | Generate Prisma client |
| `yarn migrate:dev` | `prisma migrate dev` | Create and apply migration (dev) |
| `yarn migrate:deploy` | `prisma migrate deploy` | Apply pending migrations (prod) |
| `yarn migrate:status` | `prisma migrate status` | Check migration status |
| `yarn db:bootstrap` | `prisma generate && prisma migrate deploy && yarn seed` | Full DB setup |

---

## Swagger API Docs

After starting the server, visit `http://localhost:3000/api-docs` to access the interactive Swagger documentation. It is protected by Basic Authentication — credentials are set via `DOCS_USER` and `DOCS_PASSWORD` environment variables.

---

## Health Check

```
GET /api/v1/healthcheck
```

Returns `{ "status": "ok" }` when the server is running.
