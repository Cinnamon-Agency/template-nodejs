import { NextFunction, Request, Response } from 'express'
import { autoInjectable } from 'tsyringe'
import { ProjectService } from './projectService'
import { ResponseMessage } from '../../interface'

@autoInjectable()
export class ProjectController {
  private readonly projectService: ProjectService

  constructor(projectService: ProjectService) {
    this.projectService = projectService
  }

  createProject = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user
    const { name, description, deadline, mediaFiles } = res.locals.input

    const { mediaInfo, code: adminCode } =
      await this.projectService.createProject({
        userId: id,
        name,
        description,
        deadline,
        mediaFiles
      })

    return next({ mediaInfo, code: adminCode })
  }

  getProjects = async (req: Request, res: Response, next: NextFunction) => {
    const { page, perPage } = res.locals.input
    const { projects, code: projectCode } =
      await this.projectService.getProjects({
        page,
        perPage
      })

    return next({ projects, code: projectCode })
  }

  getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    const { id: projectId } = res.locals.input

    const { project, code } = await this.projectService.getProjectById({
      projectId
    })

    if (!project) {
      return { code: ResponseMessage.PROJECT_NOT_FOUND }
    }
    return next({ project, code })
  }
}
