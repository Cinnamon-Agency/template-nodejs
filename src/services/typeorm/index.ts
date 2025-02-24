import 'reflect-metadata'
import 'dotenv/config'
import { DataSource } from 'typeorm'
import { models } from '@models'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import config from '@core/config'
import path from 'path'
import { container } from 'tsyringe'
import { logger } from '@core/logger'

export const initializeDataSource = async () => {
  try {
    const dataSource = new DataSource({
      type: 'mysql',
      host: config.DB_HOSTNAME,
      ...(config.USE_UNIX_SOCKET
        ? {
            extra: {
              socketPath: config.DB_HOSTNAME,
            },
          }
        : {}),
      port: config.DB_PORT,
      username: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      entities: models,
      migrations: [path.join(__dirname, '../../migrations/*{.ts,.js}')],
      synchronize: config.TYPEORM_SYNCHRONIZE,
      migrationsRun: config.TYPEORM_RUN_MIGRATIONS,
      logging: false,
      namingStrategy: new SnakeNamingStrategy(),
      poolSize: config.DB_POOL_SIZE,
    })

    await dataSource.initialize()
    container.register(DataSource, { useValue: dataSource })
    logger.info('[typeorm][init] Database connection initialized')
  } catch (error) {
    logger.error('[typeorm][init][Error]: ', error)
    throw error
  }
}
