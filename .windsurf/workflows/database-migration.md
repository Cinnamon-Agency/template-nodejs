---
description: Create and manage database migrations
---

# Database Migration Workflow

## **Migration Creation Steps**

1. **Update Prisma Schema**
   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id        String   @id @default(uuid())
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     // Add your fields here
   }
   ```

2. **Generate Migration**
   ```bash
   npm run migrate:dev -- --name descriptive-migration-name
   ```

3. **Review Generated Migration**
   ```typescript
   // prisma/migrations/<timestamp>/migration.sql
   -- Review the SQL before applying
   ```

4. **Test Migration Locally**
   ```bash
   # Reset database and apply all migrations
   npm run migrate:reset
   npm run migrate:dev
   ```

5. **Update TypeScript Types**
   ```bash
   npm run prisma:generate
   ```

## **Production Migration Steps**

1. **Backup Database**
   ```bash
   pg_dump database_name > backup_before_migration.sql
   ```

2. **Test Migration on Staging**
   ```bash
   # Apply to staging environment first
   DATABASE_URL=staging_db_url npm run migrate:deploy
   ```

3. **Deploy Migration to Production**
   ```bash
   DATABASE_URL=production_db_url npm run migrate:deploy
   ```

4. **Verify Migration**
   ```bash
   # Check migration status
   npm run migrate:status
   
   # Verify schema
   npx prisma db pull
   ```

## **Migration Best Practices**

### **Naming Conventions**
- Use descriptive, snake_case names
- Include model name and action: `add_user_profile`, `remove_unused_field`
- Use timestamps automatically added by Prisma

### **Schema Changes**
- **Adding fields**: Safe, can be nullable with default
- **Removing fields**: Safe, but check dependencies
- **Changing field types**: Requires data migration
- **Adding relations**: Safe, but check existing data

### **Data Migration**
```typescript
// Create data migration script
// prisma/seed.ts or separate migration script
async function migrateData() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { newField: computeValue(user) },
    });
  }
}
```

## **Troubleshooting**

### **Migration Conflicts**
```bash
# Resolve conflicts by editing migration SQL
# Or reset and recreate migration
npm run migrate:reset
```

### **Failed Migration**
```bash
# Check migration status
npm run migrate:status

# Fix and redeploy
npx prisma migrate resolve --rolled-back <migration-name>
npm run migrate:deploy
```

### **Schema Drift**
```bash
# Compare schema with database
npx prisma db pull

# Create migration for differences
npm run migrate:dev -- --name sync-schema
```

## **Commands Reference**
```bash
# Create new migration
npm run migrate:dev -- --name migration-name

# Apply migrations (production)
npm run migrate:deploy

# Reset database
npm run migrate:reset

# Check migration status
npm run migrate:status

# Generate Prisma Client
npm run prisma:generate

# Pull schema from database
npx prisma db pull

# Push schema to database (dev only)
npx prisma db push
```
