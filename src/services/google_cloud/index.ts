import { Storage } from '@google-cloud/storage'
import config from '../../config'
import { logger } from '../../logger'
import { ResponseCode } from '../../interface'
import { getResponseMessage } from '../utils'

let storageClientConfig = {}
if (config.NODE_ENV == 'local') {
  storageClientConfig = {
    projectId: 'barnahus',
    keyFileName: config.GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION
  }
}

const storageClient = new Storage(storageClientConfig)

export const getSignedURL = async (name: string, action: 'read' | 'write') => {
  const code: ResponseCode = ResponseCode.OK
  try {
    const gcs = storageClient.bucket(config.GOOGLE_CLOUD_STORAGE_BUCKET_NAME)
    const [url] = await gcs.file(name).getSignedUrl({
      version: 'v4',
      action,
      expires: Date.now() + 60 * 60 * 1000
    })

    if (!url) {
      return { code: ResponseCode.GOOGLE_STORAGE_ERROR }
    }

    return { code, url }
  } catch (err: any) {
    logger.error({
      code,
      message: getResponseMessage(code),
      stack: err.stack
    })
    return {
      code: ResponseCode.GOOGLE_STORAGE_ERROR
    }
  }
}
