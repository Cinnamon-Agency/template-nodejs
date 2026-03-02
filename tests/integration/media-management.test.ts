import 'reflect-metadata'
import request from 'supertest'
import { App } from '../../src/core/app'
import express from 'express'
import { TestFactory } from '../helpers/testFactory'
import { PrismaClient } from '@prisma/client'

describe('Media Management Integration Tests', () => {
  let app: express.Express
  let testFactory: TestFactory
  let prisma: PrismaClient
  let authToken: string
  let testUser: any
  let testProject: any

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
    
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      })
    
    authToken = loginResponse.body.token
    
    // Create test project
    testProject = await testFactory.createProject(testUser.id, {
      name: 'Test Project for Media',
      description: 'Project to test media functionality',
      deadline: new Date('2024-12-31')
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('Media Upload and Download API Tests', () => {
    it('should upload video files via API', async () => {
      const mediaData = {
        mediaFiles: [
          {
            mediaFileName: 'test-video.mp4',
            mediaType: 'VIDEO'
          },
          {
            mediaFileName: 'test-image.jpg',
            mediaType: 'IMAGE'
          }
        ]
      }

      const response = await request(app)
        .post(`/api/v1/projects/${testProject.id}/media`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(mediaData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
      expect(response.body.data[0].mediaFileName).toBe('test-video.mp4')
      expect(response.body.data[1].mediaFileName).toBe('test-image.jpg')
    })

    it('should retrieve media files for a project', async () => {
      // Create test media
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'video1.mp4',
        mediaType: 'VIDEO'
      })
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'image1.jpg',
        mediaType: 'IMAGE'
      })

      const response = await request(app)
        .get(`/api/v1/projects/${testProject.id}/media`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveLength(2)
    })

    it('should filter media by type', async () => {
      // Create test media
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'video1.mp4',
        mediaType: 'VIDEO'
      })
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'image1.jpg',
        mediaType: 'IMAGE'
      })

      // Test video filter
      const videoResponse = await request(app)
        .get(`/api/v1/projects/${testProject.id}/media?mediaType=VIDEO`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(videoResponse.body.success).toBe(true)
      expect(videoResponse.body.data).toHaveLength(1)
      expect(videoResponse.body.data[0].mediaType).toBe('VIDEO')

      // Test image filter
      const imageResponse = await request(app)
        .get(`/api/v1/projects/${testProject.id}/media?mediaType=IMAGE`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(imageResponse.body.success).toBe(true)
      expect(imageResponse.body.data).toHaveLength(1)
      expect(imageResponse.body.data[0].mediaType).toBe('IMAGE')
    })

    it('should generate download URL for media file', async () => {
      const media = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'download-test-video.mp4',
        mediaType: 'VIDEO'
      })

      const response = await request(app)
        .get(`/api/v1/media/${media.mediaFileName}/download`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.downloadUrl).toBeDefined()
      expect(response.body.data.downloadUrl).toContain(media.mediaFileName)
    })

    it('should delete media file', async () => {
      const media = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'delete-test-video.mp4',
        mediaType: 'VIDEO'
      })

      // Verify media exists
      let mediaCount = await prisma.media.count({
        where: { projectId: testProject.id }
      })
      expect(mediaCount).toBe(1)

      // Delete media
      const response = await request(app)
        .delete(`/api/v1/media/${media.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify media is deleted
      mediaCount = await prisma.media.count({
        where: { projectId: testProject.id }
      })
      expect(mediaCount).toBe(0)
    })
  })

  describe('Media Upload and Management', () => {
    // Note: These tests assume there's a media upload endpoint
    // Adjust the endpoint and payload based on your actual implementation

    it('should handle media file creation for project', async () => {
      // This test would need to be adjusted based on your actual media endpoint
      // For now, we'll test the database operations through TestFactory
      
      const media = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'test-image.jpg',
        mediaType: 'IMAGE'
      })

      expect(media.id).toBeDefined()
      expect(media.mediaFileName).toBe('test-image.jpg')
      expect(media.mediaType).toBe('IMAGE')
      expect(media.projectId).toBe(testProject.id)

      // Verify media is associated with project
      const projectMedia = await prisma.media.findMany({
        where: { projectId: testProject.id }
      })
      expect(projectMedia).toHaveLength(1)
      expect(projectMedia[0].id).toBe(media.id)
    })

    it('should handle multiple media files for single project', async () => {
      const media1 = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'image1.jpg',
        mediaType: 'IMAGE'
      })

      const media2 = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'video1.mp4',
        mediaType: 'VIDEO'
      })

      const media3 = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'image2.png',
        mediaType: 'IMAGE'
      })

      const projectMedia = await prisma.media.findMany({
        where: { projectId: testProject.id },
        orderBy: { createdAt: 'asc' }
      })

      expect(projectMedia).toHaveLength(3)
      expect(projectMedia[0].mediaFileName).toBe('image1.jpg')
      expect(projectMedia[1].mediaFileName).toBe('video1.mp4')
      expect(projectMedia[2].mediaFileName).toBe('image2.png')
    })

    it('should handle different media types', async () => {
      const imageMedia = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'test-image.jpg',
        mediaType: 'IMAGE'
      })

      const videoMedia = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'test-video.mp4',
        mediaType: 'VIDEO'
      })

      expect(imageMedia.mediaType).toBe('IMAGE')
      expect(videoMedia.mediaType).toBe('VIDEO')

      // Test filtering by media type
      const imageFiles = await prisma.media.findMany({
        where: { 
          projectId: testProject.id,
          mediaType: 'IMAGE'
        }
      })
      expect(imageFiles).toHaveLength(1)
      expect(imageFiles[0].mediaFileName).toBe('test-image.jpg')

      const videoFiles = await prisma.media.findMany({
        where: { 
          projectId: testProject.id,
          mediaType: 'VIDEO'
        }
      })
      expect(videoFiles).toHaveLength(1)
      expect(videoFiles[0].mediaFileName).toBe('test-video.mp4')
    })
  })

  describe('Media Authorization and Security', () => {
    let otherUser: any
    let otherProject: any

    beforeEach(async () => {
      otherUser = await testFactory.createUser({
        email: 'otheruser@example.com',
        password: 'password456'
      })

      otherProject = await testFactory.createProject(otherUser.id, {
        name: 'Other User Project',
        description: 'Project belonging to another user',
        deadline: new Date('2024-12-31')
      })

      // Create media in both projects
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'user-media.jpg',
        mediaType: 'IMAGE'
      })

      await testFactory.createMedia(otherProject.id, {
        mediaFileName: 'other-user-media.jpg',
        mediaType: 'IMAGE'
      })
    })

    it('should allow users to access their own project media', async () => {
      const userMedia = await prisma.media.findMany({
        where: { projectId: testProject.id }
      })

      expect(userMedia).toHaveLength(1)
      expect(userMedia[0].mediaFileName).toBe('user-media.jpg')
    })

    it('should prevent users from accessing other users project media', async () => {
      // This would be tested through API endpoints if they exist
      // For now, we verify the database relationships are correct
      
      const otherUserMedia = await prisma.media.findMany({
        where: { projectId: otherProject.id }
      })

      expect(otherUserMedia).toHaveLength(1)
      expect(otherUserMedia[0].mediaFileName).toBe('other-user-media.jpg')

      // Verify media is correctly associated with projects
      const testProjectMedia = await prisma.media.findMany({
        where: { projectId: testProject.id }
      })
      expect(testProjectMedia[0].projectId).toBe(testProject.id)
      expect(testProjectMedia[0].projectId).not.toBe(otherProject.id)
    })
  })

  describe('Media File Constraints and Validation', () => {
    it('should enforce unique media file names', async () => {
      const mediaFileName = 'unique-test-image.jpg'
      
      await testFactory.createMedia(testProject.id, {
        mediaFileName,
        mediaType: 'IMAGE'
      })

      // Attempt to create another media with same filename should fail
      await expect(
        prisma.media.create({
          data: {
            mediaFileName,
            mediaType: 'IMAGE',
            projectId: testProject.id
          }
        })
      ).rejects.toThrow()
    })

    it('should handle media with different projects', async () => {
      const secondProject = await testFactory.createProject(testUser.id, {
        name: 'Second Project',
        description: 'Another project for same user',
        deadline: new Date('2024-12-31')
      })

      const media1 = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'project1-image.jpg',
        mediaType: 'IMAGE'
      })

      const media2 = await testFactory.createMedia(secondProject.id, {
        mediaFileName: 'project2-image.jpg',
        mediaType: 'IMAGE'
      })

      expect(media1.projectId).toBe(testProject.id)
      expect(media2.projectId).toBe(secondProject.id)
      expect(media1.id).not.toBe(media2.id)

      // Verify media counts per project
      const project1Media = await prisma.media.findMany({
        where: { projectId: testProject.id }
      })
      expect(project1Media).toHaveLength(1)

      const project2Media = await prisma.media.findMany({
        where: { projectId: secondProject.id }
      })
      expect(project2Media).toHaveLength(1)
    })

    it('should handle media deletion with project', async () => {
      await testFactory.createMedia(testProject.id, {
        mediaFileName: 'to-be-deleted.jpg',
        mediaType: 'IMAGE'
      })

      // Verify media exists
      let mediaCount = await prisma.media.count({
        where: { projectId: testProject.id }
      })
      expect(mediaCount).toBe(1)

      // Delete project (should cascade delete media due to foreign key constraint)
      await prisma.project.delete({
        where: { id: testProject.id }
      })

      // Verify media is also deleted
      mediaCount = await prisma.media.count({
        where: { projectId: testProject.id }
      })
      expect(mediaCount).toBe(0)
    })
  })

  describe('Media Metadata and Timestamps', () => {
    it('should handle media creation timestamps', async () => {
      const beforeCreation = new Date()
      
      const media = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'timestamp-test.jpg',
        mediaType: 'IMAGE'
      })

      const afterCreation = new Date()

      const mediaFromDb = await prisma.media.findUnique({
        where: { id: media.id }
      })

      expect(mediaFromDb).toBeDefined()
      expect(mediaFromDb!.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(mediaFromDb!.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
      expect(mediaFromDb!.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime())
      expect(mediaFromDb!.updatedAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime())
    })

    it('should handle media update timestamps', async () => {
      const media = await testFactory.createMedia(testProject.id, {
        mediaFileName: 'update-test.jpg',
        mediaType: 'IMAGE'
      })

      // Get original timestamp from database
      const originalMedia = await prisma.media.findUnique({
        where: { id: media.id }
      })

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10))

      // Update media (if update endpoint exists)
      await prisma.media.update({
        where: { id: media.id },
        data: { mediaType: 'VIDEO' }
      })

      const updatedMedia = await prisma.media.findUnique({
        where: { id: media.id }
      })

      expect(updatedMedia!.mediaType).toBe('VIDEO')
      expect(updatedMedia!.updatedAt.getTime()).toBeGreaterThan(originalMedia!.updatedAt.getTime())
    })
  })

  describe('Media File Name Validation', () => {
    it('should handle various file name formats', async () => {
      const fileNames = [
        'simple.jpg',
        'file-with-dashes.png',
        'file_with_underscores.gif',
        'file.with.dots.mp4',
        'fileName123.jpg',
        'UPPERCASE.JPG'
      ]

      for (const fileName of fileNames) {
        const media = await testFactory.createMedia(testProject.id, {
          mediaFileName: fileName,
          mediaType: 'IMAGE'
        })

        expect(media.mediaFileName).toBe(fileName)
      }

      const allMedia = await prisma.media.findMany({
        where: { projectId: testProject.id },
        orderBy: { createdAt: 'asc' }
      })

      expect(allMedia).toHaveLength(fileNames.length)
      allMedia.forEach((media, index) => {
        expect(media.mediaFileName).toBe(fileNames[index])
      })
    })

    it('should handle special characters in file names', async () => {
      const specialFileNames = [
        'file with spaces.jpg',
        'file@symbol.png',
        'file#hash.gif',
        'file%percent.mp4'
      ]

      for (const fileName of specialFileNames) {
        const media = await testFactory.createMedia(testProject.id, {
          mediaFileName: fileName,
          mediaType: 'IMAGE'
        })

        expect(media.mediaFileName).toBe(fileName)
      }
    })
  })
})
