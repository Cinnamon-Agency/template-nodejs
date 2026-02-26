# Project Agents & AI Assistants

## Overview

This project uses specialized AI agents to provide context-aware guidance for different parts of the codebase. Each subdirectory contains an `AGENTS.md` file with specific guidance for working in that area.

## Agent Documentation Locations

- **`src/api/AGENTS.md`** - Backend Development Agent (API controllers and endpoints)
- **`src/services/AGENTS.md`** - Authentication Agent (auth services and user management)
- **`src/middleware/AGENTS.md`** - Security Agent (authentication, authorization, validation)
- **`src/documentation/AGENTS.md`** - API Documentation Agent (Swagger/OpenAPI)
- **`prisma/AGENTS.md`** - Database Agent (schema design, migrations)
- **`tests/AGENTS.md`** - Testing Agent (unit and integration tests)
- **`.github/workflows/AGENTS.md`** - DevOps Agent (CI/CD, deployment, infrastructure)

## Workflow Commands

Agents are activated via workflow slash commands in `.windsurf/workflows/`:

- `/create-api-endpoint` - Create new API endpoints
- `/database-migration` - Create and manage database migrations
- `/security-review` - Conduct security reviews and assessments
- `/testing-strategy` - Implement comprehensive testing strategies
- `/deployment` - Handle deployment processes
- `/setup-development` - Setup development environment
- `/cache-management` - Manage and optimize cache services
- `/commit-message` - Generate AI-powered commit messages

## Usage

When working in a specific directory, refer to that directory's `AGENTS.md` file for context-specific guidance, patterns, and best practices.

## Quick DevOps Reference

### Docker Commands
```bash
# Development
docker-compose up -d              # Start all services
docker-compose logs -f app        # View logs
docker-compose down               # Stop services

# Build & Deploy
docker build -t myapp:latest .    # Build image
docker-compose up -d --build      # Rebuild and start
```

### Environment Setup
```bash
# Copy template and configure
cp .env.template .env

# Required variables
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-min-32-characters
REDIS_URL=redis://localhost:6379
```

### Common Tasks
```bash
# Run migrations
npx prisma migrate dev            # Development
npx prisma migrate deploy         # Production

# Database management
npx prisma studio                 # Open Prisma Studio
npx prisma db seed                # Seed database

# Testing
npm test                          # Run all tests
npm test -- --coverage            # With coverage

# Deployment
./scripts/deploy.sh               # Deploy to production
```

### Health Check
- Endpoint: `GET /health`
- Returns: `200 OK` if healthy, `503` if unhealthy
- Checks: Database, Redis, and application status

For detailed DevOps guidance, see `.github/workflows/AGENTS.md`
