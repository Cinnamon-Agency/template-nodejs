import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'

describe('Basic API Tests', () => {
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

  describe('Not found routes', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/api/v1/nonexistent')

      expect(response.status).toBe(404)
    })
  })

  describe('Auth endpoints validation', () => {
    it('should return error for missing required fields in register', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({})

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should return error for invalid email format in register', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          authType: 'USER_PASSWORD',
        })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('should return error for missing credentials in login', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({})

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })
})
