import { autoInjectable, singleton } from 'tsyringe'
import AWS from 'aws-sdk'
import { ResponseCode } from '@common/response'

export interface S3Config {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucket: string
}

export interface S3SignedUrlResponse {
  url: string
  code: ResponseCode
}

@singleton()
@autoInjectable()
export class S3Service {
  private s3: AWS.S3
  private bucket: string

  constructor() {
    const config: S3Config = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || ''
    }

    this.s3 = new AWS.S3({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      region: config.region
    })
    this.bucket = config.bucket
  }

  async getSignedUrl(fileName: string, operation: 'read' | 'write'): Promise<S3SignedUrlResponse> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: fileName,
        Expires: 3600 // URL expires in 1 hour
      }

      let url: string

      if (operation === 'write') {
        // For uploading, we need a presigned POST URL
        url = this.s3.getSignedUrl('putObject', {
          ...params,
          ContentType: 'application/octet-stream'
        })
      } else {
        // For downloading, we need a presigned GET URL
        url = this.s3.getSignedUrl('getObject', params)
      }

      return {
        url,
        code: ResponseCode.OK
      }
    } catch (error) {
      console.error('S3 signed URL generation error:', error)
      return {
        url: '',
        code: ResponseCode.SERVER_ERROR
      }
    }
  }

  async deleteFile(fileName: string): Promise<{ code: ResponseCode }> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: fileName
      }).promise()

      return { code: ResponseCode.OK }
    } catch (error) {
      console.error('S3 delete error:', error)
      return { code: ResponseCode.FAILED_DELETE }
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<{ code: ResponseCode; location?: string }> {
    try {
      const result = await this.s3.upload({
        Bucket: this.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType
      }).promise()

      return {
        code: ResponseCode.OK,
        location: result.Location
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      return { code: ResponseCode.FAILED_INSERT }
    }
  }

  async getFileMetadata(fileName: string): Promise<{ code: ResponseCode; metadata?: any }> {
    try {
      const result = await this.s3.headObject({
        Bucket: this.bucket,
        Key: fileName
      }).promise()

      return {
        code: ResponseCode.OK,
        metadata: {
          size: result.ContentLength,
          lastModified: result.LastModified,
          contentType: result.ContentType,
          etag: result.ETag
        }
      }
    } catch (error) {
      console.error('S3 metadata error:', error)
      return { code: ResponseCode.NOT_FOUND }
    }
  }

  async listFiles(prefix?: string, maxKeys = 1000): Promise<{ code: ResponseCode; files?: any[] }> {
    try {
      const params: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        MaxKeys: maxKeys
      }

      if (prefix) {
        params.Prefix = prefix
      }

      const result = await this.s3.listObjectsV2(params).promise()

      const files = result.Contents?.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
        storageClass: item.StorageClass
      })) || []

      return {
        code: ResponseCode.OK,
        files
      }
    } catch (error) {
      console.error('S3 list error:', error)
      return { code: ResponseCode.SERVER_ERROR }
    }
  }

  getBucketInfo(): { bucket: string; region: string } {
    return {
      bucket: this.bucket,
      region: this.s3.config.region || 'us-east-1'
    }
  }
}
