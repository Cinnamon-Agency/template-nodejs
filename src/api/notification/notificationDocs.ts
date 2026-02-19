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
          name: 'numberOfFetched',
          schema: {
            type: 'integer',
          },
          required: true,
          description: 'Number of entities already fetched',
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
  update_read_status_body: {
    example: {
      read: true,
    },
  },
  get_notifications_response: {
    example: {
      data: {
        notifications: [{}],
        code: 200000,
        message: 'OK',
      },
    },
  },
  notification_not_found_response: {
    example: {
      data: null,
      code: 404003,
      message: 'Notification not found',
    },
  },
}

export const notificationDocs = { tags, paths, definitions }
