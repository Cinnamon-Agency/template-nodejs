# Database Schema

PostgreSQL database managed via **Prisma ORM**. Schema defined in `prisma/schema.prisma`.

---

## Models

### User (`users`)

Core user entity with multi-provider authentication support.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | Unique email address |
| `emailVerified` | Boolean | Email verification status (default: false) |
| `phoneNumber` | String? | Optional phone number |
| `phoneVerified` | Boolean | Phone verification status (default: false) |
| `password` | String? | Hashed password (nullable for OAuth users) |
| `authType` | AuthType | Authentication provider |
| `notifications` | Boolean? | Notification preference (default: false) |
| `profilePictureFileName` | String? | Profile picture file reference |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `roles` (UserRole[]), `projects` (Project[]), `notificationsSent`, `notificationsReceived`, `sessions` (UserSession[]), `verificationUIDs`

### Role (`roles`)

System-defined roles for RBAC.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | RoleType | Unique role name (USER, ADMIN, SUPERADMIN) |

**Relations:** `users` (UserRole[])

### UserRole (`user_roles`)

Many-to-many junction table between Users and Roles.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key → User |
| `roleId` | UUID | Foreign key → Role |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Constraints:** Unique on `[userId, roleId]`

### Project

User-owned projects with media file support.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Project name |
| `description` | String | Project description |
| `deadline` | DateTime | Project deadline |
| `userId` | UUID | Foreign key → User (owner) |
| `projectStatus` | ProjectStatus | Status (default: ACTIVE) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `user` (User), `mediaFiles` (Media[])

### Media

Media files linked to projects, stored in Google Cloud Storage.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `mediaType` | MediaType | Type (IMAGE, VIDEO) |
| `mediaFileName` | String | Unique file name in GCS |
| `projectId` | UUID | Foreign key → Project |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### Notification

In-app notifications between users.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `senderId` | UUID | Foreign key → User (sender) |
| `receiverId` | UUID | Foreign key → User (receiver) |
| `message` | String | Notification message |
| `read` | Boolean | Read status (default: true) |
| `notificationType` | NotificationType | Notification category |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### UserSession

JWT refresh token session management.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key (DB-generated) |
| `userId` | UUID | Foreign key → User |
| `refreshToken` | VarChar(500) | Hashed refresh token |
| `expiresAt` | DateTime | Session expiration |
| `status` | UserSessionStatus | Session state (default: ACTIVE) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `userId`, `refreshToken`

### VerificationUID

Verification tokens for email verification, password reset, etc.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key → User |
| `uid` | UUID | Public verification identifier |
| `hash` | VarChar(255) | Hashed verification secret |
| `type` | VerificationUIDType | Verification purpose |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `uid`, `userId`

### SupportRequest (`support_requests`)

Public support request submissions.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `firstName` | String | Requester first name |
| `lastName` | String | Requester last name |
| `email` | String | Requester email |
| `subject` | String | Request subject |
| `message` | Text | Request message body |
| `status` | SupportRequestStatus | Request status (default: OPEN) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### PhoneVerificationCode (`phone_verification_codes`)

SMS verification codes with expiration.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID | User requesting verification |
| `phoneNumber` | String | Phone number being verified |
| `code` | String | 6-digit verification code |
| `expiresAt` | DateTime | Code expiration (10 minutes) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

### LoginCode (`login_codes`)

Email-based login verification codes.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | String | User email |
| `code` | String | 4-digit login code |
| `expiresAt` | DateTime | Code expiration (10 minutes) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `email`

### DeviceToken (`device_tokens`)

Trusted device tokens for "don't ask on this device" feature.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | String | User who trusts this device |
| `token` | String | Unique device token |
| `expiresAt` | DateTime | Token expiration (30 days) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `userId`, `token` (unique)

---

## Enums

| Enum | Values |
|---|---|
| `AuthType` | `GOOGLE`, `LINKED_IN`, `APPLE`, `FACEBOOK`, `USER_PASSWORD` |
| `RoleType` | `USER`, `ADMIN`, `SUPERADMIN` |
| `MediaType` | `IMAGE`, `VIDEO` |
| `ProjectStatus` | `ACTIVE`, `FINISHED` |
| `UserSessionStatus` | `ACTIVE`, `EXPIRED`, `LOGGED_OUT` |
| `VerificationUIDType` | `REGISTRATION`, `RESET_PASSWORD`, `CHANGE_EMAIL`, `EMAIL_VERIFICATION`, `PHONE_VERIFICATION` |
| `NotificationType` | `EXAMPLE_NOTIFICATION` |
| `SupportRequestStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:

1. **Three roles:** `SUPERADMIN`, `ADMIN`, `USER`
2. **Superadmin user:** `superadmin@gmail.com` / `Sifra123!`

Run with:
```bash
yarn seed
```

---

## Migrations

Migrations are managed by Prisma Migrate and stored in `prisma/migrations/`.

```bash
# Create a new migration (development)
yarn migrate:dev

# Apply pending migrations (production)
yarn migrate:deploy

# Check migration status
yarn migrate:status

# Full bootstrap (generate + migrate + seed)
yarn db:bootstrap
```
