const tags = [
  {
    name: 'Auth',
    description: 'Authentication related routes',
  },
]

const paths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      description:
        'Register a new user. Mobile clients (with header x-client-type: mobile) receive tokens in response body. Web clients receive tokens as HTTP-only cookies.',
      parameters: [
        {
          in: 'header',
          name: 'x-client-type',
          schema: {
            type: 'string',
            enum: ['mobile'],
          },
          required: false,
          description:
            'Set to "mobile" for mobile clients to receive bearer tokens in response. Omit for web clients to use cookies.',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/auth_register_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/auth_register_response',
              },
            },
          },
        },
        '400': {
          description: 'User already registered',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_already_registered_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      description:
        'Login. Mobile clients (with header x-client-type: mobile) receive tokens in response body. Web clients receive tokens as HTTP-only cookies.',
      parameters: [
        {
          in: 'header',
          name: 'x-client-type',
          schema: {
            type: 'string',
            enum: ['mobile'],
          },
          required: false,
          description:
            'Set to "mobile" for mobile clients to receive bearer tokens in response. Omit for web clients to use cookies.',
        },
      ],
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
            'application/json': {
              schema: {
                $ref: '#/definitions/auth_login_response',
              },
            },
          },
        },
        '404': {
          description:
            'Given email is not linked to a user or password is incorrect',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/auth_login_response_404',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/refresh_token_response',
              },
            },
          },
        },
        '401:40101': {
          description: 'Invalid token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/401_response',
              },
            },
          },
        },
        '401:40102': {
          description: 'Expired token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/auth_expired_token_response',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '400': {
          description: 'Invalid UID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/invalid_uid_response',
              },
            },
          },
        },
        '404': {
          description: 'Verification UID not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/verification_uid_not_found_response',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_not_found_response',
              },
            },
          },
        },
        '401': {
          description: 'User already verified',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_already_verified_response',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - invalid or missing token',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/401_response',
              },
            },
          },
        },
        '424': {
          description: 'Failed to send SMS',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/failed_dependency_response',
              },
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '400': {
          description: 'Invalid verification code',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/invalid_code_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized or code expired',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/401_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/resendLoginCode': {
    post: {
      tags: ['Auth'],
      description:
        "Send a 4-digit login verification code to the user's email address",
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
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_not_found_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/verifyLoginCode': {
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
            'application/json': {
              schema: {
                $ref: '#/definitions/verify_login_code_response',
              },
            },
          },
        },
        '400': {
          description: 'Invalid login code',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/invalid_login_code_response',
              },
            },
          },
        },
        '401': {
          description: 'Login code expired',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/login_code_expired_response',
              },
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_not_found_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/password/forgot': {
    post: {
      tags: ['Auth'],
      description: 'Send password reset email to user',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/forgot_password_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Password reset email sent successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '404': {
          description: 'User not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/user_not_found_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/password/reset': {
    post: {
      tags: ['Auth'],
      description: 'Reset password with verification UID from email',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/reset_password_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Password reset successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '400': {
          description: 'Invalid UID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/invalid_uid_response',
              },
            },
          },
        },
        '404': {
          description: 'Verification UID not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/verification_uid_not_found_response',
              },
            },
          },
        },
      },
    },
  },
  '/auth/password/setNew': {
    post: {
      tags: ['Auth'],
      description: 'Set new password with verification UID (for first-time setup or expired password)',
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/set_new_password_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'New password set successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/200_response',
              },
            },
          },
        },
        '400': {
          description: 'Invalid UID',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/invalid_uid_response',
              },
            },
          },
        },
        '404': {
          description: 'Verification UID not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/verification_uid_not_found_response',
              },
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
        tokens: {
          accessToken:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcwOTczNDAzNH0.XIKDtSlSu4fMeeA0aT4rfipTTFTSoAbKKykQIUkp2vAFtb71PwLkQPrT3GkBpIZxWKwg2FWDeWfJuM3shUshjm2YV0MaLoIAbGbeRlXIwdlVEcSDykTriEMDJxBWL1Fo13YhGmJ0pnWJFwMztpwwXZ6RP1zSAYvTTj5l8TN8TdE4FH1XyTGjo-T1J2SnmA7_G4J1YueXafHvn9Nd863Ek3o2nMhvSOlL5d1dUsLLwaSL3AtdVYFFQ7gP4K31z_AstI0jFB_SXE0EikvEnnjc__we17A0j5u16p_r3nI5_aqRAan7UkGgw3nfGAz4qiXU9fjDfMfCgQRJkxTbCLHGQQ',
          refreshToken:
            'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcxMDMzNzkzNH0.ash2Qt6Bvmco72hEe2_HVtONamC9UMkVG2KLjjOsXPKl2GPG8Jx8tgykcnBkjRTLO22uFyBqHxzIsxcYBvb-5fA3GIbfqzvnRxrL26SvP6n23-lL0q0aFLmka_iFjOjanZGUTCLTmVVhmnYtNrlqiRNJ3adXN3iN3kPiKdgydQXO9LOgtIA48fq2SyC4_foU2uCxtU1ZDHwXOkamN6G9RO-GlOE3Q9KTHEblnuPMlCOGPcScVEDW_l13MO2vPETdkfitUyxo2_iMSBtTqUHhq57gp07dnni6xnJjcL6miwnS-uo-Npa5qz3F64JH2q28LGoUZ4SoiSZQgriZD1Xg8w',
          accessTokenExpiresAt: '2024-03-06T14:07:14.922Z',
          refreshTokenExpiresAt: '2024-03-13T13:52:14.681Z',
        },
      },
      code: 200000,
      message: 'OK',
    },
    description:
      'For mobile clients (x-client-type: mobile), tokens are returned in response body. For web clients, tokens are set as HTTP-only cookies and not included in response body.',
  },
  auth_login_response_404: {
    example: {
      data: null,
      code: 400002,
      message: 'Wrong email or password',
    },
  },
  auth_register_body: {
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
  auth_register_response: {
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
      },
      code: 200000,
      message: 'OK',
    },
    description:
      'For mobile clients (x-client-type: mobile), tokens are returned in response body. For web clients, tokens are set as HTTP-only cookies and not included in response body.',
  },
  user_already_registered_response: {
    example: {
      data: null,
      code: 400003,
      message: 'User already registered',
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
        deviceToken: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
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
  forgot_password_body: {
    type: 'object',
    description: 'Request body for sending password reset email',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'john.doe@email.com',
        description: 'User email address to send password reset link to',
      },
    },
    required: ['email'],
  },
  reset_password_body: {
    type: 'object',
    description: 'Request body for resetting password with verification UID',
    properties: {
      uid: {
        type: 'string',
        example: '94104c89-e04a-41b6-9902-e19c723c1354/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'Verification UID received in password reset email (format: uuid1/uuid2)',
      },
      password: {
        type: 'string',
        example: 'NewPassword123',
        description: 'New password (8-24 characters, must contain uppercase, lowercase, and digit)',
        minLength: 8,
        maxLength: 24,
      },
    },
    required: ['uid', 'password'],
  },
  set_new_password_body: {
    type: 'object',
    description: 'Request body for setting new password with verification UID (for first-time setup)',
    properties: {
      uid: {
        type: 'string',
        example: '94104c89-e04a-41b6-9902-e19c723c1354/a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        description: 'Verification UID received in email (format: uuid1/uuid2)',
      },
      password: {
        type: 'string',
        example: 'NewPassword123',
        description: 'New password (8-24 characters, must contain uppercase, lowercase, and digit)',
        minLength: 8,
        maxLength: 24,
      },
    },
    required: ['uid', 'password'],
  },
}

export const authDocs = { tags, paths, definitions }
