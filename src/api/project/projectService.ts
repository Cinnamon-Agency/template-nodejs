import { ResponseCode } from '../../interface'
import { logger } from '../../logger'
import { getResponseMessage } from '../../services/utils'
import { autoInjectable, container } from 'tsyringe'
import { AppDataSource } from '../../services/typeorm'
import { Repository } from 'typeorm'
import {
  ICreateProject,
  IGetProjectById,
  IGetProjects,
  IProjectService
} from './interface'
import { Project } from './projectModel'
import { MediaService } from '../media/mediaService'

const mediaService = container.resolve(MediaService)

@autoInjectable()
export class ProjectService implements IProjectService {
  private readonly projectRepository: Repository<Project>

  constructor() {
    this.projectRepository = AppDataSource.manager.getRepository(Project)
  }

  createProject = async ({
    userId,
    name,
    description,
    deadline,
    mediaFiles
  }: ICreateProject) => {
    let code: ResponseCode = ResponseCode.OK
    const queryRunner = AppDataSource.createQueryRunner()

    try {
      await queryRunner.connect()
      await queryRunner.startTransaction()

      const insertResult = await this.projectRepository
        .createQueryBuilder('project', queryRunner)
        .insert()
        .into(Project)
        .values([
          {
            userId,
            name,
            description,
            deadline
          }
        ])
        .execute()

      if (insertResult.raw.affectedRows !== 1) {
        return { code: ResponseCode.FAILED_INSERT }
      }

      const projectId = insertResult.identifiers[0].id

      const project = await this.projectRepository
        .createQueryBuilder('project', queryRunner)
        .where('project.id = :projectId', { projectId })
        .getOne()

      if (!project) {
        return { code: ResponseCode.PROJECT_NOT_FOUND }
      }

      const { mediaInfo, code: mediaCode } =
        await mediaService.createMediaEntries({
          projectId,
          mediaFiles,
          queryRunner
        })
      if (mediaCode !== ResponseCode.OK) {
        await queryRunner.rollbackTransaction()
        await queryRunner.release()
        return { code: mediaCode }
      }

      await queryRunner.commitTransaction()
      await queryRunner.release()

      return { mediaInfo, code }
    } catch (err: any) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  getProjects = async ({ page, perPage }: IGetProjects) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const offset = (page - 1) * perPage

      const projects = await this.projectRepository.find({
        skip: offset,
        take: perPage
      })

      return { projects, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }

  getProjectById = async ({ projectId }: IGetProjectById) => {
    let code: ResponseCode = ResponseCode.OK

    try {
      const project = await this.projectRepository.findOne({
        where: {
          id: projectId
        }
      })

      if (!project) {
        return { code: ResponseCode.PROJECT_NOT_FOUND }
      }

      return { project, code }
    } catch (err: any) {
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack
      })
    }

    return { code }
  }
}
