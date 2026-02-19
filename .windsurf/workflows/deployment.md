---
description: Deployment process and infrastructure management
---

# Deployment Workflow

## **Deployment Environments**

### **Development**
- Local development with hot reload
- Database: PostgreSQL local instance
- Environment variables from `.env.local`

### **Staging**
- Mirror of production environment
- Used for testing and validation
- Database: PostgreSQL staging instance

### **Production**
- Live environment for users
- Database: PostgreSQL production instance
- High availability and monitoring

## **Docker Configuration**

### **Dockerfile**
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN yarn ci --only=production

COPY . .
RUN yarn build

# Production image
FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma

USER nodejs

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### **Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:password@postgres:5432/dbname
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=dbname
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:6-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'yarn'
      
      - run: yarn install --frozen-lockfile
      - run: yarn test --coverage
      - run: yarn lint
      - run: yarn build

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to staging
        run: |
          echo "Deploying to staging..."
          # Add deployment commands

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          echo "Deploying to production..."
          # Add deployment commands
```

## **Environment Configuration**

### **Environment Variables**
```bash
# .env.template
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key

# AWS
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Google Cloud
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json

# Email (AWS SES)
AWS_SES_REGION=us-east-1
EMAIL_FROM=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## **Database Migration in Production**

### **Migration Strategy**
```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migrations
yarn prisma migrate deploy

# 3. Verify migration
yarn prisma migrate status

# 4. Update application
docker-compose pull
docker-compose up -d
```

### **Rollback Strategy**
```bash
# Rollback migration
yarn prisma migrate reset --force

# Restore from backup
psql $DATABASE_URL < backup_20231201_120000.sql

# Rollback application
docker-compose down
docker-compose up -d --scale app=1
```

## **Health Checks**

### **Application Health Endpoint**
```typescript
// src/api/health/health.controller.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

export class HealthController {
  constructor(private prisma: PrismaClient) {}

  async check(req: Request, res: Response) {
    try {
      // Check database connection
      await this.prisma.$queryRaw`SELECT 1`;
      
      // Check external services
      const services = await this.checkExternalServices();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services,
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
      });
    }
  }

  private async checkExternalServices() {
    // Check Redis, AWS services, etc.
    return {
      database: 'healthy',
      redis: 'healthy',
      aws: 'healthy',
    };
  }
}
```

### **Docker Health Check**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

## **Monitoring & Logging**

### **Application Monitoring**
```typescript
// src/core/monitoring/metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export const httpRequestDuration = new createPrometheusMetrics.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestTotal = new createPrometheusMetrics.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});
```

### **Error Tracking with Sentry**
```typescript
// src/core/monitoring/sentry.ts
import * as Sentry from '@sentry/node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
  });
};

export const captureException = (error: Error) => {
  Sentry.captureException(error);
};
```

## **Security in Production**

### **SSL/TLS Configuration**
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **Firewall Rules**
```bash
# UFW configuration
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 3000/tcp  # Block direct access to app
ufw enable
```

## **Backup Strategy**

### **Database Backup**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="your_database"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/db_backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/db_backup_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/db_backup_$DATE.sql.gz s3://your-backup-bucket/
```

### **Application Backup**
```bash
# Backup application files
tar -czf app_backup_$DATE.tar.gz /path/to/app
aws s3 cp app_backup_$DATE.tar.gz s3://your-backup-bucket/
```

## **Deployment Commands**

```bash
# Build and deploy
docker-compose build
docker-compose up -d

# Check deployment status
docker-compose ps
docker-compose logs app

# Scale application
docker-compose up -d --scale app=3

# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Health check
curl http://localhost:3000/health
```

## **Troubleshooting**

### **Common Issues**
- **Database connection failed**: Check DATABASE_URL and network connectivity
- **Migration failed**: Verify migration SQL and database permissions
- **Application won't start**: Check logs and environment variables
- **High memory usage**: Monitor with `docker stats` and optimize queries

### **Debug Commands**
```bash
# Check application logs
docker-compose logs app

# Check database connection
yarn prisma db pull

# Test health endpoint
curl http://localhost:3000/health

# Monitor resources
docker stats
top
htop
```

## **Performance Optimization**

### **Database Optimization**
- Use connection pooling
- Add proper indexes
- Optimize slow queries
- Monitor query performance

### **Application Optimization**
- Enable gzip compression
- Implement caching
- Use CDN for static assets
- Monitor memory usage

### **Infrastructure Optimization**
- Use load balancer
- Implement auto-scaling
- Optimize Docker images
- Use SSD storage
