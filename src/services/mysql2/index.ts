import { createPool, Pool } from 'mysql2'
import config from '../../config'
import { logger } from '../../logger'
import { ResponseCode } from '../../interfaces'
import { getResponseMessage } from '../utils'

let pool: Pool

export const init = () => {
  try {
    pool = createPool({
      host: config.DB_HOSTNAME,
      user: config.DB_USERNAME,
      password: config.DB_PASSWORD,
      port: config.DB_PORT,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 60,
      queueLimit: 1500,
      multipleStatements: true,
      dateStrings: true
    })
  } catch (err: any) {
    const code = ResponseCode.FAILED_DEPENDENCY
    logger.crit({ code, message: getResponseMessage(code), stack: err.stack })
  }
}

type queryParam =
  | string
  | number
  | Date
  | string[]
  | number[]
  | boolean
  | any[]
  | null

export const query = <T>(
  query: string,
  params: queryParam[] | queryParam[][],
  transaction: boolean = false
): Promise<T> => {
  try {
    if (!pool)
      throw new Error(
        'Pool was not created. Ensure pool is created when running the app.'
      )

    if (transaction) {
      query = `START TRANSACTION;
          ${query}
          COMMIT;
        `
    }

    return new Promise<T | any>((resolve, reject) => {
      pool.query(query, params, (error, results: any) => {
        if (error) reject(error)
        else {
          const headersExist = results[0] && results[0].fieldCount !== undefined
          if (headersExist) {
            results = results[results.length - 2]
          }

          resolve(results)
        }
      })
    })
  } catch (err: any) {
    const code = ResponseCode.FAILED_DEPENDENCY
    logger.error({ code, message: getResponseMessage(code), stack: err.stack })
    throw new Error('failed to execute MySQL query')
  }
}
