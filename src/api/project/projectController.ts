import { NextFunction, Request, Response } from 'express'
import { autoInjectable, singleton } from 'tsyringe'
import { ProjectService } from './projectService'
import { ResponseMessage } from '@common'
import { logEndpoint } from '@common/decorators/logEndpoint'

@singleton()
@autoInjectable()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @logEndpoint()
  public async createProject(req: Request, res: Response, next: NextFunction) {
    const { id } = req.user
    const { name, description, deadline, mediaFiles } = res.locals.input

    const { mediaInfo, code: adminCode } =
      await this.projectService.createProject({
        userId: id,
        name,
        description,
        deadline,
        mediaFiles,
      })

    return next({ mediaInfo, code: adminCode })
  }

  @logEndpoint()
  public async getProjects(req: Request, res: Response, next: NextFunction) {
    const { page, perPage } = res.locals.input
    const { projects, code: projectCode } =
      await this.projectService.getProjects({
        page,
        perPage,
      })

    return next({ projects, code: projectCode })
  }

  @logEndpoint()
  public async getProjectById(req: Request, res: Response, next: NextFunction) {
    const { id: projectId } = res.locals.input

    const { project, code } = await this.projectService.getProjectById({
      projectId,
    })

    if (!project) {
      return { code: ResponseMessage.PROJECT_NOT_FOUND }
    }
    return next({ project, code })
  }
}
