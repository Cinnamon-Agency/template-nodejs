import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'

describe('User API Integration Tests', () => {
  let app: express.Express

  beforeAll(async () => {
    const appInstance = new App()
    appInstance.initializeApp()
    app = appInstance.getApp()
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

        // Should fail validation (400) since required fields are missing
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
    })

    describe('POST /api/v1/auth/login', () => {
      it('should return error for missing credentials', async () => {
        const response = await request(app)
          .post('/api/v1/auth/login')
          .send({})

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
