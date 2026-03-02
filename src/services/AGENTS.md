# Authentication Agent Guide

## Role
Authentication & User Management Specialist

## Scope
This directory (`src/services/`) contains business logic services, including authentication services. The Authentication Agent is responsible for implementing secure authentication flows, user management, and session handling.

## Key Responsibilities in This Directory

### 1. Authentication Services
- Implement multi-provider OAuth integration (Google, Apple)
- Handle JWT token generation and validation
- Manage password hashing and verification
- Implement token refresh mechanisms
- Handle user login and logout flows

### 2. User Management Services
- User registration and verification
- Password reset workflows
- Email verification processes
- User profile management
- Account activation/deactivation

### 3. Session Management
- Token lifecycle management
- Session expiration and renewal
- Refresh token rotation
- Logout and token invalidation
- Multi-device session handling

### 4. Role & Permission Management
- User role assignment
- Permission verification
- Access control logic
- Role-based feature access

## Standards for This Directory

### Authentication Service Pattern
```typescript
import { injectable, inject } from 'tsyringe';
import { hash, compare } from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import { UserRepository } from '@/repositories/user.repository';
import { UnauthorizedError } from '@/common/errors';

@injectable()
export class AuthService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository
  ) {}

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await compare(password, user.password);
    
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.userRepository.updateRefreshToken(user.id, refreshToken);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async register(data: RegisterDto) {
    const existingUser = await this.userRepository.findByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const hashedPassword = await hash(data.password, 10);

    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
    });

    const verificationToken = this.generateVerificationToken(user);
    await this.sendVerificationEmail(user.email, verificationToken);

    return {
      user: this.sanitizeUser(user),
      message: 'Verification email sent',
    };
  }

  private generateAccessToken(user: any): string {
    return sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(user: any): string {
    return sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  private sanitizeUser(user: any) {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }
}
```

### OAuth Service Pattern
```typescript
@injectable()
export class OAuthService {
  constructor(
    @inject('UserRepository') private userRepository: UserRepository,
    @inject('AuthService') private authService: AuthService
  ) {}

  async googleAuth(code: string) {
    // Exchange code for tokens
    const googleTokens = await this.getGoogleTokens(code);
    
    // Get user info from Google
    const googleUser = await this.getGoogleUser(googleTokens.access_token);
    
    // Find or create user
    let user = await this.userRepository.findByEmail(googleUser.email);
    
    if (!user) {
      user = await this.userRepository.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        emailVerified: true,
        provider: 'GOOGLE',
        providerId: googleUser.id,
      });
    }

    // Generate tokens
    const accessToken = this.authService.generateAccessToken(user);
    const refreshToken = this.authService.generateRefreshToken(user);

    return {
      user: this.authService.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async getGoogleTokens(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    return response.json();
  }

  private async getGoogleUser(accessToken: string) {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return response.json();
  }
}
```

## Common Tasks

### Implementing User Registration

```typescript
async register(data: RegisterDto) {
  // 1. Validate input
  await this.validateRegistrationData(data);

  // 2. Check if user exists
  const existingUser = await this.userRepository.findByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('Email already registered');
  }

  // 3. Hash password
  const hashedPassword = await hash(data.password, 10);

  // 4. Create user
  const user = await this.userRepository.create({
    email: data.email,
    name: data.name,
    password: hashedPassword,
    role: 'USER',
  });

  // 5. Generate verification token
  const verificationToken = this.generateVerificationToken(user);

  // 6. Send verification email
  await this.emailService.sendVerificationEmail(
    user.email,
    verificationToken
  );

  return {
    user: this.sanitizeUser(user),
    message: 'Please check your email to verify your account',
  };
}
```

### Implementing Password Reset

```typescript
async requestPasswordReset(email: string) {
  const user = await this.userRepository.findByEmail(email);
  
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If email exists, reset link has been sent' };
  }

  // Generate reset token
  const resetToken = this.generateResetToken();
  const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

  // Save token to database
  await this.userRepository.update(user.id, {
    resetToken,
    resetTokenExpiry,
  });

  // Send reset email
  await this.emailService.sendPasswordResetEmail(user.email, resetToken);

  return { message: 'If email exists, reset link has been sent' };
}

async resetPassword(token: string, newPassword: string) {
  const user = await this.userRepository.findByResetToken(token);

  if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  // Hash new password
  const hashedPassword = await hash(newPassword, 10);

  // Update password and clear reset token
  await this.userRepository.update(user.id, {
    password: hashedPassword,
    resetToken: null,
    resetTokenExpiry: null,
  });

  return { message: 'Password reset successful' };
}
```

### Implementing Token Refresh

```typescript
async refreshToken(refreshToken: string) {
  try {
    // Verify refresh token
    const payload = verify(refreshToken, process.env.JWT_REFRESH_SECRET!);

    // Get user
    const user = await this.userRepository.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    // Update refresh token in database
    await this.userRepository.updateRefreshToken(user.id, newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  } catch (error) {
    throw new UnauthorizedError('Invalid refresh token');
  }
}
```

### Implementing Email Verification

```typescript
async verifyEmail(token: string) {
  try {
    const payload = verify(token, process.env.JWT_SECRET!);

    const user = await this.userRepository.findById(payload.id);

    if (!user) {
      throw new BadRequestError('Invalid verification token');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
    });

    return { message: 'Email verified successfully' };
  } catch (error) {
    throw new BadRequestError('Invalid or expired verification token');
  }
}

private generateVerificationToken(user: any): string {
  return sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}
```

## Security Best Practices

### 1. Password Security
```typescript
// Use bcrypt with appropriate rounds (10-12)
const SALT_ROUNDS = 10;
const hashedPassword = await hash(password, SALT_ROUNDS);

// Verify password
const isValid = await compare(plainPassword, hashedPassword);
```

### 2. Token Security
```typescript
// Use strong secrets (minimum 256 bits)
const JWT_SECRET = process.env.JWT_SECRET; // At least 32 characters

// Set appropriate expiration times
const accessTokenExpiry = '15m';  // Short-lived
const refreshTokenExpiry = '7d';  // Longer-lived

// Include necessary claims only
const payload = {
  id: user.id,
  email: user.email,
  role: user.role,
  // Don't include sensitive data
};
```

### 3. Rate Limiting
```typescript
// Limit login attempts
private loginAttempts = new Map<string, number>();

async login(email: string, password: string) {
  const attempts = this.loginAttempts.get(email) || 0;
  
  if (attempts >= 5) {
    throw new TooManyRequestsError('Too many login attempts');
  }

  try {
    const result = await this.performLogin(email, password);
    this.loginAttempts.delete(email);
    return result;
  } catch (error) {
    this.loginAttempts.set(email, attempts + 1);
    throw error;
  }
}
```

### 4. Secure Token Storage
```typescript
// Store refresh tokens securely in database
await this.userRepository.update(user.id, {
  refreshToken: await hash(refreshToken, 10), // Hash before storing
});

// Verify refresh token
const isValid = await compare(providedToken, user.refreshToken);
```

## OAuth Provider Integration

### Google OAuth
```typescript
async googleAuth(code: string) {
  const tokens = await this.getGoogleTokens(code);
  const googleUser = await this.getGoogleUser(tokens.access_token);
  
  return this.handleOAuthUser({
    email: googleUser.email,
    name: googleUser.name,
    avatar: googleUser.picture,
    provider: 'GOOGLE',
    providerId: googleUser.id,
  });
}
```

### Apple OAuth
```typescript
async appleAuth(code: string, idToken: string) {
  const appleUser = await this.verifyAppleToken(idToken);
  
  return this.handleOAuthUser({
    email: appleUser.email,
    name: appleUser.name,
    provider: 'APPLE',
    providerId: appleUser.sub,
  });
}
```

### Common OAuth Handler
```typescript
private async handleOAuthUser(oauthData: OAuthUserData) {
  let user = await this.userRepository.findByEmail(oauthData.email);
  
  if (!user) {
    user = await this.userRepository.create({
      ...oauthData,
      emailVerified: true,
    });
  } else if (user.provider !== oauthData.provider) {
    // Link OAuth account to existing user
    await this.userRepository.update(user.id, {
      provider: oauthData.provider,
      providerId: oauthData.providerId,
    });
  }

  const accessToken = this.generateAccessToken(user);
  const refreshToken = this.generateRefreshToken(user);

  await this.userRepository.updateRefreshToken(user.id, refreshToken);

  return {
    user: this.sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}
```

## Role & Permission Management

### Assigning Roles
```typescript
async assignRole(userId: string, role: string) {
  const validRoles = ['USER', 'ADMIN', 'MODERATOR'];
  
  if (!validRoles.includes(role)) {
    throw new BadRequestError('Invalid role');
  }

  await this.userRepository.update(userId, { role });

  return { message: 'Role assigned successfully' };
}
```

### Checking Permissions
```typescript
async hasPermission(userId: string, permission: string): Promise<boolean> {
  const user = await this.userRepository.findById(userId);
  
  if (!user) {
    return false;
  }

  const rolePermissions = {
    ADMIN: ['*'],
    MODERATOR: ['read', 'write', 'moderate'],
    USER: ['read', 'write'],
  };

  const permissions = rolePermissions[user.role] || [];
  
  return permissions.includes('*') || permissions.includes(permission);
}
```

## Error Handling

### Authentication Errors
```typescript
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

// Usage
if (!user) {
  throw new AuthenticationError('Invalid credentials');
}
```

### Consistent Error Messages
```typescript
// Don't reveal if email exists
async requestPasswordReset(email: string) {
  const user = await this.userRepository.findByEmail(email);
  
  // Same message regardless of whether user exists
  const message = 'If email exists, reset link has been sent';
  
  if (user) {
    await this.sendResetEmail(user);
  }
  
  return { message };
}
```

## Testing Authentication Services

### Unit Tests
```typescript
describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    authService = new AuthService(mockUserRepository);
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const user = createMockUser();
      mockUserRepository.findByEmail.mockResolvedValue(user);

      const result = await authService.login('test@example.com', 'password');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.password).toBeUndefined();
    });

    it('should throw error for invalid credentials', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login('test@example.com', 'wrong')
      ).rejects.toThrow(UnauthorizedError);
    });
  });
});
```

## Integration Points

### Repositories (`src/repositories/`)
- Use UserRepository for database operations
- Don't include business logic in repositories
- Handle database errors appropriately

### Email Service
- Send verification emails
- Send password reset emails
- Send welcome emails
- Handle email failures gracefully

### Middleware (`src/middleware/`)
- Authentication middleware uses this service
- Authorization middleware checks roles/permissions
- Token validation happens in middleware

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- Authentication: `/home/matejmusap/Desktop/template-nodejs/docs/AUTHENTICATION.md`
- Services: `/home/matejmusap/Desktop/template-nodejs/docs/SERVICES.md`
- Security Agent: `/home/matejmusap/Desktop/template-nodejs/src/middleware/SECURITY_AGENT.md`
