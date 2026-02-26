# Testing Agent Guide

## Role
Quality Assurance & Testing Specialist

## Scope
This directory (`tests/`) contains all test suites including unit tests, integration tests, and test utilities. The Testing Agent ensures comprehensive test coverage and maintains code quality through rigorous testing practices.

## Key Responsibilities in This Directory

### 1. Unit Testing (`unit/`)
- Test individual functions and methods in isolation
- Mock external dependencies
- Verify edge cases and error handling
- Maintain high code coverage

### 2. Integration Testing (`integration/`)
- Test API endpoints end-to-end
- Verify database operations
- Test authentication and authorization flows
- Validate request/response handling

### 3. Test Infrastructure (`helpers/`, `setup.ts`)
- Maintain test utilities and helpers
- Configure test environment
- Manage test database setup/teardown
- Create reusable test fixtures

## Standards for This Directory

### Test File Structure
```
tests/
├── unit/
│   ├── services/
│   │   └── user.service.test.ts
│   ├── utils/
│   │   └── validation.test.ts
│   └── middleware/
│       └── auth.test.ts
├── integration/
│   ├── auth/
│   │   └── auth.test.ts
│   ├── users/
│   │   └── users.test.ts
│   └── posts/
│       └── posts.test.ts
├── helpers/
│   ├── test-utils.ts
│   └── mock-data.ts
└── setup.ts
```

### Unit Test Pattern
```typescript
import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { NotFoundException } from '@/common/errors';

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    userService = new UserService(mockUserRepository);
  });

  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserRepository.findById.mockResolvedValue(mockUser);

      const result = await userService.findById('123');

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findById).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(userService.findById('123')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
```

### Integration Test Pattern
```typescript
import request from 'supertest';
import { app } from '@/index';
import { prisma } from '@/core/database';
import { generateAuthToken } from '@/tests/helpers/auth-helper';

describe('POST /api/users', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear database before each test
    await prisma.user.deleteMany();
    
    // Create admin user and get token
    authToken = await generateAuthToken({ role: 'ADMIN' });
  });

  it('should create a new user', async () => {
    const userData = {
      email: 'newuser@example.com',
      name: 'New User',
      password: 'SecurePass123!',
    };

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(userData)
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: {
        email: userData.email,
        name: userData.name,
      },
    });
    expect(response.body.data.password).toBeUndefined();
  });

  it('should return 400 for invalid email', async () => {
    const userData = {
      email: 'invalid-email',
      name: 'Test User',
      password: 'SecurePass123!',
    };

    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${authToken}`)
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 401 without authentication', async () => {
    const userData = {
      email: 'test@example.com',
      name: 'Test User',
      password: 'SecurePass123!',
    };

    await request(app)
      .post('/api/users')
      .send(userData)
      .expect(401);
  });
});
```

## Common Tasks

### Writing a Unit Test

1. **Create test file** matching source file structure
2. **Set up test suite** with describe blocks
3. **Mock dependencies** using Jest mocks
4. **Write test cases** covering all scenarios
5. **Run tests** and verify coverage

```typescript
describe('ClassName', () => {
  let instance: ClassName;
  let mockDependency: jest.Mocked<DependencyType>;

  beforeEach(() => {
    // Setup
    mockDependency = createMockDependency();
    instance = new ClassName(mockDependency);
  });

  afterEach(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedValue);

      // Act
      const result = await instance.methodName(input);

      // Assert
      expect(result).toEqual(expectedValue);
      expect(mockDependency.method).toHaveBeenCalledWith(input);
    });

    it('should handle error case', async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error('Test error'));

      // Act & Assert
      await expect(instance.methodName(input)).rejects.toThrow('Test error');
    });
  });
});
```

### Writing an Integration Test

1. **Set up test environment** with database
2. **Create test data** using factories or fixtures
3. **Make HTTP requests** using supertest
4. **Assert responses** and database state
5. **Clean up** after tests

```typescript
describe('API Endpoint', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestData();
  });

  it('should perform operation', async () => {
    const response = await request(app)
      .post('/api/resource')
      .set('Authorization', `Bearer ${token}`)
      .send(testData)
      .expect(201);

    expect(response.body.data).toMatchObject(expectedData);

    // Verify database state
    const dbRecord = await prisma.resource.findUnique({
      where: { id: response.body.data.id },
    });
    expect(dbRecord).toBeDefined();
  });
});
```

### Creating Test Helpers

```typescript
// tests/helpers/test-utils.ts
export const createMockRequest = (overrides = {}): Request => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    user: undefined,
    ...overrides,
  } as Request;
};

export const createMockResponse = (): Response => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res as Response;
};

export const createMockNext = (): NextFunction => {
  return jest.fn();
};
```

### Creating Test Fixtures

```typescript
// tests/helpers/mock-data.ts
export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});

export const mockUsers = [
  createMockUser({ id: '1', email: 'user1@example.com' }),
  createMockUser({ id: '2', email: 'user2@example.com' }),
  createMockUser({ id: '3', email: 'user3@example.com' }),
];
```

## Test Coverage Standards

### Minimum Coverage Requirements
- **Overall**: 80% coverage
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Critical Areas (90%+ coverage)
- Authentication and authorization
- Payment processing
- Data validation
- Security middleware
- Core business logic

### Coverage Configuration
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    './src/services/': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
};
```

## Testing Best Practices

### 1. Test Organization
- One test file per source file
- Group related tests with `describe` blocks
- Use clear, descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up after each test
- Use `beforeEach` and `afterEach` appropriately

### 3. Mocking Strategy
- Mock external dependencies
- Don't mock the system under test
- Use realistic mock data
- Verify mock interactions when relevant

### 4. Assertions
- Make specific assertions
- Test one thing per test
- Use appropriate matchers
- Include error messages in assertions

### 5. Test Data
- Use factories for complex objects
- Keep test data minimal but realistic
- Don't use production data in tests
- Create reusable fixtures

## Common Testing Patterns

### Testing Async Code
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expectedValue);
});

it('should handle async errors', async () => {
  await expect(asyncFunction()).rejects.toThrow(ErrorClass);
});
```

### Testing Promises
```typescript
it('should resolve with value', () => {
  return expect(promiseFunction()).resolves.toBe(value);
});

it('should reject with error', () => {
  return expect(promiseFunction()).rejects.toThrow(Error);
});
```

### Testing Callbacks
```typescript
it('should call callback with result', (done) => {
  functionWithCallback((error, result) => {
    expect(error).toBeNull();
    expect(result).toBe(expectedValue);
    done();
  });
});
```

### Testing Timers
```typescript
jest.useFakeTimers();

it('should execute after timeout', () => {
  const callback = jest.fn();
  
  setTimeout(callback, 1000);
  
  jest.advanceTimersByTime(1000);
  
  expect(callback).toHaveBeenCalled();
});
```

### Testing Database Operations
```typescript
describe('Database operations', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should create user in database', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      name: 'Test User',
    });

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    expect(dbUser).toMatchObject({
      email: 'test@example.com',
      name: 'Test User',
    });
  });
});
```

## Test Environment Setup

### Database Setup
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Run migrations
  await prisma.$executeRaw`CREATE SCHEMA IF NOT EXISTS test`;
  
  // Connect to test database
  await prisma.$connect();
});

afterAll(async () => {
  // Cleanup
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clear all tables
  const tables = await prisma.$queryRaw`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public'
  `;
  
  for (const { tablename } of tables) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE "${tablename}" CASCADE`
    );
  }
});
```

### Environment Variables
```typescript
// tests/setup.ts
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.LOG_LEVEL = 'error';
```

## Running Tests

### Commands
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- user.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create user"

# Run integration tests only
npm test -- integration/

# Run unit tests only
npm test -- unit/
```

### CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging Tests

### Using Console Logs
```typescript
it('should debug test', () => {
  console.log('Debug info:', variable);
  expect(variable).toBe(expected);
});
```

### Using Debugger
```typescript
it('should debug with breakpoint', () => {
  debugger; // Set breakpoint here
  const result = functionToTest();
  expect(result).toBe(expected);
});
```

### Isolating Tests
```typescript
// Run only this test
it.only('should run only this test', () => {
  // Test code
});

// Skip this test
it.skip('should skip this test', () => {
  // Test code
});
```

## Test Maintenance

### Regular Tasks
- [ ] Review and update tests when code changes
- [ ] Remove obsolete tests
- [ ] Refactor duplicated test code
- [ ] Update test data and fixtures
- [ ] Monitor test execution time
- [ ] Fix flaky tests immediately
- [ ] Keep test coverage above threshold

### Code Review Checklist
- [ ] New code has corresponding tests
- [ ] Tests cover happy path and edge cases
- [ ] Tests are independent and isolated
- [ ] Test names are clear and descriptive
- [ ] Mocks are used appropriately
- [ ] Coverage meets minimum requirements

## Integration Points

### Services (`src/services/`)
- Write unit tests for all service methods
- Mock repository dependencies
- Test business logic thoroughly

### Controllers (`src/api/`)
- Write integration tests for all endpoints
- Test authentication and authorization
- Verify request/response handling

### Middleware (`src/middleware/`)
- Write unit tests for middleware functions
- Test error handling
- Verify request modification

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Architecture: `/home/matejmusap/Desktop/template-nodejs/docs/ARCHITECTURE.md`
- Getting Started: `/home/matejmusap/Desktop/template-nodejs/docs/GETTING_STARTED.md`
