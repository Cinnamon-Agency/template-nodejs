# Getting Started

## Prerequisites

- **Node.js** >= 22
- **npm** package manager
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
docker-compose exec api npm run migrate:deploy
docker-compose exec api npm run seed
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api-docs`.

---

## Local Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Create environment file
cp .env.template .env
# Edit .env - set DATABASE_URL to your local PostgreSQL

# 3. Generate Prisma client
npm run prisma:generate

# 4. Run migrations
npm run migrate:deploy

# 5. Seed the database
npm run seed

# 6. Start development server (hot-reload)
npm run dev
```

---

## Scripts Reference

| Script | Command | Description |
|---|---|---|
| `npm run dev` | `ts-node-dev --respawn -r dotenv/config src/server.ts` | Development server with hot-reload |
| `npm run build` | `tsc` | Compile TypeScript to JavaScript |
| `npm run start` | `node -r dotenv/config build/server.js` | Start production server |
| `npm run lint` | `eslint src/` | Run ESLint |
| `npm run lint:fix` | `eslint src/ --fix` | Fix ESLint issues |
| `npm run format` | `prettier --write "src/**/*.ts"` | Format code with Prettier |
| `npm run seed` | `prisma db seed` | Seed database |
| `npm run prisma:generate` | `prisma generate` | Generate Prisma client |
| `npm run migrate:dev` | `prisma migrate dev` | Create and apply migration (dev) |
| `npm run migrate:deploy` | `prisma migrate deploy` | Apply pending migrations (prod) |
| `npm run migrate:status` | `prisma migrate status` | Check migration status |
| `npm run db:bootstrap` | `prisma generate && prisma migrate deploy && npm run seed` | Full DB setup |

---

## Swagger API Docs

After starting the server, visit `http://localhost:3000/api-docs` to access the interactive Swagger documentation. It is protected by Basic Authentication — credentials are set via `DOCS_USER` and `DOCS_PASSWORD` environment variables.

---

## Health Check

```
GET /api/v1/healthcheck
```

Returns `{ "status": "ok" }` when the server is running.
