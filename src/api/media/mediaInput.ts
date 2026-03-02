import { Request } from 'express'
import Joi from 'joi'
import { MediaType } from '@prisma/client'
import { StorageProvider } from './interface'

/**
 * Media file name validation rule
 */
const mediaFileNameRule = Joi.string()
  .min(1)
  .max(255)
  .pattern(/^[a-zA-Z0-9._-]+$/)
  .trim()
  .messages({
    'string.min': 'Media file name is required',
    'string.max': 'Media file name must be at most 255 characters',
    'string.pattern.base': 'Media file name can only contain letters, numbers, dots, hyphens, and underscores'
  })

/**
 * Media type validation rule
 */
const mediaTypeRule = Joi.string()
  .valid(...Object.values(MediaType))
  .required()
  .messages({
    'any.only': 'Media type must be one of: IMAGE, VIDEO, AUDIO, DOCUMENT'
  })

/**
 * Storage provider validation rule
 */
const storageProviderRule = Joi.string()
  .valid(...Object.values(StorageProvider))
  .optional()
  .messages({
    'any.only': 'Storage provider must be one of: AWS_S3, GOOGLE_CLOUD, LOCAL'
  })

/**
 * Project ID validation rule
 */
const projectIdRule = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Project ID must be a valid UUID'
  })

/**
 * Media ID validation rule
 */
const mediaIdRule = Joi.string()
  .uuid()
  .required()
  .messages({
    'string.guid': 'Media ID must be a valid UUID'
  })

/**
 * Prefix validation rule for file listing
 */
const prefixRule = Joi.string()
  .max(255)
  .trim()
  .optional()
  .messages({
    'string.max': 'Prefix must be at most 255 characters'
  })

/**
 * Media file array validation rule
 */
const mediaFileRule = Joi.object({
  mediaFileName: mediaFileNameRule.required(),
  mediaType: mediaTypeRule,
  storageProvider: storageProviderRule
})

/**
 * Validation schema for getting upload URL
 */
export const getUploadURLSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule,
        storageProvider: storageProviderRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType,
      storageProvider: req.body.storageProvider
    }
  }
}

/**
 * Validation schema for S3 upload URL
 */
export const getS3UploadURLSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType
    }
  }
}

/**
 * Validation schema for completing S3 upload
 */
export const completeS3UploadSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        projectId: projectIdRule,
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule
      })
      .options({ abortEarly: false }),
    input: {
      projectId: req.params.projectId,
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType
    }
  }
}

/**
 * Validation schema for S3 download URL
 */
export const getS3DownloadURLSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required()
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.params.mediaFileName
    }
  }
}

/**
 * Validation schema for deleting S3 file
 */
export const deleteS3FileSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaId: mediaIdRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaId: req.params.mediaId
    }
  }
}

/**
 * Validation schema for getting S3 file metadata
 */
export const getS3FileMetadataSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required()
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.params.mediaFileName
    }
  }
}

/**
 * Validation schema for listing S3 files
 */
export const listS3FilesSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        prefix: prefixRule,
        maxKeys: Joi.number().integer().min(1).max(1000).optional()
      })
      .options({ abortEarly: false }),
    input: {
      prefix: req.query.prefix,
      maxKeys: req.query.maxKeys ? parseInt(req.query.maxKeys as string) : undefined
    }
  }
}

/**
 * Validation schema for GCS upload URL
 */
export const getGCSUploadURLSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType
    }
  }
}

/**
 * Validation schema for completing GCS upload
 */
export const completeGCSUploadSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        projectId: projectIdRule,
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule
      })
      .options({ abortEarly: false }),
    input: {
      projectId: req.params.projectId,
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType
    }
  }
}

/**
 * Validation schema for GCS download URL
 */
export const getGCSDownloadURLSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required()
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.params.mediaFileName
    }
  }
}

/**
 * Validation schema for deleting GCS file
 */
export const deleteGCSFileSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaId: mediaIdRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaId: req.params.mediaId
    }
  }
}

/**
 * Validation schema for uploading media (original unified endpoint)
 */
export const uploadMediaSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        projectId: projectIdRule,
        mediaFiles: Joi.array()
          .items(mediaFileRule)
          .min(1)
          .max(10)
          .required()
          .messages({
            'array.min': 'At least one media file is required',
            'array.max': 'Maximum 10 media files can be uploaded at once'
          })
      })
      .options({ abortEarly: false }),
    input: {
      projectId: req.params.projectId,
      mediaFiles: req.body.mediaFiles
    }
  }
}

/**
 * Validation schema for getting media by project
 */
export const getMediaByProjectSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        projectId: projectIdRule,
        mediaType: Joi.string()
          .valid(...Object.values(MediaType))
          .optional()
          .messages({
            'any.only': 'Media type must be one of: IMAGE, VIDEO'
          })
      })
      .options({ abortEarly: false }),
    input: {
      projectId: req.params.projectId,
      mediaType: req.query.mediaType
    }
  }
}

/**
 * Validation schema for downloading media
 */
export const downloadMediaSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required(),
        storageProvider: storageProviderRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.params.mediaFileName,
      storageProvider: req.query.storageProvider
    }
  }
}

/**
 * Validation schema for deleting media
 */
export const deleteMediaSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaId: mediaIdRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaId: req.params.mediaId
    }
  }
}

/**
 * Validation schema for updating media (overwriting existing files)
 */
export const updateMediaSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        mediaFileName: mediaFileNameRule.required(),
        mediaType: mediaTypeRule,
        storageProvider: storageProviderRule
      })
      .options({ abortEarly: false }),
    input: {
      mediaFileName: req.body.mediaFileName,
      mediaType: req.body.mediaType,
      storageProvider: req.body.storageProvider
    }
  }
}
