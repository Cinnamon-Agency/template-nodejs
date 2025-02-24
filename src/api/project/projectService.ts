import { ResponseCode, serviceErrorHandler } from '@common'
import { logger } from '@core/logger'
import { getResponseMessage } from '@common'
import { autoInjectable, inject, singleton } from 'tsyringe'
import { DataSource, Repository } from 'typeorm'
import {
  ICreateProject,
  IGetProjectById,
  IGetProjects,
  IProjectService,
} from './interface'
import { Project } from './projectModel'
import { MediaService } from '@api/media/mediaService'

@singleton()
@autoInjectable()
export class ProjectService implements IProjectService {
  private readonly projectRepository: Repository<Project>

  constructor(
    @inject(DataSource) private readonly dataSource: DataSource,
    private readonly mediaService: MediaService
  ) {
    this.projectRepository = this.dataSource.manager.getRepository(Project)
  }

  @serviceErrorHandler()
  async createProject({
    userId,
    name,
    description,
    deadline,
    mediaFiles,
  }: ICreateProject) {
    let code: ResponseCode = ResponseCode.OK
    const queryRunner = this.dataSource.createQueryRunner()

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
            deadline,
          },
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
        await this.mediaService.createMediaEntries({
          projectId,
          mediaFiles,
          queryRunner,
        })
      if (mediaCode !== ResponseCode.OK) {
        await queryRunner.rollbackTransaction()
        await queryRunner.release()
        return { code: mediaCode }
      }

      await queryRunner.commitTransaction()
      await queryRunner.release()

      return { mediaInfo, code }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      await queryRunner.rollbackTransaction()
      await queryRunner.release()
      code = ResponseCode.SERVER_ERROR
      logger.error({
        code,
        message: getResponseMessage(code),
        stack: err.stack,
      })
    }

    return { code }
  }

  @serviceErrorHandler()
  async getProjects({ page, perPage }: IGetProjects) {
    const offset = (page - 1) * perPage

    const projects = await this.projectRepository.find({
      skip: offset,
      take: perPage,
    })

    return { projects, code: ResponseCode.OK }
  }

  @serviceErrorHandler()
  async getProjectById({ projectId }: IGetProjectById) {
    const project = await this.projectRepository.findOne({
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
