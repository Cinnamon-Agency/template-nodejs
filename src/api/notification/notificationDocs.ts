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
          type: 'boolean',
          required: false,
          description: 'If true fetch only unread messages',
        },
        {
          in: 'query',
          name: 'numberOfFetched',
          type: 'number',
          required: true,
          description: 'NUmber of entities already fetched',
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
          type: 'string',
          required: false,
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
          description: 'Succesfully updated read status of notification',
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
          type: 'string',
          required: false,
          description: 'Notification Id',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully Fetched default notifications',
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
  '404': {
    description: 'Notification not found',
    content: {
      schema: {
        $ref: '#/definitions/notification_not_found_response',
      },
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
