# Backend Development Agent Guide

## Role
Node.js & TypeScript Backend Specialist for API Development

## Scope
This directory (`src/api/`) contains all API endpoint controllers and handlers. The Backend Development Agent is responsible for implementing, maintaining, and optimizing these endpoints.

## Key Responsibilities in This Directory

### 1. API Endpoint Implementation
- Create new controller files following the established pattern
- Implement request handlers with proper TypeScript typing
- Use dependency injection for services and repositories
- Follow RESTful conventions for HTTP methods and status codes

### 2. Request/Response Handling
- Validate incoming requests using validation middleware
- Transform data using DTOs (Data Transfer Objects)
- Return consistent response formats
- Handle errors gracefully with appropriate status codes

### 3. Business Logic Integration
- Call appropriate services from `src/services/`
- Orchestrate multiple service calls when needed
- Handle transactions and error rollbacks
- Implement proper error handling and logging

## Standards for This Directory

### File Structure
```
src/api/
├── [resource]/
│   ├── [resource].controller.ts    # Main controller
│   ├── [resource].dto.ts           # Data Transfer Objects
│   ├── [resource].validation.ts    # Request validation schemas
│   └── index.ts                    # Exports
```

### Controller Pattern
```typescript
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';

@injectable()
export class ResourceController {
  constructor(
    @inject('ResourceService') private resourceService: ResourceService
  ) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await this.resourceService.findAll();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

### TypeScript Requirements
- Use strict mode TypeScript
- Define explicit types for all parameters and return values
- Use interfaces for complex objects
- Leverage dependency injection with tsyringe

### Error Handling
- Always use try-catch blocks in async handlers
- Pass errors to Express error middleware using `next(error)`
- Use custom error classes from `src/common/errors/`
- Log errors appropriately before passing to middleware

## Common Tasks

### Creating a New Endpoint
1. Create controller file in appropriate resource directory
2. Implement handler methods with proper typing
3. Add validation schemas for request data
4. Create DTOs for request/response transformation
5. Register routes in `src/routes/`
6. Add tests in `tests/integration/`

### Updating an Endpoint
1. Review existing controller implementation
2. Update handler logic while maintaining backward compatibility
3. Update validation schemas if request format changes
4. Update DTOs if response format changes
5. Update tests to cover new scenarios

### Optimizing Performance
1. Review database queries in service layer
2. Implement caching where appropriate
3. Use pagination for list endpoints
4. Optimize data transformation logic
5. Profile and benchmark critical endpoints

## Integration Points

### Services (`src/services/`)
- Controllers should only orchestrate service calls
- Business logic belongs in services, not controllers
- Use dependency injection to access services

### Middleware (`src/middleware/`)
- Apply authentication middleware to protected routes
- Use validation middleware for request validation
- Apply rate limiting for public endpoints
- Use error handling middleware for consistent error responses

### Documentation (`src/documentation/`)
- Update Swagger annotations when adding/modifying endpoints
- Ensure all endpoints are properly documented
- Include request/response examples

## Best Practices

1. **Keep Controllers Thin**: Business logic belongs in services
2. **Use Dependency Injection**: Never instantiate services directly
3. **Validate Early**: Validate requests before processing
4. **Type Everything**: Leverage TypeScript's type system
5. **Handle Errors Properly**: Use try-catch and error middleware
6. **Return Consistent Responses**: Use standard response formats
7. **Log Appropriately**: Log errors and important operations
8. **Test Thoroughly**: Write integration tests for all endpoints

## Quick Reference

### HTTP Status Codes
- `200 OK`: Successful GET, PUT, PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `500 Internal Server Error`: Server error

### Common Imports
```typescript
import { Request, Response, NextFunction } from 'express';
import { injectable, inject } from 'tsyringe';
import { validateRequest } from '@/middleware/validation';
import { authenticate } from '@/middleware/auth';
```

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Architecture: `/home/matejmusap/Desktop/template-nodejs/docs/ARCHITECTURE.md`
- API Reference: `/home/matejmusap/Desktop/template-nodejs/docs/API_REFERENCE.md`
