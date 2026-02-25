const tags: object[] = []

const paths: object = {}

const definitions = {
  '200_response': {
    example: {
      data: null,
      code: 200000,
      message: 'Success',
    },
  },
  '204_response': {
    example: {
      data: null,
      code: 204000,
      message: 'No content',
    },
  },
  '403_response': {
    example: {
      data: null,
      code: 403000,
      message: 'Forbidden',
    },
  },
  '404_response': {
    example: {
      data: null,
      code: 404000,
      message: 'Resource not found',
    },
  },
}

export const genericDocs = { tags, paths, definitions }
