# Coding Conventions

## **Naming Conventions**

### **Files and Directories**
- Use kebab-case for file names: `user-service.ts`, `auth-middleware.ts`
- Use kebab-case for directory names: `user-management/`, `auth-system/`
- Test files should end with `.test.ts` or `.spec.ts`
- Interface files should end with `.interface.ts`
- Type definition files should end with `.types.ts`

### **Variables and Functions**
- Use camelCase for variables and functions: `userName`, `getUserById()`
- Use descriptive names that clearly indicate purpose
- Avoid abbreviations unless widely understood
- Use boolean prefixes for boolean variables: `isActive`, `hasPermission`
- Use action verbs for function names: `createUser()`, `validateInput()`

### **Classes and Interfaces**
- Use PascalCase for classes and interfaces: `UserService`, `IUserRepository`
- Prefix interfaces with `I`: `IUserRepository`, `IAuthService`
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
import path from 'path';

// External libraries
import { PrismaClient } from '@prisma/client';
import Joi from 'joi';

// Internal modules
import { UserService } from '@/services/user.service';
import { IUserRepository } from '@/interfaces/user.repository.interface';

// Relative imports
import { validateEmail } from './utils/validation';
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
- Use dependency injection for services
- Implement proper request/response typing
- Use middleware for common functionality
- Keep controllers thin, delegate business logic to services

```typescript
export class UserController {
  constructor(
    @inject(UserService) private userService: UserService,
    @inject(Logger) private logger: Logger
  ) {}

  @validateRequest(createUserSchema)
  @authMiddleware
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.userService.createUser(req.body);
      res.status(201).json({ success: true, data: user });
    } catch (error) {
      this.logger.error('Failed to create user', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}
```

### **Service Layer**
- Implement business logic in service classes
- Use repositories for data access
- Implement proper error handling
- Use transactions for multi-step operations

### **Validation**
- Use Joi schemas for request validation
- Implement custom validation decorators
- Validate inputs at the entry point
- Provide clear error messages for validation failures

## **Database Conventions**

### **Prisma Schema**
- Use snake_case for database table and column names
- Define proper relationships with foreign keys
- Use appropriate data types for each field
- Add indexes for frequently queried fields
- Use constraints for data integrity

### **Repository Pattern**
- Implement repository classes for data access
- Use interfaces for repository contracts
- Handle database errors appropriately
- Use transactions for complex operations

## **Testing Conventions**

### **Test Structure**
- Use AAA pattern: Arrange, Act, Assert
- Group related tests with `describe` blocks
- Use descriptive test names that explain what is being tested
- Mock external dependencies

### **Test Files**
- Name test files after the files they test: `user.service.test.ts`
- Keep tests close to the source files
- Use separate test directories for integration tests
- Maintain test data in fixtures or factories

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
