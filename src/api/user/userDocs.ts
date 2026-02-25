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
      security: [{ bearerAuth: [] }],
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
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
          },
          required: true,
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
  '/user/toggleNotifications': {
    patch: {
      tags: ['User'],
      description: 'Toggle notification preference on/off',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successfully toggled notification preference',
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
          emailVerified: true,
          phoneNumber: null,
          phoneVerified: false,
          authType: 'USER_PASSWORD',
          notifications: true,
          profilePictureFileName: null,
          createdAt: '2024-03-25T15:20:06.410Z',
          updatedAt: '2024-05-23T12:53:41.000Z',
        },
      },
      code: 200000,
      message: 'Success',
    },
  },
}

export const userDocs = { tags, paths, definitions }
