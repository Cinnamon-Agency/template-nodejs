const tags = [
  {
    name: 'Shipping',
    description: 'Shipping zones and rate calculation endpoints',
  },
];

const paths = {
  '/shipping': {
    get: {
      tags: ['Shipping'],
      description: 'Get all shipping zones (paginated)',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
          },
          required: false,
          description: 'Page number',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 20,
          },
          required: false,
          description: 'Items per page',
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'Search by zone name or description',
        },
        {
          in: 'query',
          name: 'isActive',
          schema: {
            type: 'boolean',
          },
          required: false,
          description: 'Filter by active status',
        },
        {
          in: 'query',
          name: 'countryCode',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
          },
          required: false,
          description: 'Filter by country code (ISO 3166-1 alpha-2)',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved shipping zones',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zones_response',
            },
          },
        },
      },
    },
    post: {
      tags: ['Shipping'],
      description: 'Create a new shipping zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_shipping_zone',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Shipping zone created successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '409': {
          description: 'Shipping zone with this name already exists',
        },
      },
    },
  },
  '/shipping/calculate': {
    get: {
      tags: ['Shipping'],
      description: 'Calculate shipping costs for a country and order value',
      parameters: [
        {
          in: 'query',
          name: 'countryCode',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
          },
          required: true,
          description: 'Country code (ISO 3166-1 alpha-2, e.g., US, GB, DE)',
        },
        {
          in: 'query',
          name: 'orderValue',
          schema: {
            type: 'number',
            minimum: 0,
          },
          required: true,
          description: 'Order value in base currency',
        },
      ],
      responses: {
        '200': {
          description: 'Shipping costs calculated successfully',
          content: {
            schema: {
              $ref: '#/definitions/calculate_shipping_response',
            },
          },
        },
        '404': {
          description: 'No shipping zone found for this country',
        },
      },
    },
  },
  '/shipping/country/{countryCode}': {
    get: {
      tags: ['Shipping'],
      description: 'Get shipping zone by country code',
      parameters: [
        {
          in: 'path',
          name: 'countryCode',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
          },
          required: true,
          description: 'Country code (ISO 3166-1 alpha-2)',
        },
      ],
      responses: {
        '200': {
          description: 'Shipping zone retrieved successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'No shipping zone found for this country',
        },
      },
    },
  },
  '/shipping/{id}': {
    get: {
      tags: ['Shipping'],
      description: 'Get shipping zone by ID',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
      ],
      responses: {
        '200': {
          description: 'Shipping zone retrieved successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'Shipping zone not found',
        },
      },
    },
    put: {
      tags: ['Shipping'],
      description: 'Update shipping zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_shipping_zone',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Shipping zone updated successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'Shipping zone not found',
        },
      },
    },
    delete: {
      tags: ['Shipping'],
      description: 'Delete shipping zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
      ],
      responses: {
        '200': {
          description: 'Shipping zone deleted successfully',
        },
        '404': {
          description: 'Shipping zone not found',
        },
      },
    },
  },
  '/shipping/{id}/countries': {
    post: {
      tags: ['Shipping'],
      description: 'Add country to shipping zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/add_country',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Country added to zone successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'Shipping zone not found',
        },
        '409': {
          description: 'Country already exists in this zone',
        },
      },
    },
  },
  '/shipping/{id}/countries/{countryCode}': {
    delete: {
      tags: ['Shipping'],
      description: 'Remove country from shipping zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
        {
          in: 'path',
          name: 'countryCode',
          schema: {
            type: 'string',
            minLength: 2,
            maxLength: 2,
          },
          required: true,
          description: 'Country code to remove',
        },
      ],
      responses: {
        '200': {
          description: 'Country removed from zone successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'Country not found in this zone',
        },
      },
    },
  },
  '/shipping/{id}/rates': {
    post: {
      tags: ['Shipping'],
      description: 'Add shipping rate to zone (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping zone ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/add_shipping_rate',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Rate added to zone successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_zone_response',
            },
          },
        },
        '404': {
          description: 'Shipping zone not found',
        },
      },
    },
  },
  '/shipping/rates/{rateId}': {
    put: {
      tags: ['Shipping'],
      description: 'Update shipping rate (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'rateId',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping rate ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_shipping_rate',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Rate updated successfully',
          content: {
            schema: {
              $ref: '#/definitions/shipping_rate_response',
            },
          },
        },
        '404': {
          description: 'Shipping rate not found',
        },
      },
    },
    delete: {
      tags: ['Shipping'],
      description: 'Delete shipping rate (ADMIN/SUPERADMIN only)',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'rateId',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Shipping rate ID',
        },
      ],
      responses: {
        '200': {
          description: 'Rate deleted successfully',
        },
        '404': {
          description: 'Shipping rate not found',
        },
      },
    },
  },
};

const definitions = {
  create_shipping_zone: {
    type: 'object',
    required: ['name'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'North America',
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: 'Shipping zone for US and Canada',
      },
      countries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['countryCode', 'countryName'],
          properties: {
            countryCode: {
              type: 'string',
              minLength: 2,
              maxLength: 2,
              example: 'US',
            },
            countryName: {
              type: 'string',
              example: 'United States',
            },
          },
        },
      },
      rates: {
        type: 'array',
        items: {
          $ref: '#/definitions/add_shipping_rate',
        },
      },
    },
  },
  update_shipping_zone: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
      },
      description: {
        type: 'string',
        maxLength: 500,
      },
      isActive: {
        type: 'boolean',
      },
      countries: {
        type: 'array',
        items: {
          type: 'object',
          required: ['countryCode', 'countryName'],
          properties: {
            countryCode: {
              type: 'string',
              minLength: 2,
              maxLength: 2,
            },
            countryName: {
              type: 'string',
            },
          },
        },
      },
      rates: {
        type: 'array',
        items: {
          $ref: '#/definitions/add_shipping_rate',
        },
      },
    },
  },
  add_country: {
    type: 'object',
    required: ['countryCode', 'countryName'],
    properties: {
      countryCode: {
        type: 'string',
        minLength: 2,
        maxLength: 2,
        example: 'CA',
      },
      countryName: {
        type: 'string',
        example: 'Canada',
      },
    },
  },
  add_shipping_rate: {
    type: 'object',
    required: ['name', 'rateType', 'baseRate'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Standard Shipping',
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: '5-7 business days',
      },
      rateType: {
        type: 'string',
        enum: ['FLAT_RATE', 'PRICE_BASED', 'FREE_SHIPPING'],
        example: 'FLAT_RATE',
      },
      baseRate: {
        type: 'number',
        minimum: 0,
        example: 9.99,
      },
      minOrderValue: {
        type: 'number',
        minimum: 0,
        example: 0,
      },
      maxOrderValue: {
        type: 'number',
        minimum: 0,
        example: 100,
      },
      freeShippingMin: {
        type: 'number',
        minimum: 0,
        example: 50,
      },
      estimatedDays: {
        type: 'integer',
        minimum: 1,
        maximum: 365,
        example: 5,
      },
      priority: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        example: 1,
      },
    },
  },
  update_shipping_rate: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
      },
      description: {
        type: 'string',
        maxLength: 500,
      },
      rateType: {
        type: 'string',
        enum: ['FLAT_RATE', 'PRICE_BASED', 'FREE_SHIPPING'],
      },
      baseRate: {
        type: 'number',
        minimum: 0,
      },
      minOrderValue: {
        type: 'number',
        minimum: 0,
      },
      maxOrderValue: {
        type: 'number',
        minimum: 0,
      },
      freeShippingMin: {
        type: 'number',
        minimum: 0,
      },
      estimatedDays: {
        type: 'integer',
        minimum: 1,
        maximum: 365,
      },
      isActive: {
        type: 'boolean',
      },
      priority: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
      },
    },
  },
  shipping_zone_response: {
    type: 'object',
    properties: {
      shippingZone: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          isActive: {
            type: 'boolean',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
          countries: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                countryCode: {
                  type: 'string',
                },
                countryName: {
                  type: 'string',
                },
              },
            },
          },
          rates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
                rateType: {
                  type: 'string',
                },
                baseRate: {
                  type: 'string',
                },
                minOrderValue: {
                  type: 'string',
                },
                maxOrderValue: {
                  type: 'string',
                },
                freeShippingMin: {
                  type: 'string',
                },
                estimatedDays: {
                  type: 'integer',
                },
                isActive: {
                  type: 'boolean',
                },
                priority: {
                  type: 'integer',
                },
              },
            },
          },
        },
      },
    },
  },
  shipping_zones_response: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          $ref: '#/definitions/shipping_zone_response/properties/shippingZone',
        },
      },
      pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
          },
          limit: {
            type: 'integer',
          },
          total: {
            type: 'integer',
          },
          totalPages: {
            type: 'integer',
          },
        },
      },
    },
  },
  shipping_rate_response: {
    type: 'object',
    properties: {
      rate: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
          },
          name: {
            type: 'string',
          },
          description: {
            type: 'string',
          },
          rateType: {
            type: 'string',
          },
          baseRate: {
            type: 'string',
          },
          minOrderValue: {
            type: 'string',
          },
          maxOrderValue: {
            type: 'string',
          },
          freeShippingMin: {
            type: 'string',
          },
          estimatedDays: {
            type: 'integer',
          },
          isActive: {
            type: 'boolean',
          },
          priority: {
            type: 'integer',
          },
        },
      },
    },
  },
  calculate_shipping_response: {
    type: 'object',
    properties: {
      shipping: {
        type: 'object',
        properties: {
          availableRates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  format: 'uuid',
                },
                name: {
                  type: 'string',
                },
                description: {
                  type: 'string',
                },
                cost: {
                  type: 'number',
                },
                estimatedDays: {
                  type: 'integer',
                },
                isFreeShipping: {
                  type: 'boolean',
                },
                zoneName: {
                  type: 'string',
                },
              },
            },
          },
          cheapestRate: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              name: {
                type: 'string',
              },
              cost: {
                type: 'number',
              },
            },
          },
          fastestRate: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
              },
              name: {
                type: 'string',
              },
              estimatedDays: {
                type: 'integer',
              },
            },
          },
        },
      },
    },
  },
};

export const shippingDocs = { tags, paths, definitions };
