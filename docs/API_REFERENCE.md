# API Reference

## Route Mounting

All routes are mounted in `src/routes/index.ts` under `/api/v1`:

```
/api-docs       → Swagger UI (Basic Auth protected)
/api/v1/auth    → Authentication module
/api/v1/user    → User management module
/api/v1/project → Project module
/api/v1/notification → Notification module
/api/v1/support_request → Support request module
```

---

## Auth (`/auth`)

**Source:** `src/api/auth/`

Full authentication system with multi-provider support, email/phone verification, login codes, and device trust.

| Method | Endpoint | Auth | Rate Limited | Description |
|---|---|---|---|---|
| POST | `/auth/register` | — | — | Register new user (email/password or OAuth) |
| POST | `/auth/login` | — | Login limiter | Login with credentials |
| POST | `/auth/logout` | JWT | — | Logout and expire session |
| POST | `/auth/refresh` | Cookie/Header | — | Refresh access token |
| POST | `/auth/password/forgot` | — | — | Send password reset email |
| POST | `/auth/password/reset` | — | — | Reset password with verification UID |
| POST | `/auth/password/setNew` | — | — | Set new password with verification UID |
| POST | `/auth/verify-email` | — | — | Verify email address with UID |
| POST | `/auth/resend-verification-email` | — | — | Resend email verification link |
| POST | `/auth/resendLoginCode` | — | — | Send 4-digit login code via email |
| POST | `/auth/verifyLoginCode` | — | Login limiter | Verify login code and authenticate |
| POST | `/auth/send-phone-verification` | JWT | — | Send 6-digit SMS verification code |
| POST | `/auth/verify-phone` | JWT | — | Verify phone number with SMS code |

### Key Features

- **Dual token delivery**: Mobile clients (`x-client-type: mobile` header) receive tokens in response body; web clients receive HTTP-only secure cookies
- **Auth types**: `USER_PASSWORD`, `GOOGLE`, `LINKED_IN`, `APPLE`, `FACEBOOK`
- **Login codes**: 4-digit email-based verification codes (10 min expiry)
- **Phone verification**: 6-digit SMS codes via AWS Pinpoint (10 min expiry)
- **Device tokens**: "Don't ask on this device" stores trusted device tokens (30 days)
- **Password requirements**: 8–24 characters

### Request/Response Examples

**Register:**
```json
// POST /auth/register
// Request
{
  "email": "john.doe@email.com",
  "password": "Test1234",
  "authType": "USER_PASSWORD"
}

// Response (mobile client)
{
  "data": {
    "user": { "id": "94104c89-e04a-41b6-9902-e19c723c1354" },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ...",
      "accessTokenExpiresAt": "2024-03-06T14:07:14.922Z",
      "refreshTokenExpiresAt": "2024-03-13T13:52:14.681Z"
    }
  },
  "code": 200000,
  "message": "OK"
}
```

**Verify Login Code:**
```json
// POST /auth/verifyLoginCode
// Request
{
  "email": "john.doe@email.com",
  "loginCode": "1234",
  "dontAskOnThisDevice": true
}

// Response
{
  "data": {
    "user": { "id": "94104c89-..." },
    "tokens": { ... },
    "deviceToken": "a1b2c3d4..."
  },
  "code": 200000,
  "message": "OK"
}
```

---

## User (`/user`)

**Source:** `src/api/user/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/user/` | JWT | Get current authenticated user profile |
| GET | `/user/toggleNotifications` | JWT | Toggle notification preference on/off |
| GET | `/user/:id` | JWT | Get user profile by ID |

---

## Project (`/project`)

**Source:** `src/api/project/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/project/` | JWT | Create project with media files |
| GET | `/project/` | JWT | List projects (paginated: `page`, `perPage`) |
| GET | `/project/:id` | JWT | Get project by ID (ownership check enforced) |

### Key Features

- Project creation uses **Prisma transactions** to atomically create the project and media entries
- Media files get **Google Cloud Storage signed URLs** for direct client upload
- Ownership verification: users can only access their own projects

---

## Notification (`/notification`)

**Source:** `src/api/notification/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/notification/` | JWT | Get notifications (supports `unread` filter, `numberOfFetched` offset) |
| PUT | `/notification/:notificationId` | JWT | Toggle read status (`read` boolean) |
| DELETE | `/notification/:notificationId` | JWT | Delete notification (emits WebSocket event) |

### Key Features

- Creating a notification (via `NotificationService.createNotification`) sends an **email via AWS SES**
- Deleting a notification emits a **WebSocket event** (`{userId}_delete_notif`) for real-time UI updates
- Notifications are fetched in batches of 20

---

## Support Request

**Source:** `src/api/support_request/`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/support_request/` | — | Submit support request (public, no auth) |
| PUT | `/support_request/updateStatus/:supportRequestId` | JWT (ADMIN) | Update request status |

### Key Features

- Public endpoint — no authentication required for submission
- Sends two emails: confirmation to user + notification to support team
- Status update restricted to `ADMIN` role
- Statuses: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`

---

## Internal Services (No Routes)

These services are used internally by other modules and do not expose HTTP endpoints.

### MediaService (`src/api/media/`)

- Creates media database entries linked to projects
- Generates Google Cloud Storage signed URLs for direct file upload
- Used within Prisma transactions for atomic project+media creation

### RoleService (`src/api/role/`)

- Looks up roles by `RoleType` (`USER`, `ADMIN`, `SUPERADMIN`)

### UserRoleService (`src/api/user_role/`)

- Assigns roles to users via the `UserRole` junction table
- Retrieves all roles for a given user

### UserSessionService (`src/api/user_session/`)

- Stores new sessions with hashed refresh tokens
- Updates sessions during token refresh (validates old token hash)
- Expires sessions on logout
- Enforces single active session per user (previous session logged out on new login)

### VerificationUIDService (`src/api/verification_uid/`)

- Generates UUID pairs for verification flows (email, password reset, phone)
- Hashes the second UUID for secure storage
- Verifies UIDs by comparing hashes
- Clears UIDs after successful verification

---

## Swagger Documentation

Interactive API documentation is available at `/api-docs`, protected by **Basic Authentication** (credentials from `DOCS_USER` / `DOCS_PASSWORD`).

- **OpenAPI 3.0.1** specification
- Auto-generated from per-module `*Docs.ts` files
- Merged using lodash `_.mergeWith` in `src/documentation/index.ts`
- Includes request/response examples, error scenarios, and authentication schemes

Each API module contributes its own documentation:
- `src/api/auth/authDocs.ts`
- `src/api/user/userDocs.ts`
- `src/api/project/projectDocs.ts`
- `src/api/notification/notificationDocs.ts`
- `src/documentation/genericDocs.ts` (shared response definitions)
