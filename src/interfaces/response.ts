export enum StatusCode {
  OK = 200,
  ACCEPTED = 202,
  FOUND = 302,
  CONFLICT = 409,
  FORBIDDEN = 403,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FAILED_DEPENDENCY = 424,
  SERVER_ERROR = 500,
  UNPROCESSABLE = 422,
  NOT_ACCEPTABLE = 406,
  RESOURCE_NOT_FOUND = 404,
  UNSUPPORTED_MEDIA_TYPE = 415,
  SERVICE_UNAVAILABLE = 503
}

export enum ResponseCode {
  OK = 20000,
  NO_CONTENT = 20400,
  INTEGRITY_CONSTRAINT_VIOLATION = 23000,
  DUPLICATE_REGISTRATION_UID = 20301,
  BAD_REQUEST = 40000,
  INVALID_INPUT = 40001,
  EMAIL_TAKEN = 40001,
  WRONG_PASSWORD = 40002,
  FILE_TOO_LARGE = 40003,
  UNAUTHORIZED = 40100,
  INVALID_TOKEN = 40101,
  SESSION_EXPIRED = 40102,
  INVALID_UID = 40104,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  FILE_NOT_FOUND = 40402,
  MESSAGE_NOT_FOUND=40403,
  CONFLICT = 40900,
  WRONG_INPUT_TYPE = 41500,
  WRONG_INPUT_PHOTO_TYPE = 41501,
  FAILED_DEPENDENCY = 42400,
  TOO_MANY_REQUESTS = 42900,
  SERVER_ERROR = 50000,
  BAD_GATEWAY = 50200,
  SERVICE_UNAVAILABLE = 50300
}

export enum ResponseMessage {
  OK = 'OK',
  NO_CONTENT = 'No content',
  INTEGRITY_CONSTRAINT_VIOLATION = 'Integrity constraint violation',
  DUPLICATE_REGISTRATION_UID = 'Registration UID already set',
  BAD_REQUEST = 'Bad request',
  INVALID_INPUT = 'Please check your input',
  EMAIL_TAKEN = 'Email is already in use',
  WRONG_PASSWORD = 'Incorrect password',
  FILE_TOO_LARGE = 'File too large',
  UNAUTHORIZED = 'Unauthorized',
  INVALID_TOKEN = 'Invalid token',
  SESSION_EXPIRED = 'Session expired',
  INVALID_UID = 'Invalid or expired UID',
  FORBIDDEN = 'Forbidden',
  NOT_FOUND = 'Resource not found',
  USER_NOT_FOUND = 'User not found',
  FILE_NOT_FOUND = 'File not found',
  MESSAGE_NOT_FOUND='Message not found',
  CONFLICT = 'Conflict',
  WRONG_INPUT_TYPE = 'Wrong input type',
  WRONG_INPUT_PHOTO_TYPE = 'Only .png, .jpg and .jpeg image format allowed',
  FAILED_DEPENDENCY = 'Failed dependency',
  TOO_MANY_REQUESTS = 'Too many requests',
  SERVER_ERROR = 'Internal server error',
  BAD_GATEWAY = 'Bad gateway',
  SERVICE_UNAVAILABLE = 'Service unavailable'
}
