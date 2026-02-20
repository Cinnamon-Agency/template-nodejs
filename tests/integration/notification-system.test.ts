import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('Notification System Integration Tests', () => {
  let app: express.Express
  let testFactory: TestFactory
  let prisma: PrismaClient
  let authToken: string
  let testUser: any
  let otherUser: any

  beforeAll(async () => {
    const appInstance = new App()
    appInstance.initializeApp()
    app = appInstance.getApp()
    
    prisma = new PrismaClient()
    testFactory = new TestFactory(prisma)
  })

  beforeEach(async () => {
    await testFactory.cleanupDatabase()
    
    testUser = await testFactory.createUser({
      email: 'testuser@example.com',
      password: 'password123'
    })
    
    otherUser = await testFactory.createUser({
      email: 'otheruser@example.com',
      password: 'password456'
    })
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
    
    authToken = loginResponse.body.token
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/v1/notification', () => {
    beforeEach(async () => {
      // Create test notifications
      await testFactory.createNotification(otherUser.id, testUser.id, {
        message: 'You have a new message',
        read: false,
        notificationType: 'EXAMPLE_NOTIFICATION'
      })

      await testFactory.createNotification(otherUser.id, testUser.id, {
        message: 'Another notification',
        read: true,
        notificationType: 'EXAMPLE_NOTIFICATION'
      })

      await testFactory.createNotification(testUser.id, otherUser.id, {
        message: 'Notification for other user',
        read: false,
        notificationType: 'EXAMPLE_NOTIFICATION'
      })
    })

    it('should return user notifications with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('notifications')
      expect(Array.isArray(response.body.notifications)).toBe(true)
      
      // Should only return notifications for the current user (receiver)
      response.body.notifications.forEach((notification: any) => {
        expect(notification.receiverId).toBe(testUser.id)
        expect(notification).toHaveProperty('id')
        expect(notification).toHaveProperty('message')
        expect(notification).toHaveProperty('read')
        expect(notification).toHaveProperty('notificationType')
        expect(notification).toHaveProperty('createdAt')
      })
    })

    it('should return notifications with pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/notification?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.notifications.length).toBeLessThanOrEqual(1)
      expect(response.body).toHaveProperty('pagination')
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(1)
    })

    it('should filter notifications by read status', async () => {
      const response = await request(app)
        .get('/api/v1/notification?read=false')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.notifications.forEach((notification: any) => {
        expect(notification.read).toBe(false)
      })
    })

    it('should filter notifications by read status true', async () => {
      const response = await request(app)
        .get('/api/v1/notification?read=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.notifications.forEach((notification: any) => {
        expect(notification.read).toBe(true)
      })
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/v1/notification')
        .expect(401)
    })

    it('should return empty array for user with no notifications', async () => {
      // Create a user with no notifications
      const newUser = await testFactory.createUser({
        email: 'newuser@example.com',
        password: 'password789'
      })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: newUser.email,
          password: newUser.password
        })

      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200)

      expect(response.body.notifications).toEqual([])
    })
  })

  describe('PUT /api/v1/notification/:notificationId', () => {
    let testNotification: any

    beforeEach(async () => {
      testNotification = await testFactory.createNotification(
        otherUser.id,
        testUser.id,
        {
          message: 'Test notification to toggle',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )
    })

    it('should toggle notification read status from false to true', async () => {
      const response = await request(app)
        .put(`/api/v1/notification/${testNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('notification')
      expect(response.body.notification.read).toBe(true)
      expect(response.body.notification.id).toBe(testNotification.id)
    })

    it('should toggle notification read status from true to false', async () => {
      // First mark as read
      await prisma.notification.update({
        where: { id: testNotification.id },
        data: { read: true }
      })

      const response = await request(app)
        .put(`/api/v1/notification/${testNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.notification.read).toBe(false)
    })

    it('should return 400 for invalid notification ID format', async () => {
      const response = await request(app)
        .put('/api/v1/notification/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent notification ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .put(`/api/v1/notification/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for notification belonging to another user', async () => {
      const otherNotification = await testFactory.createNotification(
        testUser.id,
        otherUser.id,
        {
          message: 'Other user notification',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )

      const response = await request(app)
        .put(`/api/v1/notification/${otherNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .put(`/api/v1/notification/${testNotification.id}`)
        .expect(401)
    })
  })

  describe('DELETE /api/v1/notification/:notificationId', () => {
    let testNotification: any

    beforeEach(async () => {
      testNotification = await testFactory.createNotification(
        otherUser.id,
        testUser.id,
        {
          message: 'Test notification to delete',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )
    })

    it('should delete notification with valid token', async () => {
      const response = await request(app)
        .delete(`/api/v1/notification/${testNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('message')
      expect(response.body.message).toContain('deleted')

      // Verify notification is actually deleted
      const deletedNotification = await prisma.notification.findUnique({
        where: { id: testNotification.id }
      })
      expect(deletedNotification).toBeNull()
    })

    it('should return 400 for invalid notification ID format', async () => {
      const response = await request(app)
        .delete('/api/v1/notification/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent notification ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .delete(`/api/v1/notification/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for notification belonging to another user', async () => {
      const otherNotification = await testFactory.createNotification(
        testUser.id,
        otherUser.id,
        {
          message: 'Other user notification',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )

      const response = await request(app)
        .delete(`/api/v1/notification/${otherNotification.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .delete(`/api/v1/notification/${testNotification.id}`)
        .expect(401)
    })
  })

  describe('Notification relationships and data integrity', () => {
    it('should handle notifications with sender and receiver relationships', async () => {
      const notification = await testFactory.createNotification(
        otherUser.id,
        testUser.id,
        {
          message: 'Relationship test notification',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )

      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const foundNotification = response.body.notifications.find(
        (n: any) => n.id === notification.id
      )

      expect(foundNotification).toBeDefined()
      expect(foundNotification.receiverId).toBe(testUser.id)
      expect(foundNotification.message).toBe('Relationship test notification')
    })

    it('should handle multiple notifications from different senders', async () => {
      const thirdUser = await testFactory.createUser({
        email: 'thirduser@example.com',
        password: 'password999'
      })

      await testFactory.createNotification(otherUser.id, testUser.id, {
        message: 'From other user',
        read: false,
        notificationType: 'EXAMPLE_NOTIFICATION'
      })

      await testFactory.createNotification(thirdUser.id, testUser.id, {
        message: 'From third user',
        read: false,
        notificationType: 'EXAMPLE_NOTIFICATION'
      })

      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.notifications).toHaveLength(2)
      
      const messages = response.body.notifications.map((n: any) => n.message)
      expect(messages).toContain('From other user')
      expect(messages).toContain('From third user')
    })

    it('should handle notification creation timestamps', async () => {
      const beforeCreation = new Date()
      
      const notification = await testFactory.createNotification(
        otherUser.id,
        testUser.id,
        {
          message: 'Timestamp test',
          read: false,
          notificationType: 'EXAMPLE_NOTIFICATION'
        }
      )

      const afterCreation = new Date()

      const response = await request(app)
        .get('/api/v1/notification')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      const foundNotification = response.body.notifications.find(
        (n: any) => n.id === notification.id
      )

      const createdAt = new Date(foundNotification.createdAt)
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })
  })
})
