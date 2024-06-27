import _ from 'lodash'
import { authDocs } from '../api/auth/authDocs'
import { userDocs } from '../api/user/userDocs'
import config from './../config'
import { projectDocs } from '../api/project/projectDocs'
import { notificationDocs } from '../api/notification/notificationDocs'

export const APIDocumentation = {
  openapi: '3.0.1',
  info: {
    title: config.PROJECT_NAME,
    description: `${config.PROJECT_NAME} API`,
    version: '0.1'
  },
  basePath: '/',
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  servers: [
    {
      url: config.API_BASE_URL
    }
  ],
  ..._.mergeWith(
    authDocs,
    userDocs,
    projectDocs,
    notificationDocs,
    (a: object, b: object) => {
      if (_.isArray(a)) {
        return a.concat(b)
      }
    }
  )
}
