# Services & Integrations

All third-party service integrations are located in `src/services/`.

---

## AWS SES Email (`src/services/aws-ses/`)

Sends templated HTML emails using Amazon Simple Email Service.

### Configuration
- Uses explicit credentials (`AWS_ACCESS_KEY`, `AWS_SECRET`) in dev; IAM roles in production
- Sender address configured via `SES_VERIFIED_MAIL`

### Email Templates

Templates are stored as HTML files in `src/services/aws-ses/emailTemplates/`. Each email is composed of:
- `default/header.html` — shared header
- `{TemplateName}.html` — template-specific content
- `default/footer.html` — shared footer

Placeholders use `{{variable}}` syntax and are replaced at send time.

| Template | Usage |
|---|---|
| `VerifyLogin` | Login verification code email |
| `ResetPassword` | Password reset link |
| `Register` | Registration confirmation |
| `ContactSupport` | Support request notification to team |
| `ContactSupportSuccess` | Support request confirmation to user |
| `Notification` | In-app notification email |
| `VerifyEmail` | Email address verification link |

### Usage

```typescript
import { sendEmail } from '@services/aws-ses'
import { EmailTemplate } from '@services/aws-ses/interface'

await sendEmail(
  EmailTemplate.RESET_PASSWORD,
  'user@example.com',
  'Reset your password',
  { reset_password_url: 'https://...' }
)
```

---

## AWS Pinpoint SMS (`src/services/aws-end-user-messaging/`)

Sends transactional SMS messages via AWS Pinpoint SMS Voice V2.

### Configuration
- Uses explicit credentials in dev; IAM roles in production
- Origination identity configured via `SMS_VERIFIED_PHONE_NUMBER`

### Features
- Sends `TRANSACTIONAL` message type
- Includes `formatPhoneNumberForSMS()` utility for E.164 formatting
- Handles 10-digit, 11-digit, and international formats

### Usage

```typescript
import { sendSMS } from '@services/aws-end-user-messaging'

const { code } = await sendSMS('+1234567890', 'Your code is: 123456')
```

---

## AWS CloudWatch Logs (`src/services/cloudwatch/`)

Sends structured log events to AWS CloudWatch Logs.

### Features
- Auto-creates log groups and streams named `{NODE_ENV}-api`
- Handles sequence token management
- Used by the CloudWatch logging middleware (`src/middleware/log_middleware/`)

### What Gets Logged
- HTTP errors (4xx/5xx status codes)
- Slow requests (>1000ms response time)
- Sensitive data is masked before logging

---

## Google Cloud Storage (`src/services/google_cloud_storage/`)

Generates signed URLs for direct file upload/download from Google Cloud Storage.

### Configuration
- Local development: uses `GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION` for auth
- Production: uses default GCP credentials (e.g., Workload Identity)
- Bucket configured via `GOOGLE_CLOUD_STORAGE_BUCKET_NAME`

### Features
- Generates **v4 signed URLs** for both `read` and `write` operations
- URLs expire after **1 hour**
- Used by `MediaService` for project media file uploads

### Usage

```typescript
import { getSignedURL } from '@services/google_cloud_storage'

const { url, code } = await getSignedURL('filename.jpg', 'write')
// Client uploads directly to the signed URL
```

---

## JWT Service (`src/services/jsonwebtoken/`)

Generates and verifies JSON Web Tokens for authentication.

### Token Types

| Type | Secret | Expiry |
|---|---|---|
| `ACCESS_TOKEN` | `ACCESS_TOKEN_SECRET` | `ACCESS_TOKEN_EXPIRES_IN` minutes (default: 15) |
| `REFRESH_TOKEN` | `REFRESH_TOKEN_SECRET` | `REFRESH_TOKEN_EXPIRES_IN` minutes (default: 10080 / 7 days) |

### Usage

```typescript
import { generateToken, verifyToken, TokenType } from '@services/jsonwebtoken'

// Generate
const token = generateToken({ sub: userId }, TokenType.ACCESS_TOKEN)

// Verify
const decoded = verifyToken<{ sub: string }>(token, TokenType.ACCESS_TOKEN)
```

---

## Bcrypt Service (`src/services/bcrypt/`)

Password hashing and comparison using bcrypt.

### Configuration
- Salt rounds configured via `SALT_ROUNDS` (default: 10)

### Used For
- User passwords
- Refresh token hashing (stored in UserSession)
- Verification UID hashing

### Usage

```typescript
import { hashString, compare } from '@services/bcrypt'

const hash = await hashString('password123')
const matches = await compare('password123', hash) // true
```

---

## Redis Client (`src/services/redis/`)

Shared Redis client connection using `ioredis`.

### Configuration
- Connection URL configured via `REDIS_URL` environment variable
- **Optional** — returns `null` if `REDIS_URL` is not set
- All consumers (cache, rate limiter, etc.) share a single connection
- Logs errors but does not crash the application if Redis is unavailable

### Usage

```typescript
import { getRedisClient } from '@services/redis'

const redis = getRedisClient() // Redis instance or null
```

---

## Cache Service (`src/services/cache/`)

Multi-tier caching with automatic Redis → in-memory fallback.

### Features
- **Redis-backed** when `REDIS_URL` is configured
- **In-memory fallback** with TTL and automatic cleanup (every 60 seconds)
- Supports `get`, `set`, `del`, and `delByPrefix` operations
- All operations are async and handle Redis errors gracefully

### Cache Keys & TTLs

| Key Builder | Pattern | Default TTL |
|---|---|---|
| `CacheKeys.userById(id)` | `user:{id}` | 5 minutes |
| `CacheKeys.userByEmail(email)` | `user:email:{email}` | 5 minutes |
| `CacheKeys.roleByType(type)` | `role:{type}` | 1 hour |

### Usage

```typescript
import { cache, CacheKeys, CacheTTL } from '@services/cache'

// Set
await cache.set(CacheKeys.userById(userId), userData, CacheTTL.USER)

// Get
const user = await cache.get<User>(CacheKeys.userById(userId))

// Delete
await cache.del(CacheKeys.userById(userId))

// Delete by prefix (e.g., invalidate all user caches)
await cache.delByPrefix('user:')
```

---

## Prisma Service (`src/services/prisma/`)

Provides Prisma error detection and mapping to application response codes.

### Error Code Mapping

| Prisma Code | ResponseCode | Meaning |
|---|---|---|
| P2002 | `CONFLICT` | Unique constraint violation |
| P2003 | `FAILED_INSERT` | Foreign key constraint failure |
| P2025 | `NOT_FOUND` | Record not found |
| P2018 | `NOT_FOUND` | Related record not found |
| P2015 | `NOT_FOUND` | Related record not found |
| P2011 | `INVALID_INPUT` | Null constraint violation |
| P2012 | `INVALID_INPUT` | Missing required value |
| P2000 | `INVALID_INPUT` | Value too long |
| P1001 | `SERVICE_UNAVAILABLE` | Can't reach database |
| P1002 | `SERVICE_UNAVAILABLE` | Database timeout |
| P1008 | `SERVICE_UNAVAILABLE` | Operations timed out |
| P2034 | `CONFLICT` | Transaction conflict |
| P2004 | `INTEGRITY_CONSTRAINT_VIOLATION` | Constraint violation |

### Usage

```typescript
import { isPrismaError, mapPrismaErrorToResponseCode } from '@services/prisma'

if (isPrismaError(error)) {
  const code = mapPrismaErrorToResponseCode(error)
  return { code }
}
```

This mapping is used automatically by the `@serviceMethod()` decorator.

---

## UUID Service (`src/services/uuid/`)

Simple UUID v4 generation wrapper.

```typescript
import { generateUUID } from '@services/uuid'

const id = generateUUID() // "550e8400-e29b-41d4-a716-446655440000"
```

---

## WebSocket Service (`src/services/websocket/`)

Real-time communication via WebSocket using the `ws` library.

### Architecture
- Runs in `noServer` mode alongside the HTTP server
- Registered as a **tsyringe singleton** for DI
- Supports graceful shutdown

### Current Events

| Event Pattern | Data | Trigger |
|---|---|---|
| `{userId}_delete_notif` | `{ notificationId }` | Notification deleted |

### Usage

```typescript
@singleton()
@autoInjectable()
export class NotificationController {
  constructor(private readonly webSocketService: WebSocketService) {}

  async deleteNotification(req, res, next) {
    // ... delete logic ...
    this.webSocketService.emit(`${userId}_delete_notif`, { notificationId })
  }
}
```
