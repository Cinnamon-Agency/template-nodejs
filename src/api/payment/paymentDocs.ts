const tags = [
  {
    name: 'Payment',
    description: 'Payment and order management routes',
  },
]

const paths = {
  '/payment/orders': {
    post: {
      tags: ['Payment'],
      description: 'Create order from cart',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_order_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Order created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/create_order_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - cart is empty or invalid input',
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
        '409': {
          description: 'Conflict - insufficient stock',
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
    get: {
      tags: ['Payment'],
      description: 'Get user orders with pagination',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
          },
          description: 'Filter by order status',
        },
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
          },
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 20,
          },
          description: 'Items per page',
        },
      ],
      responses: {
        '200': {
          description: 'Orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/get_orders_response',
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
  '/payment/orders/{orderId}': {
    get: {
      tags: ['Payment'],
      description: 'Get order details by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'orderId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
          description: 'Order UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Order retrieved successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/get_order_response',
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
          description: 'Order not found',
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
  '/payment/orders/{orderId}/cancel': {
    post: {
      tags: ['Payment'],
      description: 'Cancel an order',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'orderId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
          description: 'Order UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Order cancelled successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/cancel_order_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - order cannot be cancelled',
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
          description: 'Order not found',
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
  '/payment/payment-intent': {
    post: {
      tags: ['Payment'],
      description: 'Create Stripe Payment Intent for an order',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_payment_intent_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment Intent created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/create_payment_intent_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - order not in pending status or already paid',
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
          description: 'Order not found',
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
  '/payment/confirm': {
    post: {
      tags: ['Payment'],
      description: 'Confirm payment status (typically called after Stripe redirects)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/confirm_payment_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Payment confirmed successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/confirm_payment_response',
              },
            },
          },
        },
        '400': {
          description: 'Bad request - payment not successful',
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
          description: 'Payment not found',
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
  '/payment/webhook': {
    post: {
      tags: ['Payment'],
      description: 'Stripe webhook handler for payment events',
      parameters: [
        {
          in: 'header',
          name: 'stripe-signature',
          required: true,
          schema: {
            type: 'string',
          },
          description: 'Stripe webhook signature for verifying the event',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'Stripe webhook event payload (raw body)',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Webhook processed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 200000,
                  },
                  message: {
                    type: 'string',
                    example: 'Webhook processed successfully',
                  },
                },
              },
            },
          },
        },
        '400': {
          description: 'Bad request - invalid signature or payload',
          content: {
            'application/json': {
              schema: {
                $ref: '#/definitions/error_response',
              },
            },
          },
        },
        '500': {
          description: 'Server error - webhook secret not configured',
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
  '/payment/config': {
    get: {
      tags: ['Payment'],
      description: 'Get Stripe publishable key for client-side integration',
      responses: {
        '200': {
          description: 'Publishable key retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  code: {
                    type: 'integer',
                    example: 200000,
                  },
                  data: {
                    type: 'object',
                    properties: {
                      publishableKey: {
                        type: 'string',
                        example: 'pk_test_...',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
}

const definitions = {
  shipping_address: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Recipient name',
        example: 'John Doe',
      },
      line1: {
        type: 'string',
        description: 'Address line 1',
        example: '123 Main St',
      },
      line2: {
        type: 'string',
        description: 'Address line 2 (optional)',
        example: 'Apt 4B',
      },
      city: {
        type: 'string',
        description: 'City',
        example: 'New York',
      },
      state: {
        type: 'string',
        description: 'State/Province',
        example: 'NY',
      },
      postalCode: {
        type: 'string',
        description: 'Postal/ZIP code',
        example: '10001',
      },
      country: {
        type: 'string',
        description: 'Country code',
        example: 'US',
      },
    },
  },
  order_item: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Order item ID',
      },
      orderId: {
        type: 'string',
        format: 'uuid',
        description: 'Order ID',
      },
      productId: {
        type: 'string',
        format: 'uuid',
        description: 'Product ID',
      },
      productName: {
        type: 'string',
        description: 'Product name (snapshot)',
      },
      productSku: {
        type: 'string',
        description: 'Product SKU (snapshot)',
      },
      quantity: {
        type: 'integer',
        description: 'Quantity ordered',
      },
      unitPrice: {
        type: 'string',
        description: 'Unit price at time of order',
      },
      totalPrice: {
        type: 'string',
        description: 'Total price for this item',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Item creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Item last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174020',
      productId: '123e4567-e89b-12d3-a456-426614174002',
      productName: 'Wireless Headphones',
      productSku: 'WH-001',
      quantity: 2,
      unitPrice: '199.99',
      totalPrice: '399.98',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  payment: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Payment ID',
      },
      orderId: {
        type: 'string',
        format: 'uuid',
        description: 'Order ID',
      },
      stripePaymentIntentId: {
        type: 'string',
        description: 'Stripe Payment Intent ID',
      },
      stripeCustomerId: {
        type: 'string',
        description: 'Stripe Customer ID',
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED'],
        description: 'Payment status',
      },
      amount: {
        type: 'string',
        description: 'Payment amount',
      },
      currency: {
        type: 'string',
        description: 'Currency code',
        example: 'usd',
      },
      paymentMethod: {
        type: 'string',
        description: 'Payment method used',
      },
      clientSecret: {
        type: 'string',
        description: 'Stripe client secret for completing payment on client side',
      },
      metadata: {
        type: 'object',
        description: 'Additional payment metadata',
      },
      errorMessage: {
        type: 'string',
        description: 'Error message if payment failed',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Payment creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Payment last update timestamp',
      },
      paidAt: {
        type: 'string',
        format: 'date-time',
        description: 'Payment completion timestamp',
      },
    },
  },
  order: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Order ID',
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'User ID',
      },
      orderNumber: {
        type: 'string',
        description: 'Unique order number',
        example: 'ORD-1234567890-ABC123',
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'PROCESSING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
        description: 'Order status',
      },
      subtotal: {
        type: 'string',
        description: 'Subtotal amount',
      },
      shippingCost: {
        type: 'string',
        description: 'Shipping cost',
      },
      tax: {
        type: 'string',
        description: 'Tax amount',
      },
      total: {
        type: 'string',
        description: 'Total amount',
      },
      currency: {
        type: 'string',
        description: 'Currency code',
        example: 'usd',
      },
      shippingAddress: {
        $ref: '#/definitions/shipping_address',
      },
      shippingZoneId: {
        type: 'string',
        format: 'uuid',
        description: 'Shipping zone ID',
      },
      shippingRateId: {
        type: 'string',
        format: 'uuid',
        description: 'Shipping rate ID',
      },
      customerEmail: {
        type: 'string',
        format: 'email',
        description: 'Customer email',
      },
      customerPhone: {
        type: 'string',
        description: 'Customer phone',
      },
      notes: {
        type: 'string',
        description: 'Order notes',
      },
      items: {
        type: 'array',
        items: {
          $ref: '#/definitions/order_item',
        },
      },
      payment: {
        $ref: '#/definitions/payment',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Order creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
      completedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Order completion timestamp',
      },
      cancelledAt: {
        type: 'string',
        format: 'date-time',
        description: 'Order cancellation timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174030',
      orderNumber: 'ORD-1234567890-ABC123',
      status: 'PENDING',
      subtotal: '399.98',
      shippingCost: '10.00',
      tax: '0.00',
      total: '409.98',
      currency: 'usd',
      customerEmail: 'customer@example.com',
      items: [],
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  },
  create_order_body: {
    type: 'object',
    required: ['customerEmail'],
    properties: {
      customerEmail: {
        type: 'string',
        format: 'email',
        description: 'Customer email address',
      },
      customerPhone: {
        type: 'string',
        description: 'Customer phone number (optional)',
      },
      shippingAddress: {
        $ref: '#/definitions/shipping_address',
      },
      shippingZoneId: {
        type: 'string',
        format: 'uuid',
        description: 'Shipping zone ID (optional)',
      },
      shippingRateId: {
        type: 'string',
        format: 'uuid',
        description: 'Shipping rate ID (optional)',
      },
      notes: {
        type: 'string',
        description: 'Order notes (optional)',
      },
    },
    example: {
      customerEmail: 'customer@example.com',
      customerPhone: '+1234567890',
      shippingAddress: {
        name: 'John Doe',
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      notes: 'Please deliver to front door',
    },
  },
  create_payment_intent_body: {
    type: 'object',
    required: ['orderId'],
    properties: {
      orderId: {
        type: 'string',
        format: 'uuid',
        description: 'Order UUID',
      },
    },
    example: {
      orderId: '123e4567-e89b-12d3-a456-426614174030',
    },
  },
  confirm_payment_body: {
    type: 'object',
    required: ['paymentIntentId'],
    properties: {
      paymentIntentId: {
        type: 'string',
        description: 'Stripe Payment Intent ID',
      },
    },
    example: {
      paymentIntentId: 'pi_1234567890abcdef',
    },
  },
  create_order_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          order: {
            $ref: '#/definitions/order',
          },
        },
      },
    },
  },
  get_order_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          order: {
            $ref: '#/definitions/order',
          },
        },
      },
    },
  },
  get_orders_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              $ref: '#/definitions/order',
            },
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                example: 1,
              },
              limit: {
                type: 'integer',
                example: 20,
              },
              total: {
                type: 'integer',
                example: 100,
              },
              totalPages: {
                type: 'integer',
                example: 5,
              },
            },
          },
        },
      },
    },
  },
  cancel_order_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          order: {
            $ref: '#/definitions/order',
          },
        },
      },
    },
  },
  create_payment_intent_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          clientSecret: {
            type: 'string',
            description: 'Stripe client secret for payment',
            example: 'pi_1234567890_secret_abcdefghijk',
          },
          publishableKey: {
            type: 'string',
            description: 'Stripe publishable key',
            example: 'pk_test_...',
          },
          paymentIntentId: {
            type: 'string',
            description: 'Stripe Payment Intent ID',
            example: 'pi_1234567890abcdef',
          },
        },
      },
    },
  },
  confirm_payment_response: {
    type: 'object',
    properties: {
      code: {
        type: 'integer',
        example: 200000,
      },
      data: {
        type: 'object',
        properties: {
          order: {
            $ref: '#/definitions/order',
          },
          payment: {
            $ref: '#/definitions/payment',
          },
        },
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
      message: 'Order not found',
    },
  },
}

export const paymentDocs = {
  tags,
  paths,
  definitions,
}
