const tags = [
  {
    name: 'Media',
    description: 'Media file management routes for uploading, downloading, and managing video and image files. Supports both Google Cloud Storage and AWS S3 with dedicated endpoints for each provider.',
  },
]

const paths = {
  '/media/upload-url': {
    post: {
      tags: ['Media'],
      description: 'Generate a signed upload URL for any storage provider (AWS S3 or Google Cloud Storage). Provider can be specified in the request body.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFileName', 'mediaType'],
              properties: {
                mediaFileName: {
                  type: 'string',
                  description: 'Unique file name for the media',
                  example: 'tutorial-video.mp4',
                },
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                  description: 'Type of media file',
                },
                storageProvider: {
                  type: 'string',
                  enum: ['GOOGLE_CLOUD', 'AWS_S3'],
                  description: 'Storage provider to use (defaults to GOOGLE_CLOUD)',
                  example: 'AWS_S3',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Upload URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      uploadUrl: {
                        type: 'string',
                        description: 'Signed URL for uploading to the storage provider',
                      },
                      mediaFileName: { type: 'string' },
                      mediaType: { type: 'string' },
                      storageProvider: { type: 'string' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request - Invalid input data' },
        401: { description: 'Unauthorized - Authentication required' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/upload-url': {
    post: {
      tags: ['Media'],
      description: 'Generate a signed upload URL specifically for AWS S3 storage.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFileName', 'mediaType'],
              properties: {
                mediaFileName: {
                  type: 'string',
                  description: 'Unique file name for the media',
                  example: 'tutorial-video.mp4',
                },
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                  description: 'Type of media file',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'S3 upload URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      uploadUrl: {
                        type: 'string',
                        description: 'Signed URL for uploading to AWS S3',
                      },
                      mediaFileName: { type: 'string' },
                      mediaType: { type: 'string' },
                      storageProvider: { type: 'string', example: 'AWS_S3' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request - Invalid input data' },
        401: { description: 'Unauthorized - Authentication required' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/complete-upload/{projectId}': {
    post: {
      tags: ['Media'],
      description: 'Complete the S3 upload process by creating a media record in the database after successful file upload to S3.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the project to associate the media with',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFileName', 'mediaType'],
              properties: {
                mediaFileName: {
                  type: 'string',
                  description: 'File name that was uploaded to S3',
                  example: 'tutorial-video.mp4',
                },
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                  description: 'Type of media file',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'S3 upload completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      mediaFileName: { type: 'string' },
                      mediaType: { type: 'string' },
                      projectId: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      storageProvider: { type: 'string', example: 'AWS_S3' },
                      fileSize: { type: 'integer' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request - Invalid input data' },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'File not found in S3 or project not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/{mediaFileName}/download-url': {
    get: {
      tags: ['Media'],
      description: 'Generate a signed download URL for a file stored in AWS S3.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaFileName',
          required: true,
          schema: { type: 'string' },
          description: 'File name of the media to download from S3',
        },
      ],
      responses: {
        200: {
          description: 'S3 download URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      downloadUrl: {
                        type: 'string',
                        description: 'Signed URL for downloading the file from S3',
                      },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'Media file not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/{mediaId}': {
    delete: {
      tags: ['Media'],
      description: 'Delete a media file from both AWS S3 and the database.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the media to delete',
        },
      ],
      responses: {
        200: {
          description: 'S3 file deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'Media file not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/{mediaFileName}/metadata': {
    get: {
      tags: ['Media'],
      description: 'Get metadata for a file stored in AWS S3.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaFileName',
          required: true,
          schema: { type: 'string' },
          description: 'File name to get metadata for',
        },
      ],
      responses: {
        200: {
          description: 'S3 file metadata retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      size: { type: 'integer', description: 'File size in bytes' },
                      lastModified: { type: 'string', format: 'date-time' },
                      contentType: { type: 'string' },
                      etag: { type: 'string' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'File not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/s3/files': {
    get: {
      tags: ['Media'],
      description: 'List files in AWS S3 bucket with optional filtering.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'prefix',
          required: false,
          schema: { type: 'string' },
          description: 'Prefix to filter files by',
        },
        {
          in: 'query',
          name: 'maxKeys',
          required: false,
          schema: { type: 'integer' },
          description: 'Maximum number of files to return',
        },
      ],
      responses: {
        200: {
          description: 'S3 files listed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        key: { type: 'string' },
                        size: { type: 'integer' },
                        lastModified: { type: 'string', format: 'date-time' },
                        etag: { type: 'string' },
                        storageClass: { type: 'string' },
                      },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/gcs/upload-url': {
    post: {
      tags: ['Media'],
      description: 'Generate a signed upload URL specifically for Google Cloud Storage.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFileName', 'mediaType'],
              properties: {
                mediaFileName: {
                  type: 'string',
                  description: 'Unique file name for the media',
                  example: 'tutorial-video.mp4',
                },
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                  description: 'Type of media file',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'GCS upload URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      uploadUrl: {
                        type: 'string',
                        description: 'Signed URL for uploading to Google Cloud Storage',
                      },
                      mediaFileName: { type: 'string' },
                      mediaType: { type: 'string' },
                      storageProvider: { type: 'string', example: 'GOOGLE_CLOUD' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request - Invalid input data' },
        401: { description: 'Unauthorized - Authentication required' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/gcs/complete-upload/{projectId}': {
    post: {
      tags: ['Media'],
      description: 'Complete the GCS upload process by creating a media record in the database after successful file upload to Google Cloud Storage.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the project to associate the media with',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFileName', 'mediaType'],
              properties: {
                mediaFileName: {
                  type: 'string',
                  description: 'File name that was uploaded to Google Cloud Storage',
                  example: 'tutorial-video.mp4',
                },
                mediaType: {
                  type: 'string',
                  enum: ['IMAGE', 'VIDEO'],
                  description: 'Type of media file',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'GCS upload completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      mediaFileName: { type: 'string' },
                      mediaType: { type: 'string' },
                      projectId: { type: 'string', format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      storageProvider: { type: 'string', example: 'GOOGLE_CLOUD' },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        400: { description: 'Bad request - Invalid input data' },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'File not found in GCS or project not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/gcs/{mediaFileName}/download-url': {
    get: {
      tags: ['Media'],
      description: 'Generate a signed download URL for a file stored in Google Cloud Storage.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaFileName',
          required: true,
          schema: { type: 'string' },
          description: 'File name of the media to download from GCS',
        },
      ],
      responses: {
        200: {
          description: 'GCS download URL generated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      downloadUrl: {
                        type: 'string',
                        description: 'Signed URL for downloading the file from GCS',
                      },
                    },
                  },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'Media file not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/gcs/{mediaId}': {
    delete: {
      tags: ['Media'],
      description: 'Delete a media file from both Google Cloud Storage and the database.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the media to delete',
        },
      ],
      responses: {
        200: {
          description: 'GCS file deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        401: { description: 'Unauthorized - Authentication required' },
        404: { description: 'Media file not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
}

const schemas = {
  MediaFile: {
    type: 'object',
    required: ['mediaFileName', 'mediaType'],
    properties: {
      mediaFileName: {
        type: 'string',
        description: 'Unique file name for the media',
        example: 'tutorial-video.mp4',
      },
      mediaType: {
        type: 'string',
        enum: ['IMAGE', 'VIDEO'],
        description: 'Type of media file',
      },
      storageProvider: {
        type: 'string',
        enum: ['GOOGLE_CLOUD', 'AWS_S3'],
        description: 'Storage provider to use (defaults to GOOGLE_CLOUD)',
        example: 'AWS_S3',
      },
    },
  },
  MediaInfo: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      mediaFileName: { type: 'string' },
      mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
      projectId: { type: 'string', format: 'uuid' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  UploadResponse: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Signed URL for uploading to the storage provider',
      },
      mediaFileName: { type: 'string' },
      googleStorageCode: { type: 'number' },
      storageProvider: {
        type: 'string',
        enum: ['GOOGLE_CLOUD', 'AWS_S3'],
        description: 'Storage provider used',
      },
    },
  },
  DownloadResponse: {
    type: 'object',
    properties: {
      downloadUrl: {
        type: 'string',
        description: 'Signed URL for downloading the media file',
      },
    },
  },
  StorageProvider: {
    type: 'string',
    enum: ['GOOGLE_CLOUD', 'AWS_S3'],
    description: 'Available storage providers',
  },
}

export { tags, paths, schemas }

export const mediaDocs = {
  tags,
  paths,
  schemas,
}
