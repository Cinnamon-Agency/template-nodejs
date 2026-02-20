import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('Project Management Integration Tests', () => {
  let app: express.Express
  let testFactory: TestFactory
  let prisma: PrismaClient
  let authToken: string
  let testUser: any

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
      email: 'projectuser@example.com',
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

  describe('POST /api/v1/project', () => {
    it('should create project with valid data', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project description',
        deadline: '2024-12-31T23:59:59.000Z'
      }

      const response = await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(200)

      expect(response.body).toHaveProperty('project')
      expect(response.body.project.name).toBe(projectData.name)
      expect(response.body.project.description).toBe(projectData.description)
      expect(response.body.project.userId).toBe(testUser.id)
      expect(response.body.project.projectStatus).toBe('ACTIVE')
    })

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 for invalid deadline format', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project description',
        deadline: 'invalid-date'
      }

      const response = await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 without auth token', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'A test project description',
        deadline: '2024-12-31T23:59:59.000Z'
      }

      await request(app)
        .post('/api/v1/project')
        .send(projectData)
        .expect(401)
    })

    it('should create multiple projects for same user', async () => {
      const projectData1 = {
        name: 'Project 1',
        description: 'First project',
        deadline: '2024-12-31T23:59:59.000Z'
      }

      const projectData2 = {
        name: 'Project 2',
        description: 'Second project',
        deadline: '2024-12-31T23:59:59.000Z'
      }

      await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData1)
        .expect(200)

      await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData2)
        .expect(200)

      const projects = await prisma.project.findMany({
        where: { userId: testUser.id }
      })

      expect(projects).toHaveLength(2)
    })
  })

  describe('GET /api/v1/project', () => {
    beforeEach(async () => {
      // Create test projects
      await testFactory.createProject(testUser.id, {
        name: 'Active Project 1',
        description: 'Description 1',
        deadline: new Date('2024-12-31'),
        projectStatus: 'ACTIVE'
      })

      await testFactory.createProject(testUser.id, {
        name: 'Active Project 2',
        description: 'Description 2',
        deadline: new Date('2024-11-30'),
        projectStatus: 'ACTIVE'
      })

      await testFactory.createProject(testUser.id, {
        name: 'Finished Project',
        description: 'Description 3',
        deadline: new Date('2024-10-31'),
        projectStatus: 'FINISHED'
      })
    })

    it('should return user projects with default pagination', async () => {
      const response = await request(app)
        .get('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('projects')
      expect(response.body).toHaveProperty('pagination')
      expect(Array.isArray(response.body.projects)).toBe(true)
      expect(response.body.projects.length).toBeGreaterThanOrEqual(1)
    })

    it('should return projects with pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/project?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.projects.length).toBeLessThanOrEqual(2)
      expect(response.body.pagination.page).toBe(1)
      expect(response.body.pagination.limit).toBe(2)
    })

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/v1/project?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.projects.forEach((project: any) => {
        expect(project.projectStatus).toBe('ACTIVE')
      })
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/v1/project')
        .expect(401)
    })

    it('should return only user own projects', async () => {
      // Create another user and their project
      const otherUser = await testFactory.createUser({
        email: 'otheruser@example.com',
        password: 'password456'
      })

      await testFactory.createProject(otherUser.id, {
        name: 'Other User Project',
        description: 'Should not be visible',
        deadline: new Date('2024-12-31')
      })

      const response = await request(app)
        .get('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      response.body.projects.forEach((project: any) => {
        expect(project.userId).toBe(testUser.id)
      })
    })
  })

  describe('GET /api/v1/project/:id', () => {
    let testProject: any

    beforeEach(async () => {
      testProject = await testFactory.createProject(testUser.id, {
        name: 'Test Project',
        description: 'Test description',
        deadline: new Date('2024-12-31')
      })
    })

    it('should return project by ID with valid token', async () => {
      const response = await request(app)
        .get(`/api/v1/project/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('project')
      expect(response.body.project.id).toBe(testProject.id)
      expect(response.body.project.name).toBe('Test Project')
      expect(response.body.project.userId).toBe(testUser.id)
    })

    it('should return 400 for invalid project ID format', async () => {
      const response = await request(app)
        .get('/api/v1/project/invalid-uuid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for non-existent project ID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      const response = await request(app)
        .get(`/api/v1/project/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 for project belonging to another user', async () => {
      const otherUser = await testFactory.createUser({
        email: 'otheruser@example.com',
        password: 'password456'
      })

      const otherProject = await testFactory.createProject(otherUser.id, {
        name: 'Other User Project',
        description: 'Not accessible',
        deadline: new Date('2024-12-31')
      })

      const response = await request(app)
        .get(`/api/v1/project/${otherProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body).toHaveProperty('error')
    })

    it('should return 401 without auth token', async () => {
      await request(app)
        .get(`/api/v1/project/${testProject.id}`)
        .expect(401)
    })
  })

  describe('Project lifecycle and relationships', () => {
    it('should handle project with media files', async () => {
      const project = await testFactory.createProject(testUser.id, {
        name: 'Project with Media',
        description: 'Has media files',
        deadline: new Date('2024-12-31')
      })

      // Create media files for the project
      await testFactory.createMedia(project.id, {
        mediaFileName: 'test-image.jpg',
        mediaType: 'IMAGE'
      })

      await testFactory.createMedia(project.id, {
        mediaFileName: 'test-video.mp4',
        mediaType: 'VIDEO'
      })

      const response = await request(app)
        .get(`/api/v1/project/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.project.id).toBe(project.id)
      // Note: Media files might be loaded separately depending on implementation
    })

    it('should handle project status transitions', async () => {
      const project = await testFactory.createProject(testUser.id, {
        name: 'Status Test Project',
        description: 'Testing status changes',
        deadline: new Date('2024-12-31'),
        projectStatus: 'ACTIVE'
      })

      // Update project status to FINISHED
      await prisma.project.update({
        where: { id: project.id },
        data: { projectStatus: 'FINISHED' }
      })

      const response = await request(app)
        .get(`/api/v1/project/${project.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.project.projectStatus).toBe('FINISHED')
    })

    it('should handle project deadline validation', async () => {
      const pastDeadline = new Date('2020-01-01')
      
      const projectData = {
        name: 'Past Deadline Project',
        description: 'Should still be created',
        deadline: pastDeadline.toISOString()
      }

      const response = await request(app)
        .post('/api/v1/project')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(200)

      expect(response.body.project.deadline).toBe(projectData.deadline)
    })
  })
})
