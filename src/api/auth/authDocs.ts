const tags = [
  {
    name: 'Auth',
    description: 'Authentication related routes',
  },
]

const paths = {
  '/auth/login': {
    post: {
      tags: ['Auth'],
      description: 'Login.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/auth_login_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully logged in',
          content: {
            schema: {
              $ref: '#/definitions/auth_login_response',
            },
          },
        },
        '404': {
          description:
            'Given email is not linked to a user or password is incorrect',
          content: {
            schema: {
              $ref: '#/definitions/auth_login_response_404',
            },
          },
        },
      },
    },
  },
  '/auth/refresh': {
    post: {
      tags: ['Auth'],
      description: 'Refresh access token',
      responses: {
        '200': {
          description: 'Successfully refreshed access token',
          content: {
            schema: {
              $ref: '#/definitions/refresh_token_response',
            },
          },
        },
        '401:40101': {
          description: 'Invalid token',
          content: {
            schema: {
              $ref: '#/definitions/401_response',
            },
          },
        },
        '401:40102': {
          description: 'Expired token',
          content: {
            schema: {
              $ref: '#/definitions/auth_expired_token_response',
            },
          },
        },
      },
    },
  },
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      description: 'Logout user',
      responses: {
        '200': {
          description: 'Successfully logged out user',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
      },
    },
  },
  '/auth/verify-email': {
    post: {
      tags: ['Auth'],
      description: 'Verify user email address with UID from verification email',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/verify_email_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Email successfully verified',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
        '400': {
          description: 'Invalid UID',
          content: {
            schema: {
              $ref: '#/definitions/invalid_uid_response',
            },
          },
        },
        '404': {
          description: 'Verification UID not found',
          content: {
            schema: {
              $ref: '#/definitions/verification_uid_not_found_response',
            },
          },
        },
      },
    },
  },
  '/auth/resend-verification-email': {
    post: {
      tags: ['Auth'],
      description: 'Resend email verification link',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/resend_verification_email_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Verification email sent successfully',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            schema: {
              $ref: '#/definitions/user_not_found_response',
            },
          },
        },
        '401': {
          description: 'User already verified',
          content: {
            schema: {
              $ref: '#/definitions/user_already_verified_response',
            },
          },
        },
      },
    },
  },
  '/auth/send-phone-verification': {
    post: {
      tags: ['Auth'],
      description:
        'Send SMS verification code to phone number (requires authentication)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/send_phone_verification_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Verification code sent successfully',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized - invalid or missing token',
          content: {
            schema: {
              $ref: '#/definitions/401_response',
            },
          },
        },
        '424': {
          description: 'Failed to send SMS',
          content: {
            schema: {
              $ref: '#/definitions/failed_dependency_response',
            },
          },
        },
      },
    },
  },
  '/auth/verify-phone': {
    post: {
      tags: ['Auth'],
      description:
        'Verify phone number with SMS code (requires authentication)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/verify_phone_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Phone number verified successfully',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
        '400': {
          description: 'Invalid verification code',
          content: {
            schema: {
              $ref: '#/definitions/invalid_code_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized or code expired',
          content: {
            schema: {
              $ref: '#/definitions/401_response',
            },
          },
        },
      },
    },
  },
  '/auth/resend-login-code': {
    post: {
      tags: ['Auth'],
      description:
        'Send a 4-digit login verification code to the user\'s email address',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/resend_login_code_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login code sent successfully',
          content: {
            schema: {
              $ref: '#/definitions/200_response',
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            schema: {
              $ref: '#/definitions/user_not_found_response',
            },
          },
        },
      },
    },
  },
  '/auth/verify-login-code': {
    post: {
      tags: ['Auth'],
      description:
        'Verify login code and authenticate user. Optionally enable "Don\'t ask on this device" for trusted devices.',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/verify_login_code_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login code verified successfully',
          content: {
            schema: {
              $ref: '#/definitions/verify_login_code_response',
            },
          },
        },
        '400': {
          description: 'Invalid login code',
          content: {
            schema: {
              $ref: '#/definitions/invalid_login_code_response',
            },
          },
        },
        '401': {
          description: 'Login code expired',
          content: {
            schema: {
              $ref: '#/definitions/login_code_expired_response',
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            schema: {
              $ref: '#/definitions/user_not_found_response',
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
  auth_login_response: {
    example: {
      data: {
        user: {
          id: '94104c89-e04a-41b6-9902-e19c723c1354',
        },
        accessToken:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcwOTczNDAzNH0.XIKDtSlSu4fMeeA0aT4rfipTTFTSoAbKKykQIUkp2vAFtb71PwLkQPrT3GkBpIZxWKwg2FWDeWfJuM3shUshjm2YV0MaLoIAbGbeRlXIwdlVEcSDykTriEMDJxBWL1Fo13YhGmJ0pnWJFwMztpwwXZ6RP1zSAYvTTj5l8TN8TdE4FH1XyTGjo-T1J2SnmA7_G4J1YueXafHvn9Nd863Ek3o2nMhvSOlL5d1dUsLLwaSL3AtdVYFFQ7gP4K31z_AstI0jFB_SXE0EikvEnnjc__we17A0j5u16p_r3nI5_aqRAan7UkGgw3nfGAz4qiXU9fjDfMfCgQRJkxTbCLHGQQ',
        refreshToken:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcxMDMzNzkzNH0.ash2Qt6Bvmco72hEe2_HVtONamC9UMkVG2KLjjOsXPKl2GPG8Jx8tgykcnBkjRTLO22uFyBqHxzIsxcYBvb-5fA3GIbfqzvnRxrL26SvP6n23-lL0q0aFLmka_iFjOjanZGUTCLTmVVhmnYtNrlqiRNJ3adXN3iN3kPiKdgydQXO9LOgtIA48fq2SyC4_foU2uCxtU1ZDHwXOkamN6G9RO-GlOE3Q9KTHEblnuPMlCOGPcScVEDW_l13MO2vPETdkfitUyxo2_iMSBtTqUHhq57gp07dnni6xnJjcL6miwnS-uo-Npa5qz3F64JH2q28LGoUZ4SoiSZQgriZD1Xg8w',
        accessTokenExpiresAt: '2024-03-06T14:07:14.922Z',
        refreshTokenExpiresAt: '2024-03-13T13:52:14.681Z',
      },
      code: 200000,
      message: 'OK',
    },
  },
  auth_login_response_404: {
    example: {
      data: null,
      code: 400002,
      message: 'Wrong email or password',
    },
  },
  auth_login_body: {
    type: 'object',
    description:
      'Password is required if authType is UserPassword. If authType is Google, Facebook or LinkedIn, password should not be passed',
    properties: {
      email: {
        type: 'string',
        example: 'john.doe@email.com',
      },
      password: {
        type: 'string',
        example: 'Test123',
      },
      authType: {
        type: 'string',
        enum: ['Google', 'Facebook', 'LinkedIn', 'UserPassword'],
      },
    },
    required: ['email', 'authType'],
  },
  auth_expired_token_response: {
    example: {
      data: null,
      code: 401002,
      message: 'Session expired',
    },
  },
  refresh_token_response: {
    example: {
      data: {
        accessToken: 'ey...',
        refreshToken: 'ey...',
        accessTokenExpiresAt: '2024-01-08T12:34:21.497Z',
        refreshTokenExpiresAt: '2024-01-15T12:19:21.257Z',
      },
      code: 200000,
      message: 'OK',
    },
  },
  user_not_found_response: {
    example: {
      data: null,
      code: 404001,
      message: 'User not found',
    },
  },
  verify_email_body: {
    type: 'object',
    description:
      'UID format: uuid1/uuid2 (received from verification email link)',
    properties: {
      uid: {
        type: 'string',
        example:
          '94104c89-e04a-41b6-9902-e19c723c1354/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      },
    },
    required: ['uid'],
  },
  resend_verification_email_body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@email.com',
      },
    },
    required: ['email'],
  },
  send_phone_verification_body: {
    type: 'object',
    description: 'Phone number in E.164 format (e.g., +1234567890)',
    properties: {
      phoneNumber: {
        type: 'string',
        example: '+1234567890',
      },
    },
    required: ['phoneNumber'],
  },
  verify_phone_body: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        pattern: '^\\d{6}$',
        example: '123456',
        description: '6-digit verification code received via SMS',
      },
    },
    required: ['code'],
  },
  invalid_uid_response: {
    example: {
      data: null,
      code: 400002,
      message: 'Invalid UID',
    },
  },
  verification_uid_not_found_response: {
    example: {
      data: null,
      code: 404002,
      message: 'Verification UID not found',
    },
  },
  user_already_verified_response: {
    example: {
      data: null,
      code: 401405,
      message: 'User already onboarded',
    },
  },
  invalid_code_response: {
    example: {
      data: null,
      code: 400001,
      message: 'Invalid input',
    },
  },
  failed_dependency_response: {
    example: {
      data: null,
      code: 424000,
      message: 'Failed dependency',
    },
  },
  resend_login_code_body: {
    type: 'object',
    description: 'Request body for sending a login verification code',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@email.com',
        description: 'User email address to send the login code to',
      },
    },
    required: ['email'],
  },
  verify_login_code_body: {
    type: 'object',
    description:
      'Request body for verifying login code. Set dontAskOnThisDevice to true to mark this device as trusted for 30 days.',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@email.com',
        description: 'User email address',
      },
      loginCode: {
        type: 'string',
        pattern: '^\\d{4}$',
        example: '1234',
        description: '4-digit verification code received via email',
      },
      dontAskOnThisDevice: {
        type: 'boolean',
        example: false,
        description:
          'Optional: Set to true to remember this device for 30 days and skip login code verification',
      },
    },
    required: ['email', 'loginCode'],
  },
  verify_login_code_response: {
    example: {
      data: {
        user: {
          id: '94104c89-e04a-41b6-9902-e19c723c1354',
        },
        tokens: {
          accessToken:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcwOTczNDAzNH0...',
          refreshToken:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcxMDMzNzkzNH0...',
          accessTokenExpiresAt: '2024-03-06T14:07:14.922Z',
          refreshTokenExpiresAt: '2024-03-13T13:52:14.681Z',
        },
        deviceToken:
          'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      },
      code: 200000,
      message: 'OK',
    },
    description:
      'Returns user data, authentication tokens (for mobile clients), and device token (if dontAskOnThisDevice was true). Web clients receive tokens as HTTP-only cookies.',
  },
  invalid_login_code_response: {
    example: {
      data: null,
      code: 400001,
      message: 'Invalid input',
    },
  },
  login_code_expired_response: {
    example: {
      data: null,
      code: 401002,
      message: 'Session expired',
    },
  },
}

export const authDocs = { tags, paths, definitions }
