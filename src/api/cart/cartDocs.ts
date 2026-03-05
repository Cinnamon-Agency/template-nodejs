const tags = [
  {
    name: 'Cart',
    description: 'Shopping cart related routes',
  },
]

const paths = {
  '/cart': {
    get: {
      tags: ['Cart'],
      description: 'Get current user cart with items and summary',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Successfully retrieved cart',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/get_cart_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Cart'],
      description: 'Clear all items from cart',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Cart cleared successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/clear_cart_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
      },
    },
  },
  '/cart/items': {
    post: {
      tags: ['Cart'],
      description: 'Add product to cart',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/add_to_cart_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Product added to cart successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/cart_operation_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - invalid input or product not available',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '409': {
          description: 'Conflict - insufficient stock available',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
      },
    },
  },
  '/cart/items/{productId}': {
    put: {
      tags: ['Cart'],
      description: 'Update cart item quantity',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'productId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
          description: 'Product UUID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_cart_item_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Cart item updated successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/cart_operation_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - invalid input or product not available',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '404': {
          description: 'Product or cart item not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '409': {
          description: 'Conflict - insufficient stock available',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Cart'],
      description: 'Remove product from cart',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'productId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
          description: 'Product UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Product removed from cart successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/cart_operation_response',
              },
            },
          },
        },
        '401': {
          description: 'Unauthorized - authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '404': {
          description: 'Cart item not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
      },
    },
  },
}

const definitions = {
  cart_item: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Cart item ID',
      },
      cartId: {
        type: 'string',
        format: 'uuid',
        description: 'Cart ID',
      },
      productId: {
        type: 'string',
        format: 'uuid',
        description: 'Product ID',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        description: 'Quantity of product in cart',
      },
      product: {
        $ref: '#/definitions/product',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Item added timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174010',
      cartId: '123e4567-e89b-12d3-a456-426614174011',
      productId: '123e4567-e89b-12d3-a456-426614174002',
      quantity: 2,
      product: {
        id: '123e4567-e89b-12d3-a456-426614174002',
        name: 'Wireless Headphones',
        price: 199.99,
        sku: 'WH-001',
        stock: 50,
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  cart: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Cart ID',
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID',
      },
      items: {
        type: 'array',
        items: {
          $ref: '#/definitions/cart_item',
        },
        description: 'Cart items',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Cart creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174011',
      userId: '123e4567-e89b-12d3-a456-426614174012',
      items: [
        {
          id: '123e4567-e89b-12d3-a456-426614174010',
          productId: '123e4567-e89b-12d3-a456-426614174002',
          quantity: 2,
          product: {
            name: 'Wireless Headphones',
            price: 199.99,
          },
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  cart_summary: {
    type: 'object',
    properties: {
      cart: {
        $ref: '#/definitions/cart',
      },
      totalItems: {
        type: 'integer',
        description: 'Total number of items in cart',
        example: 3,
      },
      totalPrice: {
        type: 'string',
        description: 'Total price of all items (as string to preserve precision)',
        example: '599.97',
      },
    },
    example: {
      cart: {
        id: '123e4567-e89b-12d3-a456-426614174011',
        userId: '123e4567-e89b-12d3-a456-426614174012',
        items: [
          {
            id: '123e4567-e89b-12d3-a456-426614174010',
            quantity: 3,
            product: {
              name: 'Wireless Headphones',
              price: 199.99,
            },
          },
        ],
      },
      totalItems: 3,
      totalPrice: '599.97',
    },
  },
  add_to_cart_body: {
    type: 'object',
    required: ['productId', 'quantity'],
    properties: {
      productId: {
        type: 'string',
        format: 'uuid',
        description: 'Product UUID to add to cart',
      },
      quantity: {
        type: 'integer',
        minimum: 1,
        maximum: 1000,
        description: 'Quantity to add',
      },
    },
    example: {
      productId: '123e4567-e89b-12d3-a456-426614174002',
      quantity: 2,
    },
  },
  update_cart_item_body: {
    type: 'object',
    required: ['quantity'],
    properties: {
      quantity: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        description: 'New quantity (0 removes the item)',
      },
    },
    example: {
      quantity: 5,
    },
  },
  get_cart_response: {
    type: 'object',
    properties: {
      data: {
        $ref: '#/definitions/cart_summary',
      },
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  cart_operation_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  clear_cart_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  error_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        description: 'Error code',
      },
      message: {
        type: 'string',
        description: 'Error message',
      },
      data: {
        type: 'object',
        description: 'Additional error data',
      },
    },
    example: {
      code: 404000,
      message: 'Product not found',
    },
  },
}

export const cartDocs = {
  tags,
  paths,
  definitions,
}
