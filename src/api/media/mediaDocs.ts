const tags = [
  {
    name: 'Media',
    description: 'Media file management routes for uploading, downloading, and managing video and image files',
  },
]

const paths = {
  '/media/projects/{projectId}/media': {
    post: {
      tags: ['Media'],
      description: 'Upload media files (images and videos) to a project. Returns signed URLs for uploading to Google Cloud Storage.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the project to upload media to',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mediaFiles'],
              properties: {
                mediaFiles: {
                  type: 'array',
                  items: {
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
          },
        },
      },
      responses: {
        201: {
          description: 'Media upload URLs generated successfully',
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
                        url: {
                          type: 'string',
                          description: 'Signed URL for uploading to Google Cloud Storage',
                        },
                        mediaFileName: { type: 'string' },
                        googleStorageCode: { type: 'number' },
                      },
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
        404: { description: 'Project not found' },
        500: { description: 'Internal server error' },
      },
    },
    get: {
      tags: ['Media'],
      description: 'Retrieve all media files for a project. Can filter by media type (IMAGE or VIDEO).',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'projectId',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID of the project',
        },
        {
          in: 'query',
          name: 'mediaType',
          required: false,
          schema: {
            type: 'string',
            enum: ['IMAGE', 'VIDEO'],
          },
          description: 'Filter media by type (optional)',
        },
      ],
      responses: {
        200: {
          description: 'Media files retrieved successfully',
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
                        id: { type: 'string', format: 'uuid' },
                        mediaFileName: { type: 'string' },
                        mediaType: { type: 'string', enum: ['IMAGE', 'VIDEO'] },
                        projectId: { type: 'string', format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
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
        404: { description: 'Project not found' },
        500: { description: 'Internal server error' },
      },
    },
  },
  '/media/media/{mediaFileName}/download': {
    get: {
      tags: ['Media'],
      description: 'Generate a signed download URL for a media file. URL expires after a limited time.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'mediaFileName',
          required: true,
          schema: { type: 'string' },
          description: 'File name of the media to download',
        },
      ],
      responses: {
        200: {
          description: 'Download URL generated successfully',
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
                        description: 'Signed URL for downloading the media file',
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
  '/media/media/{mediaId}': {
    delete: {
      tags: ['Media'],
      description: 'Delete a media file from the project and Google Cloud Storage.',
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
          description: 'Media deleted successfully',
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
        description: 'Signed URL for uploading to Google Cloud Storage',
      },
      mediaFileName: { type: 'string' },
      googleStorageCode: { type: 'number' },
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
}

export { tags, paths, schemas }

export const mediaDocs = {
  tags,
  paths,
  schemas,
}
