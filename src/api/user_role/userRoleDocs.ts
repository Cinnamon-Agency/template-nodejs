const tags = [
  {
    name: 'User Role',
    description: 'User Role related routes',
  },
]

const paths = {
  '/api/v2/userRole': {
    get: {
      tags: ['User Role'],
      summary: 'Get all user roles for user',
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
            id: 1,
            name: 'Provider',
          },
        ],
      },
      code: 200000,
      message: 'OK',
    },
  },
}

export const userRoleDocs = { tags, paths, definitions }
