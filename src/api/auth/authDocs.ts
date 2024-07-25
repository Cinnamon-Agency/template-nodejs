const tags = [
  {
    name: 'Auth',
    description: 'Authentication related routes'
  }
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
              $ref: '#/definitions/auth_login_body'
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Successfully logged in',
          content: {
            schema: {
              $ref: '#/definitions/auth_login_response'
            }
          }
        },
        '404': {
          description:
            'Given email is not linked to a user or password is incorrect',
          content: {
            schema: {
              $ref: '#/definitions/auth_login_response_404'
            }
          }
        }
      }
    }
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
              $ref: '#/definitions/refresh_token_response'
            }
          }
        },
        '401:40101': {
          description: 'Invalid token',
          content: {
            schema: {
              $ref: '#/definitions/401_response'
            }
          }
        },
        '401:40102': {
          description: 'Expired token',
          content: {
            schema: {
              $ref: '#/definitions/auth_expired_token_response'
            }
          }
        }
      }
    }
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
              $ref: '#/definitions/200_response'
            }
          }
        }
      }
    }
  }
}

const definitions = {
  '200_response': {
    example: {
      data: null,
      code: 200000,
      message: 'OK'
    }
  },
  '401_response': {
    example: {
      data: null,
      code: 401001,
      message: 'Invalid token'
    }
  },
  auth_login_response: {
    example: {
      data: {
        user: {
          id: '94104c89-e04a-41b6-9902-e19c723c1354'
        },
        accessToken:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcwOTczNDAzNH0.XIKDtSlSu4fMeeA0aT4rfipTTFTSoAbKKykQIUkp2vAFtb71PwLkQPrT3GkBpIZxWKwg2FWDeWfJuM3shUshjm2YV0MaLoIAbGbeRlXIwdlVEcSDykTriEMDJxBWL1Fo13YhGmJ0pnWJFwMztpwwXZ6RP1zSAYvTTj5l8TN8TdE4FH1XyTGjo-T1J2SnmA7_G4J1YueXafHvn9Nd863Ek3o2nMhvSOlL5d1dUsLLwaSL3AtdVYFFQ7gP4K31z_AstI0jFB_SXE0EikvEnnjc__we17A0j5u16p_r3nI5_aqRAan7UkGgw3nfGAz4qiXU9fjDfMfCgQRJkxTbCLHGQQ',
        refreshToken:
          'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwYTE1MmMyNS04YjY3LTQ1NWUtYTA2Yi03OTNlYTBjOTcwZjQiLCJpYXQiOjE3MDk3MzMxMzQsImV4cCI6MTcxMDMzNzkzNH0.ash2Qt6Bvmco72hEe2_HVtONamC9UMkVG2KLjjOsXPKl2GPG8Jx8tgykcnBkjRTLO22uFyBqHxzIsxcYBvb-5fA3GIbfqzvnRxrL26SvP6n23-lL0q0aFLmka_iFjOjanZGUTCLTmVVhmnYtNrlqiRNJ3adXN3iN3kPiKdgydQXO9LOgtIA48fq2SyC4_foU2uCxtU1ZDHwXOkamN6G9RO-GlOE3Q9KTHEblnuPMlCOGPcScVEDW_l13MO2vPETdkfitUyxo2_iMSBtTqUHhq57gp07dnni6xnJjcL6miwnS-uo-Npa5qz3F64JH2q28LGoUZ4SoiSZQgriZD1Xg8w',
        accessTokenExpiresAt: '2024-03-06T14:07:14.922Z',
        refreshTokenExpiresAt: '2024-03-13T13:52:14.681Z'
      },
      code: 200000,
      message: 'OK'
    }
  },
  auth_login_response_404: {
    example: {
      data: null,
      code: 400002,
      message: 'Wrong email or password'
    }
  },
  auth_login_body: {
    type: 'object',
    description:
      'Password is required if authType is UserPassword. If authType is Google, Facebook or LinkedIn, password should not be passed',
    properties: {
      email: {
        type: 'string',
        example: 'john.doe@email.com'
      },
      password: {
        type: 'string',
        example: 'Test123'
      },
      authType: {
        type: 'string',
        enum: ['Google', 'Facebook', 'LinkedIn', 'UserPassword']
      }
    },
    required: ['email', 'authType']
  },
  auth_expired_token_response: {
    example: {
      data: null,
      code: 401002,
      message: 'Session expired'
    }
  },
  refresh_token_response: {
    example: {
      data: {
        accessToken: 'ey...',
        refreshToken: 'ey...',
        accessTokenExpiresAt: '2024-01-08T12:34:21.497Z',
        refreshTokenExpiresAt: '2024-01-15T12:19:21.257Z'
      },
      code: 200000,
      message: 'OK'
    }
  },
  user_not_found_response: {
    example: {
      data: null,
      code: 404001,
      message: 'User not found'
    }
  }
}

export const authDocs = { tags, paths, definitions }
