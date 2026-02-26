# Security Agent Guide

## Role
Security & Authentication Specialist

## Scope
This directory (`src/middleware/`) contains security middleware, authentication handlers, authorization logic, and request validation. The Security Agent ensures the application is secure and protected against common vulnerabilities.

## Key Responsibilities in This Directory

### 1. Authentication Middleware
- Implement JWT token validation
- Handle authentication flows
- Manage session security
- Implement token refresh mechanisms

### 2. Authorization Middleware
- Implement role-based access control (RBAC)
- Validate user permissions
- Protect sensitive endpoints
- Handle authorization failures

### 3. Security Middleware
- Input validation and sanitization
- Rate limiting and throttling
- CORS configuration
- Security headers (helmet)
- Request logging and monitoring

### 4. Validation Middleware
- Request body validation
- Query parameter validation
- Path parameter validation
- File upload validation

## Standards for This Directory

### Authentication Middleware Pattern
```typescript
import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { UnauthorizedError } from '@/common/errors';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    
    const decoded = verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid token'));
  }
};

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return null;
}
```

### Authorization Middleware Pattern
```typescript
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@/common/errors';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      
      if (!userRole) {
        throw new ForbiddenError('User role not found');
      }
      
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('Insufficient permissions');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage: authorize('ADMIN', 'MODERATOR')
```

### Validation Middleware Pattern
```typescript
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@/common/errors';

export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      req.body = validated.body;
      req.query = validated.query;
      req.params = validated.params;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};
```

## Common Tasks

### Implementing JWT Authentication

1. **Create authentication middleware**
```typescript
import jwt from 'jsonwebtoken';

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }
    
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = payload;
    
    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};
```

2. **Apply to routes**
```typescript
router.get('/protected', authenticate, controller.getProtected);
```

### Implementing Role-Based Access Control

```typescript
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    
    next();
  };
};

// Usage
router.delete('/users/:id', 
  authenticate, 
  requireRole(['ADMIN']), 
  controller.deleteUser
);
```

### Implementing Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth attempts
  skipSuccessfulRequests: true,
});
```

### Input Sanitization

```typescript
import { sanitize } from 'express-validator';

export const sanitizeInput = [
  sanitize('email').normalizeEmail(),
  sanitize('name').trim().escape(),
  sanitize('*').trim(), // Sanitize all fields
];
```

## Security Best Practices

### 1. Token Security
- Use strong JWT secrets (minimum 256 bits)
- Set appropriate token expiration times
- Implement token refresh mechanisms
- Store tokens securely (httpOnly cookies for web)
- Invalidate tokens on logout

### 2. Password Security
- Hash passwords with bcrypt (minimum 10 rounds)
- Never store plain text passwords
- Implement password strength requirements
- Use password reset tokens with expiration
- Rate limit authentication attempts

### 3. Input Validation
- Validate all user inputs
- Sanitize data before processing
- Use schema validation (Zod, Joi)
- Reject unexpected fields
- Validate file uploads

### 4. CORS Configuration
```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

export const corsMiddleware = cors(corsOptions);
```

### 5. Security Headers
```typescript
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

## Common Vulnerabilities to Prevent

### 1. SQL Injection
- Use Prisma ORM (parameterized queries)
- Never concatenate user input into queries
- Validate and sanitize all inputs

### 2. XSS (Cross-Site Scripting)
- Sanitize user input before storage
- Escape output in responses
- Use Content Security Policy headers
- Validate and sanitize HTML content

### 3. CSRF (Cross-Site Request Forgery)
- Use CSRF tokens for state-changing operations
- Validate origin and referer headers
- Use SameSite cookie attribute

### 4. Authentication Bypass
- Implement proper authentication checks
- Validate tokens on every request
- Use secure session management
- Implement account lockout after failed attempts

### 5. Sensitive Data Exposure
- Never log sensitive data (passwords, tokens)
- Use HTTPS in production
- Encrypt sensitive data at rest
- Implement proper access controls

## Middleware Chain Order

```typescript
import express from 'express';

const app = express();

// 1. Security headers (first)
app.use(helmet());

// 2. CORS
app.use(cors(corsOptions));

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Rate limiting
app.use('/api/', apiLimiter);

// 5. Request logging
app.use(requestLogger);

// 6. Routes (with authentication/authorization)
app.use('/api', routes);

// 7. Error handling (last)
app.use(errorHandler);
```

## Error Handling

### Security Error Responses
```typescript
export class SecurityError extends Error {
  constructor(
    message: string,
    public statusCode: number = 403,
    public code: string = 'SECURITY_ERROR'
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export const securityErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof SecurityError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
    });
  }
  
  next(error);
};
```

### Logging Security Events
```typescript
import { logger } from '@/core/logger';

export const logSecurityEvent = (
  event: string,
  req: Request,
  details?: any
) => {
  logger.warn('Security Event', {
    event,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    ...details,
  });
};
```

## Testing Security Middleware

### Unit Tests
```typescript
describe('authenticate middleware', () => {
  it('should reject requests without token', async () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'No token provided',
      })
    );
  });
  
  it('should accept valid token', async () => {
    const token = generateValidToken();
    const req = mockRequest({
      headers: { authorization: `Bearer ${token}` },
    });
    const res = mockResponse();
    const next = jest.fn();
    
    await authenticate(req, res, next);
    
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
  });
});
```

## Integration Points

### Services (`src/services/`)
- Use authentication service for token generation
- Validate user credentials
- Check user permissions

### Controllers (`src/api/`)
- Apply authentication middleware to protected routes
- Use authorization middleware for role checks
- Validate request data before processing

### Error Handling
- Return appropriate error codes
- Log security events
- Don't expose sensitive information in errors

## Security Checklist

- [ ] All sensitive endpoints require authentication
- [ ] Role-based access control is implemented
- [ ] Input validation is applied to all endpoints
- [ ] Rate limiting is configured
- [ ] Security headers are set (helmet)
- [ ] CORS is properly configured
- [ ] Passwords are hashed with bcrypt
- [ ] JWT tokens have appropriate expiration
- [ ] File uploads are validated and sanitized
- [ ] Error messages don't expose sensitive data
- [ ] Security events are logged
- [ ] HTTPS is enforced in production

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Authentication: `/home/matejmusap/Desktop/template-nodejs/docs/AUTHENTICATION.md`
- Architecture: `/home/matejmusap/Desktop/template-nodejs/docs/ARCHITECTURE.md`
