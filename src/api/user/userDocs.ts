const tags = [
  {
    name: 'User',
    description: 'Users related routes',
  },
]

const paths = {
  '/user': {
    get: {
      tags: ['User'],
      description: 'Get User object',
      responses: {
        '200': {
          description: 'Successfully Fetched User',
          content: {
            schema: {
              $ref: '#/definitions/get_user_response',
            },
          },
        },
      },
    },
  },
  '/user/{id}': {
    get: {
      tags: ['User'],
      description: 'Get User object',
      parameters: [
        {
          in: 'path',
          name: 'id',
          type: 'string',
          required: false,
          description: 'User ID',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully Fetched user profile',
          content: {
            schema: {
              $ref: '#/definitions/get_user_response',
            },
          },
        },
      },
    },
  },
  '/user/toogleNotifications': {
    get: {
      tags: ['User'],
      description: 'Tooggle notification permission',

      responses: {
        '200': {
          description: 'Succefully finished onboarding flow',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
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
  '404': {
    description: 'User not found',
    content: {
      schema: {
        $ref: '#/definitions/user_not_found_response',
      },
    },
  },
  '401_response': {
    example: {
      data: null,
      code: 401001,
      message: 'Invalid token',
    },
  },
  user_not_found_response: {
    example: {
      data: null,
      code: 404001,
      message: 'User not found',
    },
  },
  get_user_response: {
    example: {
      data: {
        user: {
          id: '7b653c2b-f7ff-4ea9-afb0-0111ae15ecfc',
          email: 'email@email.com',
          notifications: true,
          profilePictureFileName: null,
          createdAt: '2024-03-25T15:20:06.410Z',
          updatedAt: '2024-05-23T12:53:41.000Z',
        },
      },
      code: 200000,
      message: 'OK',
    },
  },
}

export const userDocs = { tags, paths, definitions }
