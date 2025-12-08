const tags = [
  {
    name: 'Contact Support',
    description: 'Contact Support related routes',
  },
]

const paths = {
  '/api/v2/supportRequest': {
    post: {
      tags: ['Contact Support'],
      summary: 'Create new support Request',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_support_request_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Succefully created contact Support ticket',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
      },
    },
  },
  '/api/v2/supportRequest/updateStatus/{supportRequestId}': {
    put: {
      tags: ['Contact Support'],
      summary: 'Update contact Support status',
      parameters: [
        {
          in: 'path',
          name: 'supportRequestId',
          type: 'string',
          required: true,
          description: 'contact support ID',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_support_request_status_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Succefully updated contact Support',
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
  create_support_request_body: {
    properties: {
      firstName: {
        type: 'string',
        description: 'The first name of the contact support',
      },
      lastName: {
        type: 'string',
        description: 'The last name of the contact support',
      },
      email: {
        type: 'string',
        description: 'The email of the contact support',
      },
      subject: {
        type: 'string',
        description: 'The subject of the contact support',
      },
      message: {
        type: 'string',
        description: 'The message of the contact support',
      },
    },
    required: ['firstName', 'lastName', 'email', 'subject', 'message'],
  },
  update_support_request_status_body: {
    properties: {
      status: {
        type: 'string',
        description: 'The status of the contact support',
      },
      enum: ['OPEN', 'CLOSED'],
    },
    required: ['status'],
  },
}

export const supportRequestDocs = { tags, paths, definitions }
