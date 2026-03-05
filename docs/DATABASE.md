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
| `read` | Boolean | Read status (default: false) |
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
| `userId` | UUID | User who trusts this device |
| `token` | String | Unique device token |
| `expiresAt` | DateTime | Token expiration (30 days) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `userId`, `token` (unique)

### Product (`products`)

Product catalog with pricing, stock, and status management.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Product name |
| `description` | String? | Product description |
| `price` | Decimal(10,2) | Product price |
| `sku` | String | Unique SKU |
| `stock` | Int | Stock quantity (default: 0) |
| `status` | ProductStatus | Product status (default: ACTIVE) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `characteristics` (ProductCharacteristic[]), `categories` (ProductCategory[]), `cartItems` (CartItem[]), `variations` (ProductVariation[])

**Indexes:** `sku`, `status`, `price`

### ProductVariation (`product_variations`)

SKU-level product variations (e.g., size/color combinations).

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `productId` | UUID | Foreign key → Product |
| `sku` | String | Unique variation SKU |
| `name` | String | Variation name |
| `price` | Decimal(10,2) | Variation price |
| `stock` | Int | Stock quantity (default: 0) |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `product` (Product), `options` (VariationOption[])

**Indexes:** `productId`, `sku`, `isActive`

### VariationOption (`variation_options`)

Key-value options for product variations (e.g., color: red).

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `variationId` | UUID | Foreign key → ProductVariation |
| `name` | String | Option name (e.g., "Color") |
| `value` | String | Option value (e.g., "Red") |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `variationId`

### ProductCharacteristic (`product_characteristics`)

Typed key-value attributes for products.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `productId` | UUID | Foreign key → Product |
| `name` | String | Characteristic name |
| `value` | String | Characteristic value |
| `type` | ProductCharacteristicType | Value type |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `productId`, `type`

### Category (`categories`)

Hierarchical product categories with self-referencing parent.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Unique category name |
| `description` | String? | Category description |
| `parentId` | UUID? | Foreign key → Category (parent, nullable for root) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `parent` (Category?), `children` (Category[]), `products` (ProductCategory[])

**Indexes:** `parentId`

### ProductCategory (`product_categories`)

Many-to-many junction between Products and Categories.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `productId` | UUID | Foreign key → Product |
| `categoryId` | UUID | Foreign key → Category |
| `createdAt` | DateTime | Creation timestamp |

**Constraints:** Unique on `[productId, categoryId]`

### Cart (`carts`)

User shopping cart (one per user).

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key → User (unique) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `user` (User), `items` (CartItem[])

**Indexes:** `userId`

### CartItem (`cart_items`)

Individual items in a shopping cart.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `cartId` | UUID | Foreign key → Cart |
| `productId` | UUID | Foreign key → Product |
| `quantity` | Int | Item quantity (default: 1) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Constraints:** Unique on `[cartId, productId]`

**Indexes:** `cartId`, `productId`

### ShippingZone (`shipping_zones`)

Geographic shipping zones for rate calculation.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Unique zone name |
| `description` | String? | Zone description |
| `isActive` | Boolean | Active status (default: true) |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Relations:** `countries` (ShippingZoneCountry[]), `rates` (ShippingRate[])

**Indexes:** `isActive`

### ShippingZoneCountry (`shipping_zone_countries`)

Country assignments to shipping zones (ISO 3166-1 alpha-2 codes).

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shippingZoneId` | UUID | Foreign key → ShippingZone |
| `countryCode` | String | ISO 3166-1 alpha-2 code (e.g., US, GB) |
| `countryName` | String | Country display name |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Constraints:** Unique on `[shippingZoneId, countryCode]`

**Indexes:** `shippingZoneId`, `countryCode`

### ShippingRate (`shipping_rates`)

Shipping rate definitions per zone with multiple rate types.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `shippingZoneId` | UUID | Foreign key → ShippingZone |
| `name` | String | Rate name |
| `description` | String? | Rate description |
| `rateType` | ShippingRateType | Rate calculation type (default: FLAT_RATE) |
| `baseRate` | Decimal(10,2) | Base shipping rate |
| `minOrderValue` | Decimal(10,2)? | Minimum order value for this rate |
| `maxOrderValue` | Decimal(10,2)? | Maximum order value for this rate |
| `freeShippingMin` | Decimal(10,2)? | Minimum order value for free shipping |
| `estimatedDays` | Int? | Estimated delivery days |
| `isActive` | Boolean | Active status (default: true) |
| `priority` | Int | Rate priority for sorting (default: 0) |
| `weightUnit` | String? | Weight unit (e.g., kg, lb) |
| `pricePerUnit` | Decimal(10,2)? | Price per weight unit |
| `minWeight` | Decimal(10,2)? | Minimum weight for this rate |
| `maxWeight` | Decimal(10,2)? | Maximum weight for this rate |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `shippingZoneId`, `isActive`, `priority`

### Order (`orders`)

Customer orders created from cart checkout.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `userId` | UUID | Foreign key → User |
| `orderNumber` | String | Unique order number (e.g., ORD-{timestamp}-{uuid}) |
| `status` | OrderStatus | Order status (default: PENDING) |
| `subtotal` | Decimal(10,2) | Subtotal before shipping and tax |
| `shippingCost` | Decimal(10,2) | Shipping cost |
| `tax` | Decimal(10,2) | Tax amount |
| `total` | Decimal(10,2) | Total order amount |
| `currency` | String | Currency code (default: "usd") |
| `shippingAddress` | Json? | Shipping address (JSON object) |
| `shippingZoneId` | UUID? | Shipping zone reference |
| `shippingRateId` | UUID? | Shipping rate reference |
| `customerEmail` | String | Customer email |
| `customerPhone` | String? | Customer phone |
| `notes` | String? | Order notes |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `completedAt` | DateTime? | Completion timestamp |
| `cancelledAt` | DateTime? | Cancellation timestamp |

**Relations:** `items` (OrderItem[]), `payment` (Payment?)

**Indexes:** `userId`, `orderNumber`, `status`, `createdAt`

### OrderItem (`order_items`)

Snapshot of products at time of order.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID | Foreign key → Order |
| `productId` | UUID | Product reference |
| `productName` | String | Product name (snapshot) |
| `productSku` | String | Product SKU (snapshot) |
| `quantity` | Int | Quantity ordered |
| `unitPrice` | Decimal(10,2) | Unit price at time of order |
| `totalPrice` | Decimal(10,2) | Total price for this item |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |

**Indexes:** `orderId`, `productId`

### Payment (`payments`)

Stripe payment records linked to orders.

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `orderId` | UUID | Foreign key → Order (unique) |
| `stripePaymentIntentId` | String? | Stripe Payment Intent ID (unique) |
| `stripeCustomerId` | String? | Stripe Customer ID |
| `status` | PaymentStatus | Payment status (default: PENDING) |
| `amount` | Decimal(10,2) | Payment amount |
| `currency` | String | Currency code (default: "usd") |
| `paymentMethod` | String? | Payment method used |
| `clientSecret` | String? | Stripe client secret for client-side flows |
| `metadata` | Json? | Additional payment metadata |
| `errorMessage` | String? | Error message if payment failed |
| `createdAt` | DateTime | Creation timestamp |
| `updatedAt` | DateTime | Last update timestamp |
| `paidAt` | DateTime? | Payment completion timestamp |

**Indexes:** `orderId`, `stripePaymentIntentId`

---

## Enums

| Enum | Values |
|---|---|
| `AuthType` | `GOOGLE`, `APPLE`, `USER_PASSWORD` |
| `RoleType` | `USER`, `ADMIN`, `SUPERADMIN` |
| `MediaType` | `IMAGE`, `VIDEO` |
| `ProjectStatus` | `ACTIVE`, `FINISHED` |
| `UserSessionStatus` | `ACTIVE`, `EXPIRED`, `LOGGED_OUT` |
| `VerificationUIDType` | `REGISTRATION`, `RESET_PASSWORD`, `CHANGE_EMAIL`, `EMAIL_VERIFICATION`, `PHONE_VERIFICATION` |
| `NotificationType` | `EXAMPLE_NOTIFICATION` |
| `SupportRequestStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` |
| `ProductStatus` | `ACTIVE`, `INACTIVE`, `DRAFT`, `ARCHIVED` |
| `ProductCharacteristicType` | `TEXT`, `NUMBER`, `BOOLEAN`, `SELECT`, `COLOR`, `SIZE`, `WEIGHT`, `MATERIAL`, `BRAND`, `MODEL` |
| `ShippingRateType` | `FLAT_RATE`, `PRICE_BASED`, `WEIGHT_BASED`, `FREE_SHIPPING` |
| `OrderStatus` | `PENDING`, `PROCESSING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `PaymentStatus` | `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REFUNDED` |

---

## Seed Data

The seed script (`prisma/seed.ts`) creates:

1. **Three roles:** `SUPERADMIN`, `ADMIN`, `USER`
2. **Superadmin user:** `superadmin@gmail.com` with password from `SUPERADMIN_PASSWORD` environment variable (required)

Run with:
```bash
SUPERADMIN_PASSWORD=YourSecurePassword npm run seed
```

---

## Migrations

Migrations are managed by Prisma Migrate and stored in `prisma/migrations/`.

```bash
# Create a new migration (development)
npm run migrate:dev

# Apply pending migrations (production)
npm run migrate:deploy

# Check migration status
npm run migrate:status

# Full bootstrap (generate + migrate + seed)
npm run db:bootstrap
```
