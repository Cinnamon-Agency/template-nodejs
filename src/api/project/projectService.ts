import { ResponseCode, serviceMethod } from '@common'
import { logger } from '@core/logger'
import { getResponseMessage } from '@common'
import { autoInjectable, container, singleton } from 'tsyringe'
import { prisma } from '@app'
import {
  ICreateProject,
  IGetProjectById,
  IGetProjects,
  IProjectService,
} from './interface'
import { MediaService } from '@api/media/mediaService'
import { Prisma } from '@prisma/client'

const mediaService = container.resolve(MediaService)

@singleton()
@autoInjectable()
export class ProjectService implements IProjectService {
  @serviceMethod()
  async createProject({
    userId,
    name,
    description,
    deadline,
    mediaFiles,
  }: ICreateProject) {
    let code: ResponseCode = ResponseCode.OK
    try {
      const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
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
            await mediaService.createMediaEntries({
              projectId: project.id,
              mediaFiles,
              prisma: tx,
            })
          if (mediaCode !== ResponseCode.OK) {
            throw new Error('Media creation failed')
          }
          return { mediaInfo, code }
        }
      )
      return result
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }
    return { code }
  }

  @serviceMethod()
  async getProjects({ page, perPage }: IGetProjects) {
    const offset = (page - 1) * perPage

    const projects = await prisma.project.findMany({
      skip: offset,
      take: perPage,
    })

    return { projects, code: ResponseCode.OK }
  }

  @serviceMethod()
  async getProjectById({ projectId }: IGetProjectById) {
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    })

    if (!project) {
      return { code: ResponseCode.PROJECT_NOT_FOUND }
    }

    return { project, code: ResponseCode.OK }
  }
}
