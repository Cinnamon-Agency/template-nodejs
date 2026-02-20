import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('User API Integration Tests', () => {
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

  describe('GET /api/v1/healthcheck', () => {
    it('should return 200 with status ok', async () => {
      const response = await request(app)
        .get('/api/v1/healthcheck')
        .expect(200)

      expect(response.body).toEqual({ status: 'ok' })
    })
  })

  describe('Auth endpoints', () => {
    describe('POST /api/v1/auth/register', () => {
      it('should return error for missing required fields', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({})

        expect(response.status).toBeGreaterThanOrEqual(400)
      })

      it('should return error for invalid email format', async () => {
        const response = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'invalid-email',
            password: 'password123',
            authType: 'USER_PASSWORD',
          })

        expect(response.status).toBeGreaterThanOrEqual(400)
      })

      it('should register user successfully with valid data', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          authType: 'USER_PASSWORD',
        }

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('user')
        expect(response.body.user.email).toBe(userData.email)
        expect(response.body.user).not.toHaveProperty('password')
      })

      it('should register OAuth user without password', async () => {
        const userData = {
          email: 'oauth@example.com',
          authType: 'GOOGLE',
        }

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)

        expect(response.status).toBe(200)
        expect(response.body.user.email).toBe(userData.email)
        expect(response.body.user.authType).toBe(userData.authType)
      })

      it('should return error for duplicate email', async () => {
        const userData = {
          email: 'duplicate@example.com',
          password: 'password123',
          authType: 'USER_PASSWORD',
        }

        await request(app)
          .post('/api/v1/auth/register')
          .send(userData)

        const response = await request(app)
          .post('/api/v1/auth/register')
          .send(userData)

        expect(response.status).toBeGreaterThanOrEqual(400)
      })
    })

    describe('POST /api/v1/auth/login', () => {
      it('should return error for missing credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({})

        expect(response.status).toBeGreaterThanOrEqual(400)
      })

      it('should return error for invalid credentials', async () => {
        await testFactory.createUser({
          email: 'test@example.com',
          password: 'password123',
        })

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword',
          })

        expect(response.status).toBeGreaterThanOrEqual(400)
      })

      it('should login successfully with valid credentials', async () => {
        const testUser = await testFactory.createUser({
          email: 'test@example.com',
          password: 'password123',
        })

        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('user')
        expect(response.body).toHaveProperty('token')
        expect(response.body.user.email).toBe(testUser.email)
      })

      it('should return error for non-existent user', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123',
          })

        expect(response.status).toBeGreaterThanOrEqual(400)
      })
    })
  })

  describe('Not found routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')

      expect(response.status).toBe(404)
    })
  })
})
