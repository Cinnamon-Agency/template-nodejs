const tags = [
  {
    name: 'Project',
    description: 'Projects related routes',
  },
]

const paths = {
  '/project': {
    post: {
      tags: ['Project'],
      description: 'Create new project',
      security: [{ bearerAuth: [] }],
      requestBody: {
        description: 'File size should be in bytes',
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_project_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully created project',
          content: {
            schema: {
              $ref: '#/definitions/create_project_response',
            },
          },
        },
      },
    },
    get: {
      tags: ['Project'],
      description: 'Get list of projects (paginated)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
          },
          required: false,
          description: 'Page number (default: 1)',
        },
        {
          in: 'query',
          name: 'perPage',
          schema: {
            type: 'integer',
            default: 10,
            maximum: 100,
          },
          required: false,
          description: 'Number of projects per page (default: 10, max: 100)',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully fetched projects',
          content: {
            schema: {
              $ref: '#/definitions/get_projects_response',
            },
          },
        },
      },
    },
  },
  '/project/{id}': {
    get: {
      tags: ['Project'],
      description: 'Get project by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Project ID',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully fetched project',
          content: {
            schema: {
              $ref: '#/definitions/get_project_response',
            },
          },
        },
        '404': {
          description: 'Project not found',
          content: {
            schema: {
              $ref: '#/definitions/project_not_found_response',
            },
          },
        },
      },
    },
  },
}

const definitions = {
  '200_response': {
    example: {
      data: null,
      code: 200000,
      message: 'Success',
    },
  },
  '401_response': {
    example: {
      data: null,
      code: 401001,
      message: 'Invalid token',
    },
  },
  project_not_found_response: {
    example: {
      data: null,
      code: 404015,
      message: 'Project not found',
    },
  },
  create_project_response: {
    example: {
      data: {
        mediaInfo: [
          {
            url: 'www.someURl.com?data=lflsdf',
            mediaFileName: 'cover.jpg',
            googleStorageCode: 200000,
          },
          {
            url: undefined,
            mediaFileName: 'song.mp3',
            googleStorageCode: 402001,
          },
        ],
      },
      code: 200000,
      message: 'OK',
    },
  },
  create_project_body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Project Song',
      },
      description: {
        type: 'string',
        example: 'Need guitar and drums on rock song',
      },
      deadline: {
        type: 'string',
        format: 'date-time',
        example: '2025-06-01T00:00:00.000Z',
      },
      mediaFiles: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            mediaType: {
              type: 'string',
              example: 'IMAGE',
            },
            mediaFileName: {
              type: 'string',
              example: 'cover.jpg',
            },
          },
          required: ['mediaType', 'mediaFileName'],
        },
      },
    },
    required: ['name', 'description', 'deadline', 'mediaFiles'],
  },
  get_project_response: {
    example: {
      data: {
        project: {},
      },
      code: 200000,
      message: 'Success',
    },
  },
  get_projects_response: {
    example: {
      data: {
        items: [{}, {}],
        pagination: {
          page: 1,
          perPage: 10,
          total: 2,
          totalPages: 1,
        },
      },
      code: 200000,
      message: 'Success',
    },
  },
}

export const projectDocs = { tags, paths, definitions }
