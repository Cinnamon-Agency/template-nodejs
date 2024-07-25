import express from 'express'
import { container } from 'tsyringe'
import { requireToken } from '../../middleware/auth'
import {
  createProjectSchema,
  getProjectsSchema,
  getProjectByIdSchema
} from './projectInput'
import { validate } from '../../middleware/validation'
import { ProjectController } from './projectController'

const projectController = container.resolve(ProjectController)
export const projectRouter = express.Router()

projectRouter.post(
  '/',
  requireToken,
  validate(createProjectSchema),
  projectController.createProject
)
projectRouter.get(
  '/',
  requireToken,
  validate(getProjectsSchema),
  projectController.getProjects
)
projectRouter.get(
  '/:id',
  requireToken,
  validate(getProjectByIdSchema),
  projectController.getProjectById
)
