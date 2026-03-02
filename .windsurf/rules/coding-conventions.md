# Coding Conventions

## **Naming Conventions**

### **Files and Directories**
- Use camelCase for file names: `userService.ts`, `authController.ts`, `authRouter.ts`
- Use snake_case for directory names under `src/api/`: `support_request/`, `user_role/`, `user_session/`
- Use snake_case for middleware directory names: `error_handler/`, `rate_limiter/`, `log_middleware/`
- Use kebab-case for service directory names: `aws-ses/`, `aws-end-user-messaging/`, `google_cloud_storage/`
- Test files should end with `.test.ts`: `authService.test.ts`, `cache.test.ts`
- Interface files should be named `interface.ts` within each module directory
- Type definition files should end with `.types.ts`

### **Variables and Functions**
- Use camelCase for variables and functions: `userName`, `getUserById()`
- Use descriptive names that clearly indicate purpose
- Avoid abbreviations unless widely understood
- Use boolean prefixes for boolean variables: `isActive`, `hasPermission`
- Use action verbs for function names: `createUser()`, `validateInput()`

### **Classes and Interfaces**
- Use PascalCase for classes and interfaces: `UserService`, `AuthController`
- Prefix service contract interfaces and parameter interfaces with `I`: `IAuthService`, `ICreateUser`, `ILogin`
- Internal/local interfaces (e.g., `DecodedToken`, `CacheEntry`, `AuthTokens`) do not require the `I` prefix
- Use descriptive class names that reflect their responsibility
- Abstract classes should be prefixed with `Abstract`: `AbstractService`

### **Constants**
- Use UPPER_SNAKE_CASE for constants: `MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`
- Group related constants in objects or enums
- Use `const` instead of `var` or `let` when possible
- Define constants at the top of files or in separate constant files

## **Code Structure**

### **Import Statements**
- Group imports in this order: 1) Node.js modules, 2) External libraries, 3) Internal modules, 4) Relative imports
- Use absolute imports with path aliases when configured
- Avoid unused imports
- Use named imports instead of default imports when possible

```typescript
// Node.js modules
import { Request, Response } from 'express';
import { randomBytes } from 'crypto';

// External libraries
import { autoInjectable, singleton } from 'tsyringe';
import { PrismaClient } from '@prisma/client';

// Internal modules
import { ResponseCode, serviceMethod } from '@common';
import { UserService } from '@api/user/userService';
import { getPrismaClient } from '@services/prisma';

// Relative imports
import { ILogin, IAuthService } from './interface';
```

### **Function Organization**
- Export functions should be at the bottom of the file
- Helper functions should be private or internal
- Group related functions together
- Use JSDoc comments for public functions

### **Class Structure**
1. Properties (private first, then public)
2. Constructor
3. Public methods
4. Private methods
5. Getters and setters

## **TypeScript Specific Conventions**

### **Type Definitions**
- Use `interface` for object shapes that can be extended
- Use `type` for unions, intersections, and computed types
- Prefer explicit return types for public functions
- Use generics for reusable components

```typescript
// Interface for object shapes
interface IUser {
  id: string;
  email: string;
  createdAt: Date;
}

// Type for unions and computed types
type UserRole = 'admin' | 'user' | 'moderator';
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};
```

### **Error Handling**
- Use typed errors with custom error classes
- Implement proper error boundaries
- Use try-catch blocks for async operations
- Return Result types instead of throwing for expected errors

```typescript
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

type Result<T, E = Error> = {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
};
```

### **Async/Await**
- Prefer async/await over Promise chains
- Use Promise.all() for parallel async operations
- Handle errors properly in async functions
- Use proper typing for async functions

## **API Conventions**

### **Controller Structure**
- Use `@singleton()` and `@autoInjectable()` decorators from tsyringe for DI
- Inject services via constructor with `private readonly`
- Use arrow function properties for route handlers to preserve `this` context
- **CRITICAL**: Always use `return next({ code, data })` pattern - NEVER call `res.json()` directly
- Keep controllers thin, delegate business logic to services
- Apply validation and auth middleware in the **router**, not as controller decorators
- **No try-catch blocks** - let services handle errors and use `@serviceMethod()` decorator
- **Consistent response format**: `next({ code: ResponseCode, data?: any })`

```typescript
@singleton()
@autoInjectable()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  public createProject = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user
    const { name, description, deadline, mediaFiles } = res.locals.input

    const { mediaInfo, code } = await this.projectService.createProject({
      userId: id,
      name,
      description,
      deadline,
      mediaFiles,
    })

    return next({ code, data: { mediaInfo } })
  }
}
```

### **Service Layer**
- Implement business logic in service classes
- **Always use `@serviceMethod()` decorator** on all public methods for consistent error handling
- Return structured responses: `{ code: ResponseCode, data?: any, message?: string }`
- Handle all database operations and external service calls
- **No direct HTTP responses** - services only return data/response codes
- Use repositories for data access patterns
- Use transactions for multi-step operations

```typescript
@singleton()
@autoInjectable()
export class ProjectService implements IProjectService {
  constructor(private readonly userService: UserService) {}

  @serviceMethod()
  async createProject({ userId, name, description, deadline, mediaFiles }: ICreateProject) {
    // Business logic here
    const project = await getPrismaClient().project.create({
      data: { userId, name, description, deadline }
    })

    return { 
      code: ResponseCode.OK, 
      data: { project },
      message: 'Project created successfully'
    }
  }
}
```

### **Validation**
- Use Joi schemas for request validation
- Apply validation via `validate()` middleware in routers
- Validated input is stored in `res.locals.input`
- Provide clear error messages for validation failures

## **Database Conventions**

### **Prisma Schema**
- Use snake_case for database table and column names
- Define proper relationships with foreign keys
- Use appropriate data types for each field
- Add indexes for frequently queried fields
- Use constraints for data integrity

### **Data Access Pattern**
- Services access Prisma directly via `getPrismaClient()` from `@services/prisma`
- Use `@serviceMethod()` decorator for consistent error handling across service methods
- Handle database errors via Prisma error mapping (`isPrismaError`, `mapPrismaErrorToResponseCode`)
- Use `getPrismaClient().$transaction()` for multi-step operations

## **Testing Conventions**

### **Test Structure**
- Use AAA pattern: Arrange, Act, Assert
- Group related tests with `describe` blocks
- Use descriptive test names that explain what is being tested
- Mock external dependencies

### **Test Files**
- Name test files after the files they test using camelCase: `authService.test.ts`, `cache.test.ts`
- Unit tests go in `tests/unit/`, integration tests in `tests/integration/`
- Use separate test directories for integration tests
- Maintain test data in fixtures or factories (`tests/helpers/testFactory.ts`)

## **Documentation Conventions**

### **Comments**
- Use JSDoc for public functions and classes
- Add inline comments for complex logic
- Avoid obvious comments
- Keep comments up to date with code changes

### **API Documentation**
- Use Swagger/OpenAPI for API documentation
- Document all endpoints with examples
- Include error response documentation
- Keep documentation in sync with implementation
