# Cinnamon Node.js/TypeScript Backend Template

A production-ready Node.js backend API template built with **TypeScript**, **Express.js 5**, **Prisma ORM**, and **PostgreSQL**. Features JWT authentication with multi-provider OAuth support, role-based access control, real-time WebSocket communication, AWS integrations (SES, Pinpoint SMS, CloudWatch), Google Cloud Storage, and interactive Swagger API documentation.

**Author:** Cinnamon Agency

---

## Documentation

| Document | Description |
|---|---|
| [Getting Started](docs/GETTING_STARTED.md) | Prerequisites, setup instructions, scripts reference |
| [Architecture](docs/ARCHITECTURE.md) | Project structure, bootstrap flow, DI, middleware pipeline, error handling, response format, logging |
| [API Reference](docs/API_REFERENCE.md) | All endpoints (Auth, User, Project, Notification, Support Request), internal services, Swagger docs |
| [Database](docs/DATABASE.md) | Prisma schema — all 12 models, 8 enums, indexes, seed data, migrations |
| [Authentication](docs/AUTHENTICATION.md) | JWT token flow, cookie config, RBAC, verification flows, device trust, security measures |
| [Services](docs/SERVICES.md) | AWS SES, Pinpoint SMS, CloudWatch, Google Cloud Storage, JWT, bcrypt, Prisma, WebSocket |
| [Deployment](docs/DEPLOYMENT.md) | Docker, Docker Compose, production checklist, graceful shutdown, health checks |
| [Environment](docs/ENVIRONMENT.md) | Full list of all 30+ environment variables with defaults and descriptions |

---

## Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd template-nodejs
cp .env.template .env    # Edit with your values

# Option A: Docker (recommended)
docker-compose up -d
docker-compose exec api yarn migrate:deploy
docker-compose exec api yarn seed

# Option B: Local
yarn install
yarn prisma:generate
yarn migrate:deploy
yarn seed
yarn dev
```

API: `http://localhost:3000` — Swagger: `http://localhost:3000/api-docs`

---

## Tech Stack

| Category | Technology |
|---|---|
| **Runtime** | Node.js 22 |
| **Language** | TypeScript 5.8 (strict mode) |
| **Framework** | Express.js 5 |
| **ORM** | Prisma 6 |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (jsonwebtoken), bcrypt |
| **Validation** | Joi 17 |
| **DI Container** | tsyringe |
| **Email** | AWS SES |
| **SMS** | AWS Pinpoint SMS Voice V2 |
| **Logging** | Winston + Morgan + AWS CloudWatch |
| **File Storage** | Google Cloud Storage |
| **WebSocket** | ws (native) |
| **API Docs** | Swagger UI Express (OpenAPI 3.0) |
| **Security** | Helmet, CORS, rate-limiter-flexible |
| **Containerization** | Docker + Docker Compose |
| **Package Manager** | Yarn |

---

## API Overview

| Module | Base Path | Endpoints | Auth | Highlights |
|---|---|---|---|---|
| **Auth** | `/auth` | 13 | Mixed | Register, login, logout, token refresh, email/phone verification, login codes, device trust |
| **User** | `/user` | 3 | JWT | Profile, notification toggle |
| **Project** | `/project` | 3 | JWT | CRUD with media uploads (GCS signed URLs), Prisma transactions |
| **Notification** | `/notification` | 3 | JWT | CRUD with email + WebSocket real-time events |
| **Support** | `/support_request` | 2 | Public/ADMIN | Public submission, admin status management |

---

## Project Structure (Overview)

```
src/
├── api/            # Feature modules (auth, user, project, notification, support_request, media, role, user_role, user_session, verification_uid)
├── common/         # Shared types, response codes, @serviceMethod() decorator
├── core/           # App init, config, logger, server + graceful shutdown
├── middleware/      # Auth, rate limiter, validation, response formatter, logging, shutdown
├── routes/         # Central router
├── services/       # AWS SES, Pinpoint SMS, CloudWatch, GCS, JWT, bcrypt, Prisma, WebSocket, UUID
└── documentation/  # Swagger/OpenAPI setup
```

See [Architecture](docs/ARCHITECTURE.md) for the full annotated directory tree.

---

## Scripts

| Script | Description |
|---|---|
| `yarn dev` | Development server (hot-reload) |
| `yarn build` | Compile TypeScript |
| `yarn start` | Production server |
| `yarn lint` / `yarn lint:fix` | ESLint |
| `yarn format` | Prettier |
| `yarn migrate:dev` | Create migration (dev) |
| `yarn migrate:deploy` | Apply migrations (prod) |
| `yarn seed` | Seed database |
| `yarn db:bootstrap` | Full DB setup (generate + migrate + seed) |

---

## License

ISC