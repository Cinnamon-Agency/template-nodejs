import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export interface TestUser {
  id: string;
  email: string;
  phoneNumber?: string;
  password: string;
  authType: string;
}

export class TestFactory {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async createUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const defaultUser = {
      email: 'test@example.com',
      password: 'password123',
      authType: 'USER_PASSWORD'
    };

    const userToCreate = { ...defaultUser, ...userData };
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userToCreate.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: userToCreate.email,
        password: hashedPassword,
        authType: userToCreate.authType as any,
        phoneNumber: userToCreate.phoneNumber || null
      }
    });

    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber || undefined,
      password: userToCreate.password, // Return original password for testing
      authType: user.authType
    } as TestUser;
  }

  async createMultipleUsers(count: number, userData: Partial<TestUser> = {}): Promise<TestUser[]> {
    const users: TestUser[] = [];
    
    for (let i = 0; i < count; i++) {
      const user = await this.createUser({
        ...userData,
        email: userData.email ? `${userData.email}${i}@example.com` : `user${i}@example.com`
      });
      users.push(user);
    }

    return users;
  }

  async cleanupDatabase(): Promise<void> {
    // Clean up in correct order to respect foreign key constraints
    // Adjust based on your actual schema
    const tablenames = await this.prisma.$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    for (const { tablename } of tablenames as { tablename: string }[]) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log({ error });
        }
      }
    }
  }

  async createAuthToken(userId: string): Promise<string> {
    // This would use your JWT service to create a token
    // For now, return a mock token
    return `mock-token-${userId}`;
  }
}
