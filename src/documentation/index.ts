import _ from 'lodash'
import config from './../config'

export const APIDocumentation = {
  openapi: '3.0.1',
  info: {
    title: 'Journeys',
    description: 'Journeys API',
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
    languageDocs,
    barnahusDocs,
    masterAdminDocs,
    messageDocs,
    userDocs,
    adminDocs,
    authDocs,
    roomTranslationDocs,
    mediaDocs,
    aboutTranslationDocs,
    caseDocs,
    practitionerDocs,
    staffTranslationDocs,
    templateDocs,
    contentDocs,
    onboardingSectionDocs,
    (a: object, b: object) => {
      if (_.isArray(a)) {
        return a.concat(b)
      }
    }
  )
}
