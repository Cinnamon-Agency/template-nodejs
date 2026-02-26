# Database Agent Guide

## Role
Database Architecture & Prisma Specialist

## Scope
This directory (`prisma/`) contains all database schema definitions, migrations, and seed data. The Database Agent is responsible for database design, migrations, and data integrity.

## Key Responsibilities in This Directory

### 1. Schema Design (`schema.prisma`)
- Define database models with proper relationships
- Set up appropriate indexes for query optimization
- Configure constraints for data integrity
- Define enums and custom types
- Manage database provider configuration

### 2. Migrations (`migrations/`)
- Create migrations for schema changes
- Review migration SQL before applying
- Handle data migrations when needed
- Rollback strategies for failed migrations
- Version control for database changes

### 3. Seed Data (`seed.ts`)
- Create seed data for development and testing
- Maintain data consistency across environments
- Handle dependencies between seeded entities
- Clean up existing data before seeding

## Standards for This Directory

### Schema Design Principles
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relationships
  posts     Post[]
  
  // Indexes
  @@index([email])
  @@map("users")
}
```

### Naming Conventions
- **Models**: PascalCase, singular (e.g., `User`, `BlogPost`)
- **Fields**: camelCase (e.g., `firstName`, `createdAt`)
- **Relations**: camelCase, plural for one-to-many (e.g., `posts`, `comments`)
- **Table names**: snake_case, plural via `@@map` (e.g., `@@map("users")`)
- **Enums**: PascalCase (e.g., `UserRole`, `PostStatus`)

### Field Standards
- **IDs**: Use `String @id @default(uuid())` for primary keys
- **Timestamps**: Always include `createdAt` and `updatedAt`
- **Soft Deletes**: Use `deletedAt DateTime?` when needed
- **Required vs Optional**: Use `?` for optional fields
- **Defaults**: Set sensible defaults with `@default()`

## Common Tasks

### Creating a New Model
1. Define model in `schema.prisma`
2. Add relationships to existing models if needed
3. Add appropriate indexes
4. Create migration: `npx prisma migrate dev --name add_model_name`
5. Update seed data if needed
6. Generate Prisma Client: `npx prisma generate`

### Modifying an Existing Model
1. Update model definition in `schema.prisma`
2. Consider backward compatibility
3. Create migration: `npx prisma migrate dev --name update_model_name`
4. Review generated SQL
5. Update seed data if structure changed
6. Update related services and repositories

### Creating Indexes
```prisma
model Post {
  id        String   @id @default(uuid())
  title     String
  authorId  String
  status    String
  createdAt DateTime @default(now())
  
  // Single field index
  @@index([authorId])
  
  // Composite index
  @@index([status, createdAt])
  
  // Unique constraint
  @@unique([title, authorId])
}
```

### Managing Relationships
```prisma
// One-to-Many
model User {
  id    String @id @default(uuid())
  posts Post[]
}

model Post {
  id       String @id @default(uuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id])
  
  @@index([authorId])
}

// Many-to-Many
model Post {
  id   String @id @default(uuid())
  tags Tag[]  @relation("PostTags")
}

model Tag {
  id    String @id @default(uuid())
  posts Post[] @relation("PostTags")
}
```

## Migration Best Practices

### Creating Migrations
```bash
# Development migration
npx prisma migrate dev --name descriptive_migration_name

# Production migration
npx prisma migrate deploy
```

### Migration Naming
- Use descriptive names: `add_user_email_index`
- Include action: `create_posts_table`, `add_status_field`, `remove_deprecated_column`
- Use snake_case for migration names

### Reviewing Migrations
1. Check generated SQL in `migrations/` directory
2. Verify data preservation for existing records
3. Test migration on development database first
4. Consider performance impact on large tables
5. Plan for rollback if needed

### Data Migrations
```typescript
// In migration.sql
-- Add new column with default
ALTER TABLE "users" ADD COLUMN "status" TEXT DEFAULT 'active';

-- Update existing data
UPDATE "users" SET "status" = 'active' WHERE "status" IS NULL;

-- Make column required
ALTER TABLE "users" ALTER COLUMN "status" SET NOT NULL;
```

## Seed Data Management

### Seed File Structure
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();
  
  // Create users
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  });
  
  // Create related data
  await prisma.post.create({
    data: {
      title: 'First Post',
      authorId: user.id,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Running Seeds
```bash
# Run seed
npx prisma db seed

# Reset database and seed
npx prisma migrate reset
```

## Performance Optimization

### Indexing Strategy
- Index foreign keys used in joins
- Index fields used in WHERE clauses
- Index fields used in ORDER BY
- Use composite indexes for multi-field queries
- Monitor index usage and remove unused indexes

### Query Optimization
- Use `select` to fetch only needed fields
- Use `include` judiciously to avoid N+1 queries
- Implement pagination for large datasets
- Use database-level aggregations
- Consider materialized views for complex queries

## Database Constraints

### Data Integrity
```prisma
model User {
  id       String   @id @default(uuid())
  email    String   @unique
  age      Int      @default(0)
  role     UserRole @default(USER)
  
  // Check constraints (PostgreSQL)
  @@map("users")
}

enum UserRole {
  USER
  ADMIN
  MODERATOR
}
```

### Cascade Behavior
```prisma
model Post {
  id       String @id @default(uuid())
  authorId String
  author   User   @relation(fields: [authorId], references: [id], onDelete: Cascade)
}
```

## Troubleshooting

### Common Issues
1. **Migration conflicts**: Reset dev database or resolve manually
2. **Type mismatches**: Regenerate Prisma Client after schema changes
3. **Relation errors**: Ensure both sides of relation are defined
4. **Seed failures**: Check for constraint violations and data dependencies

### Useful Commands
```bash
# Generate Prisma Client
npx prisma generate

# View database in Prisma Studio
npx prisma studio

# Format schema file
npx prisma format

# Validate schema
npx prisma validate

# Reset database (dev only)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Database Documentation: `/home/matejmusap/Desktop/template-nodejs/docs/DATABASE.md`
- Architecture: `/home/matejmusap/Desktop/template-nodejs/docs/ARCHITECTURE.md`
