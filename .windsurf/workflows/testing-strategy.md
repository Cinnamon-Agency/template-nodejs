---
description: Comprehensive testing strategy and implementation
---

# Testing Strategy & Implementation

## **Testing Pyramid**

### **Unit Tests (70%)**
- Test individual functions and classes
- Fast, isolated, and deterministic
- Mock external dependencies

### **Integration Tests (20%)**
- Test API endpoints with database
- Test service layer interactions
- Test middleware functionality

### **End-to-End Tests (10%)**
- Test complete user workflows
- Test authentication flows
- Test critical business processes

## **Unit Testing Setup**

### **Jest Configuration**
```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### **Unit Test Example**
```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/api/user/service';
import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

describe('UserService', () => {
  let userService: UserService;
  let prismaMock: DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    prismaMock = mockDeep<PrismaClient>();
    userService = new UserService(prismaMock);
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
      };
      
      const expectedUser = {
        id: 'user-id',
        email: userData.email,
        name: userData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.user.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: userData,
      });
    });

    it('should throw error when email already exists', async () => {
      // Arrange
      const userData = {
        email: 'existing@example.com',
        name: 'Test User',
      };

      prismaMock.user.create.mockRejectedValue(
        new Error('Unique constraint failed')
      );

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow();
    });
  });
});
```

## **Integration Testing**

### **Test Database Setup**
```typescript
// tests/setup/database.ts
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Setup test database
  execSync('npx prisma migrate reset --force --skip-seed', {
    env: { ...process.env, DATABASE_URL: process.env.TEST_DATABASE_URL },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test data
  await prisma.user.deleteMany();
});
```

### **API Integration Test**
```typescript
// tests/integration/auth.test.ts
import request from 'supertest';
import { app } from '../../src/app';

describe('Auth API', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          email: userData.email,
          name: userData.name,
        },
      });
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('email'),
      });
    });
  });
});
```

## **Test Utilities**

### **Test Factories**
```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

export const createUser = async (
  prisma: PrismaClient,
  overrides: Partial<any> = {}
) => {
  return prisma.user.create({
    data: {
      email: faker.internet.email(),
      name: faker.name.fullName(),
      ...overrides,
    },
  });
};

export const createUsers = async (
  prisma: PrismaClient,
  count: number,
  overrides: Partial<any> = {}
) => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createUser(prisma, overrides));
  }
  return users;
};
```

### **Test Helpers**
```typescript
// tests/helpers/auth.helper.ts
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../../src/core/config/jwt';

export const createTestToken = (payload: any) => {
  return jwt.sign(payload, process.env.JWT_SECRET!, jwtConfig);
};

export const createTestHeaders = (token?: string) => {
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
```

## **Performance Testing**

### **Load Testing with Artillery**
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50

scenarios:
  - name: "User Registration"
    weight: 40
    flow:
      - post:
          url: "/api/auth/register"
          json:
            email: "test-{{ $randomUUID() }}@example.com"
            password: "Password123!"
            name: "Test User"
  
  - name: "User Login"
    weight: 60
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@example.com"
            password: "Password123!"
```

## **Testing Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test auth.test.ts

# Run integration tests only
npm test -- --testPathPattern=integration

# Run performance tests
artillery run artillery-config.yml

# Generate test coverage report
npm test -- --coverage --coverageReporters=html
```

## **Test Data Management**

### **Seed Data for Tests**
```typescript
// tests/seed/test.seed.ts
import { PrismaClient } from '@prisma/client';
import { createUser } from '../factories/user.factory';

const prisma = new PrismaClient();

export const seedTestData = async () => {
  // Create test users
  const adminUser = await createUser(prisma, {
    email: 'admin@test.com',
    role: 'ADMIN',
  });

  const regularUser = await createUser(prisma, {
    email: 'user@test.com',
    role: 'USER',
  });

  return { adminUser, regularUser };
};
```

### **Test Cleanup**
```typescript
// tests/helpers/cleanup.helper.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const cleanupTestData = async () => {
  // Clean up in order of dependencies
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditLog.deleteMany();
};
```

## **Quality Gates**

### **Pre-commit Hooks**
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm test -- --changedSince HEAD"
    }
  },
  "lint-staged": {
    "*.ts": ["npm run lint:fix", "npm run format"]
  }
}
```

### **CI/CD Pipeline**
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - run: npm ci
      - run: npm test -- --coverage
      - run: npm run lint
      - run: npm run build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

## **Testing Best Practices**

### **Test Organization**
- Group related tests in describe blocks
- Use descriptive test names
- Follow Arrange-Act-Assert pattern
- Keep tests simple and focused

### **Mock Strategy**
- Mock external dependencies
- Use consistent mock data
- Avoid mocking what you're testing
- Reset mocks between tests

### **Test Coverage**
- Aim for 80%+ coverage
- Focus on critical business logic
- Test error paths and edge cases
- Regular coverage reviews

### **Performance Testing**
- Test under realistic load
- Monitor response times
- Test database performance
- Identify bottlenecks early
