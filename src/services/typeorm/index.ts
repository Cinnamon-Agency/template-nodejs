import 'reflect-metadata'
import 'dotenv/config'
import { DataSource } from 'typeorm'
import { models } from '../../models'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'
import config from '../../config'

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: config.DB_HOSTNAME,
  port: config.DB_PORT,
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  entities: models,
  migrations: [__dirname + '/../../migrations/*{.ts,.js}'],
  synchronize: config.TYPEORM_SYNCHRONIZE,
  migrationsRun: config.TYPEORM_RUN_MIGRATIONS,
  logging: false,
  namingStrategy: new SnakeNamingStrategy()
})

export const init = () => {
  try {
    AppDataSource.initialize()
  } catch (error) {
    console.error('[typeorm][init][Error]: ', error)
  }
}
