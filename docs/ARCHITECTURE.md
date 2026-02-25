# Architecture Overview

## Project Structure

The codebase follows a **package-by-feature** architecture. Each API domain is self-contained with its own router, controller, service, interface, input validation, and Swagger docs.

```
template-nodejs/
├── prisma/
│   ├── migrations/              # Database migration history
│   ├── schema.prisma            # Database schema definition
│   └── seed.ts                  # Database seed (roles + superadmin)
├── src/
│   ├── index.ts                 # Application bootstrap entry point
│   ├── api/                     # Feature modules (package-by-feature)
│   │   ├── auth/                # Authentication (register, login, logout, tokens, verification)
│   │   │   ├── authRouter.ts       # Route definitions
│   │   │   ├── authController.ts   # Request handling
│   │   │   ├── authService.ts      # Business logic
│   │   │   ├── authInput.ts        # Joi validation schemas
│   │   │   ├── authDocs.ts         # Swagger documentation
│   │   │   └── interface.ts        # TypeScript interfaces
│   │   ├── user/                # User management (profile, notifications toggle)
│   │   ├── project/             # Project CRUD with media file uploads
│   │   ├── notification/        # In-app notifications with email + WebSocket
│   │   ├── support_request/     # Support request submission (public + admin)
│   │   ├── media/               # Media file management (GCS signed URLs)
│   │   ├── role/                # Role lookup service
│   │   ├── user_role/           # User-role assignment service
│   │   ├── user_session/        # Session management (store, refresh, expire)
│   │   └── verification_uid/    # Verification UID generation & validation
│   ├── common/                  # Shared utilities
│   │   ├── index.ts                # Barrel export
│   │   ├── response.ts             # StatusCode, ResponseCode, ResponseMessage enums + ResponseError class
│   │   ├── types.ts                # Shared types (AsyncResponse, ResponseParams, Express augmentation)
│   │   ├── constants.ts            # Time conversions, verification code config, pagination defaults
│   │   ├── dto.ts                  # Data transfer helpers (sanitizeUser)
│   │   ├── pagination.ts           # Pagination utilities (normalize, build paginated results)
│   │   └── decorators/
│   │       └── serviceMethod.ts    # @serviceMethod() decorator for error handling
│   ├── core/                    # Application core
│   │   ├── app/
│   │   │   └── index.ts            # Express app initialization + middleware pipeline
│   │   ├── config/
│   │   │   ├── index.ts            # Environment config loader with caching + validation
│   │   │   └── interface.ts        # ENV and Config type definitions
│   │   ├── logger/
│   │   │   └── index.ts            # Winston logger + HTTP logger setup
│   │   └── server/
│   │       ├── index.ts            # HTTP server + WebSocket + graceful shutdown
│   │       └── state.ts            # Server shutdown state singleton
│   ├── middleware/               # Express middleware
│   │   ├── auth/                   # JWT token verification + RBAC + Basic Auth for docs
│   │   ├── http/                   # Morgan HTTP request logger (JSON structured)
│   │   ├── rate_limiter/           # General + login-specific rate limiters
│   │   ├── response/               # Unified response formatter (data/code/message)
│   │   ├── validation/             # Joi schema validation middleware
│   │   ├── not_found/              # 404 handler
│   │   ├── error_handler/          # Global error handler (hides details in production)
│   │   ├── csrf/                   # CSRF protection middleware
│   │   ├── sanitize/               # Input sanitization middleware
│   │   ├── request_id/             # Unique request ID generation middleware
│   │   ├── shutdown/               # Graceful shutdown request rejection
│   │   └── log_middleware/         # CloudWatch logging middleware (errors + slow requests)
│   ├── routes/
│   │   └── index.ts             # Central router (mounts all feature routers)
│   ├── services/                # Third-party service integrations
│   │   ├── aws-ses/                # AWS SES email sending with HTML templates
│   │   ├── aws-end-user-messaging/ # AWS Pinpoint SMS sending
│   │   ├── cache/                  # Redis/memory caching service with TTL support
│   │   ├── cloudwatch/             # AWS CloudWatch log event sending
│   │   ├── bcrypt/                 # Password hashing + comparison
│   │   ├── jsonwebtoken/           # JWT token generation + verification
│   │   ├── google_cloud_storage/   # GCS signed URL generation (read/write)
│   │   ├── prisma/                 # Prisma error mapping to ResponseCodes
│   │   ├── redis/                  # Redis client connection and utilities
│   │   ├── uuid/                   # UUID v4 generation
│   │   └── websocket/             # WebSocket server (singleton via tsyringe)
│   └── documentation/           # Swagger/OpenAPI setup
│       ├── index.ts                # Merges all module docs into OpenAPI spec
│       ├── router.ts               # Swagger UI route with Basic Auth protection
│       └── genericDocs.ts          # Generic response definitions (200, 204, 403, 404)
├── .windsurf/                   # AI agent configuration
│   ├── rules/                      # Project rules and coding standards
│   ├── skills/                     # Agent skill definitions
│   └── workflows/                  # Development workflow definitions
├── .env.template                # Environment variable template
├── Dockerfile                   # Production Docker image (Node 22)
├── docker-compose.yml           # Dev environment (API + PostgreSQL 16 + Redis 7)
├── package.json                 # Dependencies and scripts
├── tsconfig.json                # TypeScript configuration (strict, path aliases)
├── eslint.config.mjs            # ESLint configuration
└── .prettierrc                  # Prettier configuration
```

---

## Application Bootstrap Flow

```
src/index.ts (bootstrap)
  └── App (src/core/app/index.ts)
       ├── Express initialization
       ├── Middleware pipeline setup
       └── AppServer (src/core/server/index.ts)
            ├── HTTP server start
            ├── WebSocket service connect
            ├── Signal handlers (SIGINT, SIGTERM)
            └── Graceful shutdown (Prisma disconnect → WebSocket close → Server close)
```

The entry point (`src/index.ts`) dynamically imports the `App` class, initializes it, then starts the `AppServer`. The server registers signal handlers for graceful shutdown with a 10-second timeout.

---

## Dependency Injection

The project uses **tsyringe** for dependency injection. All services and controllers are decorated with `@singleton()` and `@autoInjectable()`, resolved via `container.resolve()`.

```typescript
// Example: Controller resolved from DI container
const authController = container.resolve(AuthController)

// Example: Service injected into controller
@singleton()
@autoInjectable()
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
```

---

## Request Lifecycle

```
Request → CORS → Cookie Parser → Helmet → Request ID → Rate Limiter → Body Parser
  → Input Sanitizer → HTTP Logger → CloudWatch Middleware → Root Redirect
  → Health Check → CSRF Protection → Shutdown Check → Router
    → [Validation Middleware] → [Auth Middleware] → Controller → Service → Prisma
  → Not Found → Response Formatter → Global Error Handler → Client
```

---

## Middleware Pipeline

Middleware is applied in this order in `src/core/app/index.ts`:

| Order | Middleware | File | Purpose |
|---|---|---|---|
| 1 | **CORS** | Built-in | Configurable allowed origins from `ALLOWED_ORIGINS` |
| 2 | **Cookie Parser** | `cookie-parser` | Parse cookies for JWT tokens |
| 3 | **Helmet** | `helmet` | Security headers (cross-origin resource policy) |
| 4 | **Request ID** | `src/middleware/request_id/` | Attaches unique request ID to each request |
| 5 | **Rate Limiter** | `src/middleware/rate_limiter/` | In-memory rate limiting (configurable points/duration) |
| 6 | **Body Parser** | `body-parser` | JSON parsing (raw for webhook endpoint) |
| 7 | **Input Sanitizer** | `src/middleware/sanitize/` | Sanitizes user input to prevent injection |
| 8 | **HTTP Logger** | `src/middleware/http/` | Morgan structured JSON logging (conditional on `LOG_REQUESTS`) |
| 9 | **CloudWatch Middleware** | `src/middleware/log_middleware/` | Logs errors and slow requests to CloudWatch |
| 10 | **Root Redirect** | Inline | Redirects `/` to `/api-docs` |
| 11 | **Health Check** | Inline | `GET /api/v1/healthcheck` returns `{ status: "ok" }` |
| 12 | **CSRF Protection** | `src/middleware/csrf/` | Cross-site request forgery protection |
| 13 | **Shutdown Handler** | `src/middleware/shutdown/` | Returns 503 when server is shutting down |
| 14 | **Router** | `src/routes/` | All feature routes |
| 15 | **Not Found** | `src/middleware/not_found/` | 404 handler for unmatched routes |
| 16 | **Response Formatter** | `src/middleware/response/` | Standardizes all responses to `{ data, code, message }` |
| 17 | **Global Error Handler** | `src/middleware/error_handler/` | Catches unhandled errors, hides details in production |

### Per-Route Middleware

- **`requireToken(allowedRoles?)`** — JWT verification from cookies or `Authorization: Bearer` header; optional RBAC check. `SUPERADMIN` bypasses role checks.
- **`validate(schema)`** — Joi validation; validated input stored in `res.locals.input`
- **`loginRateLimiter`** — Stricter rate limiting for login/verification endpoints
- **`authenticateDocs`** — Basic Auth for Swagger UI access

---

## Error Handling Strategy

The `@serviceMethod()` decorator (`src/common/decorators/serviceMethod.ts`) wraps all service methods with:

1. **Prisma error mapping** — Converts Prisma error codes (P2002, P2025, etc.) to `ResponseCode` values
2. **ResponseError handling** — Catches typed `ResponseError` exceptions
3. **Custom error handlers** — Optional `onError` callback for cleanup/override
4. **Fallback** — Returns `ResponseCode.SERVER_ERROR` for unhandled errors

All errors flow through the response formatter middleware which extracts the HTTP status from the first 3 digits of the `ResponseCode` (e.g., `404001` → HTTP 404).

### Prisma Error Code Mapping

| Prisma Code | ResponseCode | Meaning |
|---|---|---|
| P2002 | `CONFLICT` | Unique constraint violation |
| P2003 | `FAILED_INSERT` | Foreign key constraint failure |
| P2025 | `NOT_FOUND` | Record not found |
| P2018 | `NOT_FOUND` | Related record not found |
| P2015 | `NOT_FOUND` | Related record not found |
| P2011/P2012/P2000 | `INVALID_INPUT` | Null/missing required field |
| P1001/P1002/P1008 | `SERVICE_UNAVAILABLE` | Database connection issues |
| P2034 | `CONFLICT` | Transaction conflict |
| P2004 | `INTEGRITY_CONSTRAINT_VIOLATION` | Constraint violation |

---

## Response Format

All API responses follow a standardized format via the response formatter middleware:

```json
{
  "data": { ... } | null,
  "code": 200000,
  "message": "OK"
}
```

### Response Code Structure

Response codes are **6-digit numbers** where:
- First 3 digits = HTTP status code
- Last 3 digits = specific error identifier

Examples:
- `200000` — OK
- `400001` — Invalid input
- `401001` — Invalid token
- `401002` — Session expired
- `404001` — User not found
- `404015` — Project not found
- `500000` — Internal server error

The full list of response codes, messages, and the `ResponseError` class are defined in `src/common/response.ts`.

---

## TypeScript Path Aliases

Defined in `tsconfig.json` for clean imports:

| Alias | Maps To |
|---|---|
| `@api/*` | `src/api/*` |
| `@app` | `src/core/app` |
| `@common` | `src/common` |
| `@common/*` | `src/common/*` |
| `@core/*` | `src/core/*` |
| `@documentation` | `src/documentation` |
| `@middleware/*` | `src/middleware/*` |
| `@routes` | `src/routes` |
| `@services/*` | `src/services/*` |

---

## Logging & Monitoring

### Winston Logger (`src/core/logger/`)

- Custom log levels: `emerg`, `crit`, `error`, `warning`, `info`, `debug`
- Console transport with colorized output (controlled by `LOG_TO_CONSOLE`)
- Includes environment metadata

### Morgan HTTP Logger (`src/middleware/http/`)

- Structured JSON logging of all HTTP requests
- Captures: method, URL, status, response time, user ID, IP, user agent
- Errors (4xx/5xx) logged at error level; others at http level
- Healthcheck endpoint excluded to reduce noise

### CloudWatch Middleware (`src/middleware/log_middleware/`)

- Logs **errors** (4xx/5xx) and **slow requests** (>1000ms) to AWS CloudWatch
- Masks sensitive data (passwords, tokens, API keys, auth headers)
- Includes request/response bodies for error scenarios
- Console output in development mode

---

## WebSocket Communication

The WebSocket server (`src/services/websocket/`) runs alongside the HTTP server using the `ws` library in `noServer` mode.

**Current usage:**
- Notification deletion events emitted as `{userId}_delete_notif` with `{ notificationId }`

The WebSocket service is a tsyringe singleton, injected into controllers that need real-time communication. It supports graceful shutdown alongside the HTTP server.
