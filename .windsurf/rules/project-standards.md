# Project Standards & Rules

## **Code Quality Standards**

### **TypeScript Rules**
- Always use strict TypeScript mode
- Define proper interfaces and types for all data structures
- Avoid using `any` type - use `unknown` or proper typing
- Use proper return types for all functions
- Implement proper error handling with typed errors

### **Code Organization**
- Follow the existing folder structure:
  - `src/api/` - API modules (auth, user, project, notification, etc.), each with controller, service, router, interface, input, and docs files
  - `src/core/` - Core infrastructure (app, config, logger, server)
  - `src/common/` - Shared utilities, types, constants, decorators, and response definitions
  - `src/middleware/` - Express middleware (auth, validation, rate_limiter, error_handler, sanitize, etc.)
  - `src/services/` - External service integrations (prisma, redis, cache, aws-ses, bcrypt, jsonwebtoken, etc.)
  - `src/routes/` - Central route aggregation
  - `src/documentation/` - Swagger/OpenAPI documentation setup
- Use dependency injection with `tsyringe` (`@singleton()`, `@autoInjectable()`, `container.resolve()`)
- Implement proper service layer architecture
- Keep business logic separate from API controllers
- Use middleware in routers for common functionality (authentication, validation, rate limiting)

### **API Development Standards**
- Use Express.js with proper middleware configuration
- Implement proper HTTP status codes and error responses
- Use Joi for request/response validation
- Follow RESTful API design principles
- Implement proper authentication and authorization middleware

### **Database Standards**
- Use Prisma ORM for all database operations
- Define proper relationships and constraints in schema
- Use transactions for multi-table operations
- Implement proper error handling for database operations
- Use environment-specific database configurations

### **Security Standards**
- Implement JWT-based authentication (HS256 with symmetric secrets; consider RS256 for production)
- Use bcrypt for password hashing (default 10 salt rounds, configurable via `SALT_ROUNDS` env var)
- Validate and sanitize all user inputs
- Implement rate limiting for API endpoints using `rate-limiter-flexible`
- Use helmet for security headers
- Never expose sensitive data in API responses

### **Testing Standards**
- Write unit tests for all business logic
- Implement integration tests for API endpoints
- Use Jest as the testing framework
- Achieve minimum 80% code coverage
- Mock external dependencies in tests

### **Documentation Standards**
- Maintain comprehensive API documentation with Swagger
- Document all public functions and interfaces
- Use clear and descriptive variable names
- Add comments for complex business logic
- Keep documentation up to date with code changes

## **Development Workflow Rules**

### **Git Workflow**
- Use feature branches for new development
- Write clear and descriptive commit messages
- Create pull requests for code review
- Ensure all tests pass before merging
- Follow conventional commit message format

### **Code Review Process**
- All code must be reviewed before merging
- Ensure code follows project standards
- Verify test coverage and functionality
- Check for security vulnerabilities
- Validate performance implications

### **Environment Management**
- Use environment variables for configuration
- Never commit sensitive data to repository
- Use `.env.template` for environment variable documentation
- Implement proper logging for different environments
- Use Docker for consistent development environments

## **Performance Guidelines**

### **Database Optimization**
- Use proper indexing for frequently queried fields
- Implement pagination for large datasets
- Optimize Prisma queries to avoid N+1 problems
- Use connection pooling for database connections
- Monitor query performance regularly

### **API Performance**
- Implement proper caching strategies
- Use compression for API responses
- Optimize middleware order
- Implement request timeout handling
- Monitor API response times

### **Memory Management**
- Avoid memory leaks in long-running processes
- Use proper cleanup in error scenarios
- Implement proper stream handling
- Monitor memory usage in production
- Use efficient data structures

## **Error Handling Standards**

### **Error Types**
- Define custom error classes for different error types
- Use proper HTTP status codes for different error scenarios
- Implement consistent error response format
- Log errors with proper context and severity
- Provide meaningful error messages to clients

### **Error Recovery**
- Implement retry logic for transient failures
- Use circuit breakers for external services
- Implement graceful degradation
- Provide fallback mechanisms where appropriate
- Monitor error rates and patterns
