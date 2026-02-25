import { NextFunction, Request, Response } from 'express'
import { autoInjectable, singleton } from 'tsyringe'
import { ProjectService } from './projectService'

@singleton()
@autoInjectable()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  public createProject = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.user
    const { name, description, deadline, mediaFiles } = res.locals.input

    const { mediaInfo, code } = await this.projectService.createProject({
      userId: id,
      name,
      description,
      deadline,
      mediaFiles,
    })

    return next({ mediaInfo, code })
  }

  public getProjects = async (req: Request, res: Response, next: NextFunction) => {
    const { page, perPage } = res.locals.input
    const { id: userId } = req.user
    const { data, code } = await this.projectService.getProjects({
      page,
      perPage,
      userId,
    })

    return next({ data, code })
  }

  public getProjectById = async (req: Request, res: Response, next: NextFunction) => {
    const { id: projectId } = res.locals.input
    const { id: userId } = req.user

    const { project, code } = await this.projectService.getProjectById({
      projectId,
      userId,
    })

    return next({ project, code })
  }
}
