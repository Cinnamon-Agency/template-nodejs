# API Reference

## Route Mounting

All feature routes are mounted in `src/routes/index.ts` under `/api/v1`. The docs route is mounted at the root level:

```
/api-docs              → Swagger UI (Basic Auth protected, mounted outside /api/v1)
/api/v1/auth           → Authentication module
/api/v1/user           → User management module
/api/v1/project        → Project module
/api/v1/notification   → Notification module
/api/v1/support_request → Support request module
/api/v1/media          → Media file management module
/api/v1/products       → Product catalog module
/api/v1/cart           → Shopping cart module
/api/v1/shipping       → Shipping zones & rates module
/api/v1/payment        → Payment & order management module
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
- **Password requirements**: 8–128 characters

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

## Media (`/media`)

**Source:** `src/api/media/`

Multi-provider media file management supporting AWS S3 and Google Cloud Storage.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/media/upload-url` | JWT | Get upload URL (storage-provider agnostic) |
| POST | `/media/s3/upload-url` | JWT | Get S3 presigned upload URL |
| POST | `/media/s3/complete-upload/:projectId` | JWT | Complete S3 upload and create media record |
| GET | `/media/s3/:mediaFileName/download-url` | JWT | Get S3 presigned download URL |
| DELETE | `/media/s3/:mediaId` | JWT | Delete file from S3 and media record |
| GET | `/media/s3/:mediaFileName/metadata` | JWT | Get S3 file metadata |
| GET | `/media/s3/files` | JWT | List S3 files |
| POST | `/media/gcs/upload-url` | JWT | Get GCS signed upload URL |
| POST | `/media/gcs/complete-upload/:projectId` | JWT | Complete GCS upload and create media record |
| GET | `/media/gcs/:mediaFileName/download-url` | JWT | Get GCS signed download URL |
| DELETE | `/media/gcs/:mediaId` | JWT | Delete file from GCS and media record |
| PUT | `/media/:mediaId` | JWT | Update/overwrite existing media file |

### Key Features

- **Dual storage provider** support: AWS S3 and Google Cloud Storage
- Presigned/signed URLs for direct client-side upload and download
- Media records linked to projects in the database
- File metadata retrieval and listing

---

## Product (`/products`)

**Source:** `src/api/product/`

Product catalog management with characteristics, categories, and variations.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products/` | — | List products (paginated, filterable by status/category/search) |
| GET | `/products/stats` | JWT (ADMIN) | Get product statistics |
| GET | `/products/:id` | — | Get product by ID |
| GET | `/products/sku/:sku` | — | Get product by SKU |
| POST | `/products/` | JWT (ADMIN) | Create product |
| PUT | `/products/:id` | JWT (ADMIN) | Update product |
| DELETE | `/products/:id` | JWT (ADMIN) | Delete product |
| PATCH | `/products/:id/stock` | JWT (ADMIN) | Update product stock |
| PATCH | `/products/:id/status` | JWT (ADMIN) | Update product status |

### Key Features

- **Public read access**: Product listing and details do not require authentication
- **Admin-only writes**: Create, update, delete, stock, and status changes require `ADMIN` role
- **Product variations**: Support for SKU-level variations with options
- **Product characteristics**: Typed key-value pairs (TEXT, NUMBER, COLOR, SIZE, etc.)
- **Categories**: Hierarchical category system with many-to-many product assignment
- **Statuses**: `ACTIVE`, `INACTIVE`, `DRAFT`, `ARCHIVED`

---

## Cart (`/cart`)

**Source:** `src/api/cart/`

Shopping cart management with automatic cart creation per user.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/cart/` | JWT | Get current user's cart with items and summary |
| POST | `/cart/items` | JWT | Add product to cart |
| PUT | `/cart/items/:productId` | JWT | Update cart item quantity |
| DELETE | `/cart/items/:productId` | JWT | Remove item from cart |
| DELETE | `/cart/` | JWT | Clear all cart items |

### Key Features

- **Auto-creation**: Cart is created automatically on first item add
- **Unique constraint**: One cart per user, one entry per product (quantity updates on re-add)
- Cart items include product details for display
- Cart cleared automatically upon successful payment

---

## Shipping (`/shipping`)

**Source:** `src/api/shipping/`

Shipping zone and rate management with calculation support.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/shipping/` | — | List all shipping zones |
| GET | `/shipping/calculate` | — | Calculate shipping cost for an order |
| GET | `/shipping/country/:countryCode` | — | Get shipping zone by country code |
| GET | `/shipping/:id` | — | Get shipping zone by ID |
| POST | `/shipping/` | JWT (ADMIN) | Create shipping zone |
| PUT | `/shipping/:id` | JWT (ADMIN) | Update shipping zone |
| DELETE | `/shipping/:id` | JWT (ADMIN) | Delete shipping zone |
| POST | `/shipping/:id/countries` | JWT (ADMIN) | Add country to zone |
| DELETE | `/shipping/:id/countries/:countryCode` | JWT (ADMIN) | Remove country from zone |
| POST | `/shipping/:id/rates` | JWT (ADMIN) | Add rate to zone |
| PUT | `/shipping/rates/:rateId` | JWT (ADMIN) | Update shipping rate |
| DELETE | `/shipping/rates/:rateId` | JWT (ADMIN) | Delete shipping rate |

### Key Features

- **Public read access**: Zone listing, lookup, and calculation are open
- **Admin-only management**: Zone/rate CRUD requires `ADMIN` or `SUPERADMIN` role
- **Zone-country mapping**: ISO 3166-1 alpha-2 country codes
- **Rate types**: `FLAT_RATE`, `PRICE_BASED`, `WEIGHT_BASED`, `FREE_SHIPPING`
- **Rate prioritization**: Rates have a priority field for conflict resolution

---

## Payment (`/payment`)

**Source:** `src/api/payment/`

Order creation and Stripe-based payment processing.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payment/orders` | JWT | Create order from cart |
| GET | `/payment/orders` | JWT | Get user orders (paginated, filterable by status) |
| GET | `/payment/orders/:orderId` | JWT | Get order details by ID |
| POST | `/payment/orders/:orderId/cancel` | JWT | Cancel an order |
| POST | `/payment/payment-intent` | JWT | Create Stripe Payment Intent for an order |
| POST | `/payment/confirm` | JWT | Confirm payment status after Stripe redirect |
| POST | `/payment/webhook` | — | Stripe webhook handler (signature-verified) |
| GET | `/payment/config` | — | Get Stripe publishable key for client-side |

### Key Features

- **Cart-to-order conversion**: Creates order from current cart with stock validation
- **Stripe integration**: Payment Intents API with client-side confirmation flow
- **Webhook handling**: Processes `payment_intent.succeeded`, `payment_intent.payment_failed`, and `payment_intent.canceled` events
- **Order fulfillment**: Automatic stock decrement and cart clearing on successful payment
- **Order statuses**: `PENDING`, `PROCESSING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`
- **Payment statuses**: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REFUNDED`
- **Idempotent fulfillment**: Double-payment protection via status checks in transactions

### Payment Flow

```
1. POST /payment/orders        → Create order from cart
2. POST /payment/payment-intent → Get clientSecret for Stripe.js
3. Client confirms payment via Stripe.js
4. POST /payment/confirm        → Verify payment status
   OR Stripe webhook fires      → Automatic fulfillment
```

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
- `src/api/support_request/supportRequestDocs.ts`
- `src/api/user_role/userRoleDocs.ts`
- `src/api/media/mediaDocs.ts`
- `src/api/product/productDocs.ts`
- `src/api/cart/cartDocs.ts`
- `src/api/shipping/shippingDocs.ts`
- `src/api/payment/paymentDocs.ts`
- `src/documentation/genericDocs.ts` (shared response definitions)
