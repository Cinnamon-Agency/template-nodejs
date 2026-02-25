const tags = [
  {
    name: 'Notification',
    description: 'Notifications related routes',
  },
]

const paths = {
  '/notification': {
    get: {
      tags: ['Notification'],
      description: 'Get notifications for user',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'unread',
          schema: {
            type: 'boolean',
          },
          required: false,
          description: 'If true fetch only unread messages',
        },
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
            default: 20,
            maximum: 100,
          },
          required: false,
          description: 'Number of notifications per page (default: 20, max: 100)',
        },
      ],
      responses: {
        '200': {
          description:
            'Successfully got list of notifications. Fetches 20 at once.',
          content: {
            schema: {
              $ref: '#/definitions/get_notifications_response',
            },
          },
        },
      },
    },
  },
  '/notification/{notificationId}': {
    put: {
      tags: ['Notification'],
      description: 'Update notification read status',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'notificationId',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Notification Id',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_read_status_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully updated read status of notification',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
      },
    },
    delete: {
      tags: ['Notification'],
      description: 'Delete notification',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'notificationId',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Notification Id',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully deleted notification',
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
  update_read_status_body: {
    example: {
      read: true,
    },
  },
  get_notifications_response: {
    example: {
      data: {
        items: [{}],
        pagination: {
          page: 1,
          perPage: 20,
          total: 1,
          totalPages: 1,
        },
      },
      code: 200000,
      message: 'Success',
    },
  },
  notification_not_found_response: {
    example: {
      data: null,
      code: 404016,
      message: 'Notification not found',
    },
  },
}

export const notificationDocs = { tags, paths, definitions }
