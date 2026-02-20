import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('User Management Integration Tests', () => {
  let app: express.Express
  let testFactory: TestFactory
  let prisma: PrismaClient
  let authToken: string

  beforeAll(async () => {
    const appInstance = new App()
    appInstance.initializeApp()
    app = appInstance.getApp()
    
    prisma = new PrismaClient()
    testFactory = new TestFactory(prisma)
  })

  beforeEach(async () => {
    await testFactory.cleanupDatabase()
    const testUser = await testFactory.createUser({
      email: 'testuser@example.com',
      password: 'password123'
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

  describe('GET /api/v1/user', () => {
    it('should return current user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/user')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe('testuser@example.com')
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get('/api/v1/user')
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/user')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })
  })

  describe('GET /api/v1/user/toggleNotifications', () => {
    it('should toggle notifications from false to true', async () => {
      // First verify notifications are false by default
      const user = await prisma.user.findUnique({
        where: { email: 'testuser@example.com' }
      })
      expect(user?.notifications).toBe(false)

      const response = await request(app)
        .get('/api/v1/user/toggleNotifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('notifications')
      expect(response.body.notifications).toBe(true)
    })

    it('should toggle notifications from true to false', async () => {
      // First set notifications to true
      await prisma.user.update({
        where: { email: 'testuser@example.com' },
        data: { notifications: true }
      })

      const response = await request(app)
        .get('/api/v1/user/toggleNotifications')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.notifications).toBe(false)
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/v1/user/toggleNotifications')
        .expect(401)
    })
  })

  describe('GET /api/v1/user/:id', () => {
    let targetUser: any

    beforeEach(async () => {
      targetUser = await testFactory.createUser({
        email: 'targetuser@example.com',
        password: 'password456'
      })
    })

    it('should return user profile by ID with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/user/${targetUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.id).toBe(targetUser.id)
      expect(response.body.user.email).toBe(targetUser.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should return 400 for invalid user ID format', async () => {
      const response = await request(app)
        .get('/api/v1/user/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent user ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .get(`/api/v1/user/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .get(`/api/v1/user/${targetUser.id}`)
        .expect(401)
    })
  })

  describe('User profile updates and relationships', () => {
    it('should handle user with phone number', async () => {
      const userWithPhone = await testFactory.createUser({
        email: 'phoneuser@example.com',
        password: 'password789',
        phoneNumber: '+1234567890'
      })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: userWithPhone.email,
          password: userWithPhone.password
        })

      const response = await request(app)
        .get('/api/v1/user')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200)

      expect(response.body.user.phoneNumber).toBe('+1234567890')
    })

    it('should handle OAuth user without password', async () => {
      const oauthUser = await testFactory.createUser({
        email: 'oauthuser@example.com',
        authType: 'GOOGLE'
      })

      // OAuth users should be able to get profile without password login
      const userFromDb = await prisma.user.findUnique({
        where: { email: 'oauthuser@example.com' }
      })

      expect(userFromDb?.password).toBeNull()
      expect(userFromDb?.authType).toBe('GOOGLE')
    })
  })

  describe('Authorization and security', () => {
    it('should prevent access to user data with expired token', async () => {
      // Create a user that will be deleted to simulate expired session
      const tempUser = await testFactory.createUser({
        email: 'tempuser@example.com',
        password: 'temp123'
      })

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: tempUser.email,
          password: tempUser.password
        })

      const tempToken = loginResponse.body.token

      // Delete the user to invalidate the token
      await prisma.user.delete({
        where: { email: 'tempuser@example.com' }
      })

      // Try to use the token
      const response = await request(app)
        .get('/api/v1/user')
        .set('Authorization', `Bearer ${tempToken}`)
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })

    it('should handle malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/user')
        .set('Authorization', 'InvalidFormat token')
        .expect(401)

      expect(response.body).toHaveProperty('error')
    })
  })
})
