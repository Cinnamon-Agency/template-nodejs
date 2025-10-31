import { Storage } from '@google-cloud/storage'
import config from '@core/config'
import { logger } from '@core/logger'
import { ResponseCode } from '@common'
import { getResponseMessage } from '@common'

let storageClientConfig = {}
if (config.NODE_ENV == 'local') {
  storageClientConfig = {
    projectId: config.GOOGLE_CLOUD_PROJECT_ID,
    keyFileName: config.GOOGLE_SERVICE_ACCOUNT_KEY_LOCATION,
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
      expires: Date.now() + 60 * 60 * 1000,
    })

    if (!url) {
      return { code: ResponseCode.GOOGLE_STORAGE_ERROR }
    }

    return { code, url }
  } catch (err: unknown) {
    logger.error({
      code,
      message: getResponseMessage(code),
      stack: err instanceof Error ? err.stack : undefined,
    })
    return {
      code: ResponseCode.GOOGLE_STORAGE_ERROR,
    }
  }
}
