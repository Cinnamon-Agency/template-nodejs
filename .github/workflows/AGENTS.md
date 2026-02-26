# DevOps Agent Guide

## Role
Deployment & Infrastructure Specialist

## Scope
This guide covers deployment files, CI/CD pipelines, and infrastructure management for the Node.js application.

## Key Responsibilities

- Maintain Docker configurations (Dockerfile, docker-compose.yml)
- Configure and manage CI/CD pipelines (GitHub Actions)
- Manage environment variables and secrets
- Deploy to production environments
- Implement health checks and monitoring
- Handle deployment rollbacks and recovery

## Key Files

- **`Dockerfile`** - Multi-stage build configuration for production
- **`docker-compose.yml`** - Local development and production services setup
- **`.dockerignore`** - Files to exclude from Docker builds
- **`.github/workflows/ci-cd.yml`** - CI/CD pipeline configuration
- **`scripts/deploy.sh`** - Deployment automation script

## Common Docker Commands

```bash
# Build and run
docker-compose up -d --build
docker-compose logs -f app
docker-compose down

# Container management
docker ps
docker logs -f <container-id>
docker exec -it <container-id> sh
```

## CI/CD Pipeline

### GitHub Actions Workflow Structure

The CI/CD pipeline (`.github/workflows/ci-cd.yml`) includes:

1. **Test Job** - Runs linting, type checking, and tests with coverage
2. **Build Job** - Builds and pushes Docker image to registry
3. **Deploy Job** - Deploys to production on main branch

### Deployment Process

Use `scripts/deploy.sh` for manual deployments:
```bash
./scripts/deploy.sh
```

The script handles:
- Pulling latest code
- Building Docker images
- Stopping old containers
- Starting new containers
- Running database migrations
- Health check verification

## Environment Configuration

### Setup
```bash
cp .env.template .env
# Edit .env with your configuration
```

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret (min 32 characters)
- `JWT_REFRESH_SECRET` - Refresh token secret

### Environment-Specific Files
- `.env.development` - Development settings
- `.env.staging` - Staging settings
- `.env.production` - Production settings

See `.env.template` for complete list of available variables.

## Health Check & Monitoring

### Health Endpoint
- **URL**: `GET /health`
- **Returns**: `200 OK` if healthy, `503` if unhealthy
- **Checks**: Database, Redis, application status

### Logging
- Uses Winston for structured logging
- Log levels: error, warn, info, debug
- Configure via `LOG_LEVEL` environment variable

## Troubleshooting

```bash
# Container issues
docker logs <container-id>
docker stats
docker inspect <container-id>

# Database connection
docker exec <container-id> env | grep DATABASE_URL
docker logs <db-container-id>

# Build issues
docker builder prune
docker build --progress=plain .
```

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Docker image built and tested
- [ ] Health checks implemented
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan prepared
- [ ] Security scan completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Team notified

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Deployment: `/home/matejmusap/Desktop/template-nodejs/docs/DEPLOYMENT.md`
- Environment: `/home/matejmusap/Desktop/template-nodejs/docs/ENVIRONMENT.md`
- Getting Started: `/home/matejmusap/Desktop/template-nodejs/docs/GETTING_STARTED.md`
