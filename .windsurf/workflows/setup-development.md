---
description: Setup development environment for the Node.js project
---

# Development Environment Setup

## **Prerequisites**
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database
- Git

## **Setup Steps**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd template-nodejs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.template .env
   # Edit .env with your configuration
   ```

4. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb template_nodejs
   
   # Run migrations
   npm run migrate:dev
   
   # Seed database (optional)
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

## **Example Commands**
```bash
# Create migration
npm run migrate:dev -- --name add-feature

# Run tests
npm test

# Build project
npm run build

# Start development
npm run dev
```

## **Verification**
- API server running on http://localhost:3000
- Database connected and migrations applied
- Health check endpoint responding: GET /health

## **Troubleshooting**
- Ensure PostgreSQL is running
- Check database connection string in .env
- Verify all environment variables are set
- Check for port conflicts on 3000
