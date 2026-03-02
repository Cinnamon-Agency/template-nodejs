import { autoInjectable, singleton } from 'tsyringe'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ResponseCode } from '@common/response'
import config  from '@core/config'

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
  private s3Client: S3Client
  private bucket: string

  constructor() {
    this.s3Client = new S3Client({
      credentials: {
        accessKeyId: config.AWS_ACCESS_KEY,
        secretAccessKey: config.AWS_SECRET
      },
      region: config.AWS_REGION
    })
    this.bucket = config.AWS_S3_BUCKET
  }

  async getSignedUrl(fileName: string, operation: 'read' | 'write'): Promise<S3SignedUrlResponse> {
    try {
      let command
      const commonParams = {
        Bucket: this.bucket,
        Key: fileName
      }

      if (operation === 'write') {
        // For uploading, we use PutObjectCommand
        command = new PutObjectCommand({
          ...commonParams,
          ContentType: 'application/octet-stream'
        })
      } else {
        // For downloading, we use GetObjectCommand
        command = new GetObjectCommand(commonParams)
      }

      // Generate presigned URL
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 })

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
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileName
      })

      await this.s3Client.send(command)

      return { code: ResponseCode.OK }
    } catch (error) {
      console.error('S3 delete error:', error)
      return { code: ResponseCode.FAILED_DELETE }
    }
  }

  async uploadFile(fileName: string, buffer: Buffer, contentType: string): Promise<{ code: ResponseCode; location?: string }> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: buffer,
        ContentType: contentType
      })

      const result = await this.s3Client.send(command)

      return {
        code: ResponseCode.OK,
        location: `https://${this.bucket}.s3.${this.s3Client.config.region}.amazonaws.com/${fileName}`
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      return { code: ResponseCode.FAILED_INSERT }
    }
  }

  async getFileMetadata(fileName: string): Promise<{ code: ResponseCode; metadata?: any }> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: fileName
      })

      const result = await this.s3Client.send(command)

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
      const params: any = {
        Bucket: this.bucket,
        MaxKeys: maxKeys
      }

      if (prefix) {
        params.Prefix = prefix
      }

      const command = new ListObjectsV2Command(params)
      const result = await this.s3Client.send(command)

      const files = result.Contents?.map((item: any) => ({
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
      region: (this.s3Client.config.region as string) || 'us-east-1'
    }
  }
}
