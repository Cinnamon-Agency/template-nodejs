import _ from 'lodash'
import { authDocs } from '@api/auth/authDocs'
import { userDocs } from '@api/user/userDocs'
import config from '@core/config'
import { projectDocs } from '@api/project/projectDocs'
import { notificationDocs } from '@api/notification/notificationDocs'
import { supportRequestDocs } from '@api/support_request/supportRequestDocs'
import { userRoleDocs } from '@api/user_role/userRoleDocs'
import { genericDocs } from './genericDocs'

export const APIDocumentation = {
  openapi: '3.0.1',
  info: {
    title: config.PROJECT_NAME,
    description: `${config.PROJECT_NAME} API`,
    version: '0.1',
  },
  basePath: '/',
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  servers: [
    {
      url: `${config.API_BASE_URL}/api/v1`,
    },
  ],
  ..._.mergeWith(
    genericDocs,
    authDocs,
    userDocs,
    projectDocs,
    notificationDocs,
    supportRequestDocs,
    userRoleDocs,
    (a: object, b: object) => {
      if (_.isArray(a)) {
        return a.concat(b)
      }
    }
  ),
}

export * from './router'
