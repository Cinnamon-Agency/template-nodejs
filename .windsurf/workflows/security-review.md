---
description: Security review and vulnerability assessment
---

# Security Review Workflow

## **Security Checklist**

### **Authentication & Authorization**
- [ ] JWT tokens have proper expiration (15-30 minutes access, 7-30 days refresh)
- [ ] Password hashing uses bcrypt with proper salt rounds (10-12)
- [ ] Role-based access control implemented correctly
- [ ] Public endpoints properly identified and unprotected
- [ ] Protected endpoints have authentication middleware

### **Input Validation**
- [ ] All user inputs validated with Joi schemas
- [ ] SQL injection prevention (Prisma handles this automatically)
- [ ] XSS prevention implemented
- [ ] File upload validation (type, size, content)
- [ ] API rate limiting configured

### **Data Protection**
- [ ] Sensitive data encrypted at rest
- [ ] HTTPS enforced for all communications
- [ ] Environment variables properly secured
- [ ] No hardcoded secrets in code
- [ ] Database connection uses SSL

### **API Security**
- [ ] CORS configured properly
- [ ] Security headers implemented (Helmet.js)
- [ ] API versioning implemented
- [ ] Error messages don't leak sensitive information
- [ ] Proper HTTP status codes used

## **Security Review Steps**

### **1. Code Review**
```typescript
// Check for security anti-patterns
// ❌ Bad: Hardcoded secrets
const apiKey = "hardcoded-key";

// ✅ Good: Environment variables
const apiKey = process.env.API_KEY;

// ❌ Bad: Direct string concatenation for SQL
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good: Parameterized queries (Prisma)
const user = await prisma.user.findUnique({ where: { id: userId } });
```

### **2. Dependency Security**
```bash
# Check for vulnerable dependencies
npm audit

# Update vulnerable packages
npm audit fix
```

### **3. Authentication Testing**
```bash
# Test authentication flows
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test protected endpoints
curl -X GET http://localhost:3000/api/protected \
  -H "Authorization: Bearer <token>"
```

### **4. Input Validation Testing**
```bash
# Test malicious inputs
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","name":"admin"}'
```

## **Security Implementation Examples**

### **JWT Configuration**
```typescript
// src/core/config/jwt.ts
export const jwtConfig = {
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
  algorithm: 'HS256',
};
```

### **Security Middleware**
```typescript
// src/core/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  helmet(),
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests
  }),
];
```

### **Input Validation**
```typescript
// src/common/validation/schemas.ts
export const userRegistrationSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required(),
  name: Joi.string().min(2).max(50).required(),
});
```

## **Security Monitoring**

### **Logging Security Events**
```typescript
// src/core/logger/security.ts
export const logSecurityEvent = (event: string, details: any) => {
  logger.warn(`Security Event: ${event}`, {
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent,
    userId: details.userId,
  });
};
```

### **Failed Login Tracking**
```typescript
// Track failed login attempts
const failedAttempts = new Map<string, number>();

export const trackFailedLogin = (email: string, ip: string) => {
  const key = `${email}:${ip}`;
  const attempts = failedAttempts.get(key) || 0;
  failedAttempts.set(key, attempts + 1);
  
  if (attempts >= 5) {
    logSecurityEvent('Multiple failed logins', { email, ip, attempts });
  }
};
```

## **Security Tools & Commands**

```bash
# Security audit
npm audit

# Check for secrets in code
git secrets --scan

# SSL/TLS configuration test
npx ssl-checker

# OWASP ZAP for API testing
# Run ZAP baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000
```

## **Security Best Practices**

### **Password Requirements**
- Minimum 8 characters
- Mix of uppercase, lowercase, numbers, and special characters
- No common passwords
- Password strength meter

### **Session Management**
- Secure HTTP-only cookies
- Proper session expiration
- Session invalidation on logout
- Refresh token rotation

### **API Security**
- API key management
- Request signing for sensitive operations
- IP whitelisting for admin endpoints
- Request size limits

### **Data Protection**
- Encrypt sensitive fields in database
- Secure file storage with proper permissions
- Regular security backups
- Data retention policies

## **Security Review Report Template**

### **Executive Summary**
- Overall security posture
- Critical findings
- Recommended actions

### **Technical Findings**
- Vulnerability details
- Risk assessment (Critical/High/Medium/Low)
- Proof of concept
- Remediation steps

### **Compliance**
- GDPR compliance
- Data protection regulations
- Industry standards adherence

### **Next Steps**
- Immediate actions required
- Long-term security improvements
- Regular review schedule
