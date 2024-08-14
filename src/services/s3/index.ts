import config from "../../config";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    DeleteObjectCommand,
  } from "@aws-sdk/client-s3"

const s3Config = config.NODE_ENV === 'dev' ? {
    credentials: {
        secretAccessKey: config.AWS_SECRET,
        accessKeyId: config.AWS_ACCESS_KEY
      },
      region: config.S3_REGION
} : {
  region: config.S3_REGION
}

const s3 = new S3Client(s3Config)

export const getUploadUrl = async (fileKey: string) => {
    const s3PutCommand = new PutObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: fileKey,
    })
    const url = await getSignedUrl(s3, s3PutCommand, {
      expiresIn: config.S3_URL_EXPIRES
    })

    return url
  }

  export  const getDownloadUrl = async (fileKey: string) => {
    const s3GetCommand = new GetObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: fileKey,
    })
    const url = await getSignedUrl(s3, s3GetCommand, {
        expiresIn: config.S3_URL_EXPIRES
    })

    return url
  }

  export  const getDeleteURL = async (fileKey: string) => {
    const s3DeleteCommand = new DeleteObjectCommand({
      Bucket: config.S3_BUCKET_NAME,
      Key: fileKey,
    })

    const url = await getSignedUrl(s3, s3DeleteCommand, {
        expiresIn: config.S3_URL_EXPIRES
    })

    return url
  }
