import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

export interface TestUser {
  id: string;
  email: string;
  phoneNumber?: string;
  password: string;
  authType: string;
}

export interface TestProject {
  id: string;
  name: string;
  description: string;
  deadline: Date;
  userId: string;
  projectStatus: string;
}

export interface TestMedia {
  id: string;
  mediaFileName: string;
  mediaType: string;
  projectId: string;
}

export interface TestNotification {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  read: boolean;
  notificationType: string;
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

  async createProject(userId: string, projectData: Partial<TestProject> = {}): Promise<TestProject> {
    const defaultProject = {
      name: 'Test Project',
      description: 'A test project',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      projectStatus: 'ACTIVE'
    };

    const projectToCreate = { ...defaultProject, ...projectData, userId };

    const project = await this.prisma.project.create({
      data: {
        name: projectToCreate.name,
        description: projectToCreate.description,
        deadline: projectToCreate.deadline,
        projectStatus: projectToCreate.projectStatus as any,
        userId: projectToCreate.userId
      }
    });

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      deadline: project.deadline,
      userId: project.userId,
      projectStatus: project.projectStatus
    } as TestProject;
  }

  async createMedia(projectId: string, mediaData: Partial<TestMedia> = {}): Promise<TestMedia> {
    const defaultMedia = {
      mediaFileName: 'test-file.jpg',
      mediaType: 'IMAGE'
    };

    const mediaToCreate = { ...defaultMedia, ...mediaData, projectId };

    const media = await this.prisma.media.create({
      data: {
        mediaFileName: mediaToCreate.mediaFileName,
        mediaType: mediaToCreate.mediaType as any,
        projectId: mediaToCreate.projectId
      }
    });

    return {
      id: media.id,
      mediaFileName: media.mediaFileName,
      mediaType: media.mediaType,
      projectId: media.projectId
    } as TestMedia;
  }

  async createNotification(senderId: string, receiverId: string, notificationData: Partial<TestNotification> = {}): Promise<TestNotification> {
    const defaultNotification = {
      message: 'Test notification',
      read: false,
      notificationType: 'EXAMPLE_NOTIFICATION'
    };

    const notificationToCreate = { ...defaultNotification, ...notificationData, senderId, receiverId };

    const notification = await this.prisma.notification.create({
      data: {
        senderId: notificationToCreate.senderId,
        receiverId: notificationToCreate.receiverId,
        message: notificationToCreate.message,
        read: notificationToCreate.read,
        notificationType: notificationToCreate.notificationType as any
      }
    });

    return {
      id: notification.id,
      senderId: notification.senderId,
      receiverId: notification.receiverId,
      message: notification.message,
      read: notification.read,
      notificationType: notification.notificationType
    } as TestNotification;
  }

  async createSupportRequest(supportData: Partial<any> = {}): Promise<any> {
    const defaultSupport = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'support@example.com',
      subject: 'Test Support Request',
      message: 'This is a test support request message',
      status: 'OPEN' as const
    };

    const supportToCreate = { ...defaultSupport, ...supportData };

    const supportRequest = await this.prisma.supportRequest.create({
      data: supportToCreate
    });

    return supportRequest;
  }
}
