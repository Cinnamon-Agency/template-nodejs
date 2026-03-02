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
import { autoInjectable, singleton } from 'tsyringe';
import { ResponseCode } from '@common/response';

@singleton()
@autoInjectable()
export class ResourceController {
  constructor(private readonly resourceService: ResourceService) {}

  async getAll(req: Request, res: Response, next: NextFunction) {
    const { filter } = req.query;
    
    const result = await this.resourceService.findAll(filter as string);
    
    return next({
      code: result.code,
      data: { items: result.items }
    });
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const { name, description } = res.locals.input;
    
    const result = await this.resourceService.create({ name, description });
    
    return next({
      code: result.code,
      data: { item: result.item }
    });
  }
}
```

### Service Pattern
```typescript
import { autoInjectable, singleton } from 'tsyringe';
import { ResponseCode, serviceMethod } from '@common/response';

@singleton()
@autoInjectable()
export class ResourceService implements IResourceService {
  constructor(private readonly userService: UserService) {}

  @serviceMethod()
  async findAll(filter?: string) {
    const items = await getPrismaClient().resource.findMany({
      where: filter ? { name: { contains: filter } } : undefined
    });

    return { 
      code: ResponseCode.OK, 
      items 
    };
  }

  @serviceMethod()
  async create({ name, description }: ICreateResource) {
    const item = await getPrismaClient().resource.create({
      data: { name, description }
    });

    return { 
      code: ResponseCode.OK, 
      item,
      message: 'Resource created successfully'
    };
  }
}
```

### TypeScript Requirements
- Use strict mode TypeScript
- Define explicit types for all parameters and return values
- Use interfaces for complex objects
- Leverage dependency injection with tsyringe

### Error Handling
- **Controllers**: NEVER use try-catch blocks - always use `return next({ code, data })`
- **Services**: ALWAYS use `@serviceMethod()` decorator for consistent error handling
- **Response Format**: Services return `{ code: ResponseCode, data?: any, message?: string }`
- **Error Propagation**: Errors are handled by middleware via the `next()` function
- **No Direct HTTP**: Services never call `res.json()` - only controllers orchestrate responses

### Critical Rules
1. **Controllers must use `return next({ code, data })`** - NEVER `res.json()`
2. **Services must use `@serviceMethod()` decorator** on all public methods
3. **No try-catch in controllers** - let services handle errors
4. **Consistent response structure** across all endpoints
5. **Business logic in services only** - controllers are thin orchestration layers

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
5. **Handle Errors Properly**: Use `@serviceMethod()` and `next()` pattern
6. **Return Consistent Responses**: Use `next({ code, data })` pattern
7. **Log Appropriately**: Log errors and important operations
8. **Test Thoroughly**: Write integration tests for all endpoints
9. **No Direct HTTP in Services**: Services only return data, never call `res.json()`
10. **Consistent Error Handling**: All service methods use `@serviceMethod()` decorator

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
