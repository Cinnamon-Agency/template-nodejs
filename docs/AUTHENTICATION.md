# Authentication & Authorization

## Overview

The application implements JWT-based authentication with support for multiple OAuth providers, email/phone verification, login codes, and role-based access control (RBAC).

---

## Token Flow

```
Register/Login → AuthService.signToken()
  ├── Generate access token (JWT, 15 min default)
  ├── Generate refresh token (JWT, 7 days default)
  ├── Hash refresh token with bcrypt → store in UserSession
  └── Return tokens (cookies for web, body for mobile)

Token Refresh → AuthService.refreshToken()
  ├── Verify refresh token JWT signature
  ├── Compare hash with stored session in database
  ├── Generate new access + refresh tokens
  ├── Update session with new refresh token hash
  └── Return new tokens

Logout → AuthService.logout()
  └── Set session status to LOGGED_OUT
```

---

## Token Delivery

The system supports two token delivery mechanisms based on the `x-client-type` header:

### Web Clients (default)
Tokens are set as **HTTP-only secure cookies**:

```typescript
{
  httpOnly: true,      // Not accessible via JavaScript (XSS protection)
  secure: true,        // HTTPS only
  sameSite: 'strict'   // CSRF protection
}
```

- Access token cookie expires with the token (15 min)
- Refresh token cookie expires with the token (7 days)

### Mobile Clients (`x-client-type: mobile`)
Tokens are returned in the **response body** for bearer token usage:

```json
{
  "data": {
    "user": { "id": "..." },
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

---

## Authentication Types

| AuthType | Description |
|---|---|
| `USER_PASSWORD` | Email + password authentication |
| `GOOGLE` | Google OAuth |
| `LINKED_IN` | LinkedIn OAuth |
| `APPLE` | Apple Sign-In |
| `FACEBOOK` | Facebook Login |

For `USER_PASSWORD`, the password is hashed with bcrypt (configurable salt rounds via `SALT_ROUNDS`). OAuth providers do not require a password.

---

## Role-Based Access Control (RBAC)

### Roles

| Role | Description |
|---|---|
| `USER` | Standard user with basic access |
| `ADMIN` | Administrative user with extended privileges |
| `SUPERADMIN` | Full system access, bypasses all role checks |

### Usage in Routes

```typescript
// Any authenticated user
router.get('/profile', requireToken, controller.getProfile)

// Only ADMIN (and SUPERADMIN)
router.put('/status/:id', requireToken(['ADMIN']), controller.updateStatus)
```

### How `requireToken` Works

1. Extracts access token from `accessToken` cookie
2. Verifies JWT signature and expiration
3. Loads user from database (including roles)
4. If `allowedRoles` specified:
   - `SUPERADMIN` always passes
   - Checks if user has at least one of the allowed roles
5. Attaches user to `req.user`

### Session Management

- **Single active session**: New login automatically logs out the previous session
- **Refresh token rotation**: Each refresh generates a new token pair and invalidates the old refresh token
- **Hashed storage**: Refresh tokens are bcrypt-hashed before database storage
- **Session states**: `ACTIVE`, `EXPIRED`, `LOGGED_OUT`

---

## Verification Flows

### Email Verification

```
Register → Generate UUID pair (uid + hashUID)
  → Hash hashUID with bcrypt → Store in VerificationUID table
  → Send email with verification link containing uid/hashUID
  → User clicks link → POST /auth/verify-email with uid
  → Service verifies uid exists, compares hashUID hash
  → Mark user.emailVerified = true
  → Delete VerificationUID record
```

### Password Reset

```
POST /auth/password/forgot → Find user by email
  → Generate UUID pair → Store hashed in VerificationUID
  → Send reset email with link
  → User clicks link → POST /auth/password/reset with uid + new password
  → Verify UID → Update password (bcrypt hashed)
  → Delete VerificationUID record
```

### Phone Verification (SMS)

```
POST /auth/send-phone-verification (requires JWT)
  → Generate 6-digit code → Store with 10 min expiry
  → Send SMS via AWS Pinpoint
  → POST /auth/verify-phone with code
  → Verify code exists and not expired
  → Mark user.phoneVerified = true, store phoneNumber
  → Delete verification code
```

### Login Code Verification

```
POST /auth/resendLoginCode → Find user by email
  → Generate 4-digit code → Store with 10 min expiry
  → Send code via email (AWS SES)
  → POST /auth/verifyLoginCode with code + email
  → Verify code exists and not expired
  → Delete used code
  → Optionally store device token (30 days) if dontAskOnThisDevice=true
  → Sign and return JWT tokens
```

---

## Device Trust ("Don't Ask on This Device")

When verifying a login code, users can set `dontAskOnThisDevice: true` to:

1. Generate a cryptographically random 64-character device token
2. Store it in the `DeviceToken` table with 30-day expiry
3. Set it as an HTTP-only cookie (`deviceToken`, 30 days)
4. Return it in the response body for mobile clients

The device token can later be verified via `AuthService.verifyDeviceToken()` to skip login code verification on trusted devices.

---

## Security Measures

- **Password hashing**: bcrypt with configurable salt rounds (default: 10)
- **Token secrets**: Separate secrets for access and refresh tokens
- **Refresh token hashing**: Stored as bcrypt hashes, never in plain text
- **Rate limiting**: Login and verification endpoints have stricter rate limits
- **Cookie security**: httpOnly + secure + sameSite strict
- **Verification UID hashing**: Second UUID in pair is bcrypt-hashed before storage
- **Session enforcement**: Single active session per user
- **Sensitive data masking**: CloudWatch middleware masks passwords, tokens, and auth headers in logs
