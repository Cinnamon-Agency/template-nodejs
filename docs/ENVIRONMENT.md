# Environment Variables

All environment variables are defined in `.env.template`. The config system (`src/core/config/index.ts`) validates that **all required variables are set** at startup and will throw an error if any are missing.

---

## Server

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment: `development`, `production`, `test` |
| `PORT` | `3000` | Server port |
| `PROJECT_NAME` | `template-nodejs` | Project name (used in Swagger docs title) |
| `COMMIT_HASH` | `LOCAL` | Git commit hash for deployment tracking (logged on startup) |
| `API_BASE_URL` | `http://localhost:3000` | Base URL for API (used in email verification/reset links) |
| `WEB_URL` | `http://localhost:3001` | Frontend URL (used in support request emails) |

## Database

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | — | PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/db?schema=public`) |

## Documentation

| Variable | Default | Description |
|---|---|---|
| `DOCS_USER` | — | Basic Auth username for Swagger UI at `/api-docs` |
| `DOCS_PASSWORD` | — | Basic Auth password for Swagger UI |

## Authentication

| Variable | Default | Description |
|---|---|---|
| `ACCESS_TOKEN_SECRET` | — | JWT signing secret for access tokens |
| `REFRESH_TOKEN_SECRET` | — | JWT signing secret for refresh tokens |
| `ACCESS_TOKEN_EXPIRES_IN` | `15` | Access token expiry in **minutes** |
| `REFRESH_TOKEN_EXPIRES_IN` | `10080` | Refresh token expiry in **minutes** (default: 7 days) |

## Logging

| Variable | Default | Description |
|---|---|---|
| `LOG_REQUESTS` | `true` | Enable HTTP request logging via Morgan |
| `LOG_TO_CONSOLE` | `true` | Enable Winston console transport |

## Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMITER_POINTS` | `5` | Max requests per duration window (general) |
| `RATE_LIMITER_DURATION_IN_SECONDS` | `60` | General rate limiter window duration |
| `RATE_LIMITER_BLOCKING_DURATION_IN_SECONDS` | `300` | Block duration after general limit exceeded |
| `LOGIN_LIMITER_POINTS` | `5` | Max login/verification attempts per window |
| `LOGIN_LIMITER_DURATION_IN_SECONDS` | `60` | Login rate limiter window duration |
| `LOGIN_LIMITER_BLOCKING_DURATION_IN_SECONDS` | `300` | Block duration after login limit exceeded |

## Redis

| Variable | Default | Description |
|---|---|---|
| `REDIS_URL` | — (optional) | Redis connection URL (e.g., `redis://redis:6379`). If not set, the application falls back to in-memory caching. |

## AWS

| Variable | Default | Description |
|---|---|---|
| `AWS_ACCESS_KEY` | — | AWS access key ID (dev only; use IAM roles in production) |
| `AWS_SECRET` | — | AWS secret access key (dev only) |
| `AWS_REGION` | `us-east-1` | AWS region for SES, Pinpoint, CloudWatch |

## Email (AWS SES)

| Variable | Default | Description |
|---|---|---|
| `SES_VERIFIED_MAIL` | `noreply@example.com` | Verified sender email address for AWS SES |

## SMS (AWS Pinpoint)

| Variable | Default | Description |
|---|---|---|
| `SMS_VERIFIED_PHONE_NUMBER` | — | Verified origination phone number for SMS sending |

## Google Cloud

| Variable | Default | Description |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT_ID` | — | GCP project ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION` | — | Path to GCP service account key JSON (local dev only) |
| `GOOGLE_CLOUD_STORAGE_BUCKET_NAME` | — | GCS bucket name for media file uploads |

## Security

| Variable | Default | Description |
|---|---|---|
| `SALT_ROUNDS` | `10` | bcrypt salt rounds for password hashing (higher = slower + more secure) |
| `ALLOWED_ORIGINS` | `http://localhost:3001` | Comma-separated CORS allowed origins |

## Seed

| Variable | Default | Description |
|---|---|---|
| `SUPERADMIN_PASSWORD` | — | Password for the superadmin user created during database seeding (required for `npm run seed`) |

---

## Setup

```bash
# Copy the template
cp .env.template .env

# Edit with your values
nano .env
```

The config loader (`src/core/config/index.ts`) caches the configuration after first load and validates that no values are `undefined`. If any required variable is missing, the application will throw an error at startup:

```
Error: Missing value for DATABASE_URL in .env
```
