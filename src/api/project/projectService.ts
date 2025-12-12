import { ResponseCode, serviceMethod } from '@common'
import { autoInjectable, singleton } from 'tsyringe'
import { prisma } from '@app'
import {
  ICreateProject,
  IGetProjectById,
  IGetProjects,
  IProjectService,
} from './interface'
import { MediaService } from '@api/media/mediaService'
import { Prisma } from '@prisma/client'

@singleton()
@autoInjectable()
export class ProjectService implements IProjectService {
  constructor(private readonly mediaService: MediaService) {}

  @serviceMethod()
  async createProject({
    userId,
    name,
    description,
    deadline,
    mediaFiles,
  }: ICreateProject) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const project = await tx.project.create({
        data: {
          userId,
          name,
          description,
          deadline,
        },
      })
      if (!project) {
        return { code: ResponseCode.FAILED_INSERT }
      }
      const { mediaInfo, code: mediaCode } =
        await this.mediaService.createMediaEntries({
          projectId: project.id,
          mediaFiles,
          prisma: tx,
        })
      if (mediaCode !== ResponseCode.OK) {
        throw new Error('Media creation failed')
      }

      return { mediaInfo, code: ResponseCode.OK }
    })
  }

  @serviceMethod()
  async getProjects({ page, perPage, userId }: IGetProjects) {
    const offset = (page - 1) * perPage

    const projects = await prisma.project.findMany({
      where: { userId },
      skip: offset,
      take: perPage,
    })

    return { projects, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getProjectById({ projectId, userId }: IGetProjectById) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    if (!project) {
      return { code: ResponseCode.PROJECT_NOT_FOUND }
    }

    if (project.userId !== userId) {
      return { code: ResponseCode.UNAUTHORIZED }
    }

    return { project, code: ResponseCode.OK }
  }
}
