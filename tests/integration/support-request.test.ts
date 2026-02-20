import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('Support Request Integration Tests', () => {
  let app: express.Express
  let testFactory: TestFactory
  let prisma: PrismaClient

  beforeAll(async () => {
    const appInstance = new App()
    appInstance.initializeApp()
    app = appInstance.getApp()
    
    prisma = new PrismaClient()
    testFactory = new TestFactory(prisma)
  })

  beforeEach(async () => {
    await testFactory.cleanupDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Support Request Creation and Management', () => {
    it('should create support request with valid data', async () => {
      const supportData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        subject: 'Login Issue',
        message: 'I am having trouble logging into my account. The password reset link is not working.'
      }

      // Note: Adjust the endpoint based on your actual support request API
      // This test assumes there's a POST /api/v1/support endpoint
      // If the endpoint doesn't exist, this test documents the expected behavior
      
      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.id).toBeDefined()
      expect(supportRequest.firstName).toBe(supportData.firstName)
      expect(supportRequest.lastName).toBe(supportData.lastName)
      expect(supportRequest.email).toBe(supportData.email)
      expect(supportRequest.subject).toBe(supportData.subject)
      expect(supportRequest.message).toBe(supportData.message)
      expect(supportRequest.status).toBe('OPEN')
    })

    it('should handle support request with different statuses', async () => {
      const supportData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        subject: 'Account Question',
        message: 'How do I update my profile information?',
        status: 'IN_PROGRESS' as const
      }

      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.status).toBe('IN_PROGRESS')
    })

    it('should handle support request with resolved status', async () => {
      const supportData = {
        firstName: 'Bob',
        lastName: 'Wilson',
        email: 'bob.wilson@example.com',
        subject: 'Billing Inquiry',
        message: 'I have a question about my recent invoice.',
        status: 'RESOLVED' as const
      }

      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.status).toBe('RESOLVED')
    })

    it('should handle support request with closed status', async () => {
      const supportData = {
        firstName: 'Alice',
        lastName: 'Brown',
        email: 'alice.brown@example.com',
        subject: 'Feature Request',
        message: 'I would like to request a new feature for the dashboard.',
        status: 'CLOSED' as const
      }

      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.status).toBe('CLOSED')
    })
  })

  describe('Support Request Validation', () => {
    it('should handle support request with minimal data', async () => {
      const minimalData = {
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        subject: 'Test',
        message: 'Test message'
      }

      const supportRequest = await testFactory.createSupportRequest(minimalData)

      expect(supportRequest.firstName).toBe('Test')
      expect(supportRequest.lastName).toBe('User')
      expect(supportRequest.email).toBe('test@example.com')
      expect(supportRequest.subject).toBe('Test')
      expect(supportRequest.message).toBe('Test message')
      expect(supportRequest.status).toBe('OPEN') // Default status
    })

    it('should handle support request with long message', async () => {
      const longMessage = 'This is a very long message that contains multiple sentences. '.repeat(20)
      
      const supportData = {
        firstName: 'Long',
        lastName: 'Message',
        email: 'long@example.com',
        subject: 'Long Message Test',
        message: longMessage.trim()
      }

      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.message).toBe(longMessage.trim())
      expect(supportRequest.message.length).toBeGreaterThan(500)
    })

    it('should handle support request with special characters', async () => {
      const supportData = {
        firstName: 'José',
        lastName: 'O\'Connor',
        email: 'jose.oconnor@example.com',
        subject: 'Special Characters: @#$%^&*()',
        message: 'This message contains special chars: àáâãäåæçèéêë ñòóôõö ùúûüý ÿ'
      }

      const supportRequest = await testFactory.createSupportRequest(supportData)

      expect(supportRequest.firstName).toBe('José')
      expect(supportRequest.lastName).toBe('O\'Connor')
      expect(supportRequest.subject).toContain('@#$%^&*()')
      expect(supportRequest.message).toContain('àáâãäåæçèéêë')
    })
  })

  describe('Support Request Status Transitions', () => {
    it('should handle status transition from OPEN to IN_PROGRESS', async () => {
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Status',
        lastName: 'Test',
        email: 'status@example.com',
        subject: 'Status Transition',
        message: 'Testing status transitions'
      })

      expect(supportRequest.status).toBe('OPEN')

      // Update status to IN_PROGRESS
      const updatedRequest = await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updatedRequest.status).toBe('IN_PROGRESS')
    })

    it('should handle status transition from IN_PROGRESS to RESOLVED', async () => {
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Progress',
        lastName: 'Test',
        email: 'progress@example.com',
        subject: 'Progress to Resolved',
        message: 'Testing progress to resolved transition',
        status: 'IN_PROGRESS' as const
      })

      expect(supportRequest.status).toBe('IN_PROGRESS')

      // Update status to RESOLVED
      const updatedRequest = await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'RESOLVED' }
      })

      expect(updatedRequest.status).toBe('RESOLVED')
    })

    it('should handle status transition from RESOLVED to CLOSED', async () => {
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Resolve',
        lastName: 'Test',
        email: 'resolve@example.com',
        subject: 'Resolve to Closed',
        message: 'Testing resolved to closed transition',
        status: 'RESOLVED' as const
      })

      expect(supportRequest.status).toBe('RESOLVED')

      // Update status to CLOSED
      const updatedRequest = await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'CLOSED' }
      })

      expect(updatedRequest.status).toBe('CLOSED')
    })

    it('should handle multiple status updates', async () => {
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Multi',
        lastName: 'Status',
        email: 'multi@example.com',
        subject: 'Multiple Status Updates',
        message: 'Testing multiple status changes'
      })

      // OPEN -> IN_PROGRESS
      await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'IN_PROGRESS' }
      })

      // IN_PROGRESS -> RESOLVED
      await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'RESOLVED' }
      })

      // RESOLVED -> CLOSED
      const finalRequest = await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'CLOSED' }
      })

      expect(finalRequest.status).toBe('CLOSED')
    })
  })

  describe('Support Request Queries and Filtering', () => {
    beforeEach(async () => {
      // Create support requests with different statuses
      await testFactory.createSupportRequest({
        firstName: 'Open',
        lastName: 'Request',
        email: 'open@example.com',
        subject: 'Open Request',
        message: 'This is an open request',
        status: 'OPEN' as const
      })

      await testFactory.createSupportRequest({
        firstName: 'Progress',
        lastName: 'Request',
        email: 'progress@example.com',
        subject: 'In Progress Request',
        message: 'This is an in progress request',
        status: 'IN_PROGRESS' as const
      })

      await testFactory.createSupportRequest({
        firstName: 'Resolved',
        lastName: 'Request',
        email: 'resolved@example.com',
        subject: 'Resolved Request',
        message: 'This is a resolved request',
        status: 'RESOLVED' as const
      })

      await testFactory.createSupportRequest({
        firstName: 'Closed',
        lastName: 'Request',
        email: 'closed@example.com',
        subject: 'Closed Request',
        message: 'This is a closed request',
        status: 'CLOSED' as const
      })
    })

    it('should filter support requests by status', async () => {
      const openRequests = await prisma.supportRequest.findMany({
        where: { status: 'OPEN' }
      })
      expect(openRequests).toHaveLength(1)
      expect(openRequests[0].subject).toBe('Open Request')

      const inProgressRequests = await prisma.supportRequest.findMany({
        where: { status: 'IN_PROGRESS' }
      })
      expect(inProgressRequests).toHaveLength(1)
      expect(inProgressRequests[0].subject).toBe('In Progress Request')

      const resolvedRequests = await prisma.supportRequest.findMany({
        where: { status: 'RESOLVED' }
      })
      expect(resolvedRequests).toHaveLength(1)
      expect(resolvedRequests[0].subject).toBe('Resolved Request')

      const closedRequests = await prisma.supportRequest.findMany({
        where: { status: 'CLOSED' }
      })
      expect(closedRequests).toHaveLength(1)
      expect(closedRequests[0].subject).toBe('Closed Request')
    })

    it('should filter support requests by email', async () => {
      const emailRequests = await prisma.supportRequest.findMany({
        where: { email: 'open@example.com' }
      })
      expect(emailRequests).toHaveLength(1)
      expect(emailRequests[0].firstName).toBe('Open')
    })

    it('should handle ordering support requests by creation date', async () => {
      const allRequests = await prisma.supportRequest.findMany({
        orderBy: { createdAt: 'asc' }
      })
      expect(allRequests).toHaveLength(4)

      // Verify chronological order
      for (let i = 1; i < allRequests.length; i++) {
        expect(allRequests[i].createdAt.getTime()).toBeGreaterThanOrEqual(
          allRequests[i - 1].createdAt.getTime()
        )
      }
    })

    it('should handle ordering support requests by update date', async () => {
      // Update one request to change its updatedAt timestamp
      const requestToUpdate = await prisma.supportRequest.findFirst({
        where: { email: 'open@example.com' }
      })
      
      if (requestToUpdate) {
        await prisma.supportRequest.update({
          where: { id: requestToUpdate.id },
          data: { status: 'IN_PROGRESS' }
        })
      }

      const allRequests = await prisma.supportRequest.findMany({
        orderBy: { updatedAt: 'desc' }
      })
      expect(allRequests).toHaveLength(4)

      // The updated request should be first
      expect(allRequests[0].email).toBe('open@example.com')
    })
  })

  describe('Support Request Data Integrity', () => {
    it('should handle support request with same email but different subjects', async () => {
      const email = 'duplicate@example.com'
      
      const request1 = await testFactory.createSupportRequest({
        firstName: 'First',
        lastName: 'User',
        email,
        subject: 'First Subject',
        message: 'First message'
      })

      const request2 = await testFactory.createSupportRequest({
        firstName: 'Second',
        lastName: 'User',
        email,
        subject: 'Second Subject',
        message: 'Second message'
      })

      expect(request1.id).not.toBe(request2.id)
      expect(request1.email).toBe(request2.email)
      expect(request1.subject).not.toBe(request2.subject)

      const userRequests = await prisma.supportRequest.findMany({
        where: { email }
      })
      expect(userRequests).toHaveLength(2)
    })

    it('should handle support request timestamps', async () => {
      const beforeCreation = new Date()
      
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Timestamp',
        lastName: 'Test',
        email: 'timestamp@example.com',
        subject: 'Timestamp Test',
        message: 'Testing timestamp accuracy'
      })

      const afterCreation = new Date()

      expect(supportRequest.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(supportRequest.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
      expect(supportRequest.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(supportRequest.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should handle support request update timestamps', async () => {
      const supportRequest = await testFactory.createSupportRequest({
        firstName: 'Update',
        lastName: 'Timestamp',
        email: 'update@example.com',
        subject: 'Update Test',
        message: 'Testing update timestamp'
      })

      const originalUpdatedAt = supportRequest.updatedAt

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // Update the request
      const updatedRequest = await prisma.supportRequest.update({
        where: { id: supportRequest.id },
        data: { status: 'IN_PROGRESS' }
      })

      expect(updatedRequest.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime())
      expect(updatedRequest.status).toBe('IN_PROGRESS')
    })
  })
})
