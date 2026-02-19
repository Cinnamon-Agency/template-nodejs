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
      description: 'Get list of projects',
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
      message: 'OK',
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
    example: {
      name: 'Project Song',
      description: 'Need guitar and drumms on rock song',
      mediaFiles: [
        {
          mediaType: 'Project cover image',
          mediaFileName: 'cover.jpg',
        },
        {
          mediaType: 'Project track preview',
          mediaFileName: 'preview.mp3',
        },
        {
          mediaType: 'Project other',
          mediaFileName: 'extra-file.mp3',
        },
      ],
    },
  },
  get_project_response: {
    example: {
      data: {
        project: {},
        code: 200000,
        message: 'OK',
      },
    },
  },
  get_projects_response: {
    example: {
      data: {
        projects: [{}, {}],
      },
      code: 200000,
      message: 'OK',
    },
  },
}

export const projectDocs = { tags, paths, definitions }
