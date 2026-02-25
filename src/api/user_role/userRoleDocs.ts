const tags = [
  {
    name: 'User Role',
    description: 'User Role related routes',
  },
]

const paths = {
  '/user_role': {
    put: {
      tags: ['User Role'],
      summary: 'Get all user roles for user',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successfully fetched user roles for user',
          content: {
            schema: {
              $ref: '#/definitions/get_user_roles_response',
            },
          },
        },
      },
    },
  },
}

const definitions = {
  get_user_roles_response: {
    example: {
      data: {
        roles: [
          {
            id: '7b653c2b-f7ff-4ea9-afb0-0111ae15ecfc',
            name: 'USER',
          },
        ],
      },
      code: 200000,
      message: 'Success',
    },
  },
}

export const userRoleDocs = { tags, paths, definitions }
