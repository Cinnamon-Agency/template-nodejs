const tags = [
  {
    name: 'Product',
    description: 'Products related routes',
  },
]

const paths = {
  '/products': {
    get: {
      tags: ['Product'],
      description: 'Get list of products (paginated)',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
          },
          required: false,
          description: 'Page number (default: 1)',
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 20,
            maximum: 100,
          },
          required: false,
          description: 'Items per page (default: 20, max: 100)',
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string',
          },
          required: false,
          description: 'Search term (searches name, description, SKU)',
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'],
          },
          required: false,
          description: 'Filter by status',
        },
        {
          in: 'query',
          name: 'minPrice',
          schema: {
            type: 'number',
            minimum: 0,
          },
          required: false,
          description: 'Minimum price filter',
        },
        {
          in: 'query',
          name: 'maxPrice',
          schema: {
            type: 'number',
            minimum: 0,
          },
          required: false,
          description: 'Maximum price filter',
        },
        {
          in: 'query',
          name: 'categoryIds',
          schema: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
          },
          required: false,
          description: 'Filter by category IDs',
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            enum: ['name', 'price', 'stock', 'createdAt', 'updatedAt'],
            default: 'createdAt',
          },
          required: false,
          description: 'Sort field',
        },
        {
          in: 'query',
          name: 'sortOrder',
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc',
          },
          required: false,
          description: 'Sort order',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved products',
          content: {
            schema: {
              $ref: '#/definitions/get_products_response',
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '500': {
          description: 'Server error',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
    post: {
      tags: ['Product'],
      description: 'Create new product',
      security: [{ bearerAuth: [] }],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/create_product_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully created product',
          content: {
            schema: {
              $ref: '#/definitions/create_product_response',
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '409': {
          description: 'SKU already exists',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
  },
  '/products/{id}': {
    get: {
      tags: ['Product'],
      description: 'Get product by ID',
      parameters: [
        {
          in: 'path',
          name: 'id',
          schema: {
            type: 'string',
            format: 'uuid',
          },
          required: true,
          description: 'Product UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved product',
          content: {
            schema: {
              $ref: '#/definitions/get_product_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
    put: {
      tags: ['Product'],
      description: 'Update product',
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
          description: 'Product UUID',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_product_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully updated product',
          content: {
            schema: {
              $ref: '#/definitions/update_product_response',
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
    delete: {
      tags: ['Product'],
      description: 'Delete product',
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
          description: 'Product UUID',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully deleted product',
          content: {
            schema: {
              $ref: '#/definitions/delete_product_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
  },
  '/products/sku/{sku}': {
    get: {
      tags: ['Product'],
      description: 'Get product by SKU',
      parameters: [
        {
          in: 'path',
          name: 'sku',
          schema: {
            type: 'string',
          },
          required: true,
          description: 'Product SKU',
        },
      ],
      responses: {
        '200': {
          description: 'Successfully retrieved product',
          content: {
            schema: {
              $ref: '#/definitions/get_product_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
  },
  '/products/{id}/stock': {
    patch: {
      tags: ['Product'],
      description: 'Update product stock',
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
          description: 'Product UUID',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_stock_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully updated stock',
          content: {
            schema: {
              $ref: '#/definitions/update_product_response',
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
  },
  '/products/{id}/status': {
    patch: {
      tags: ['Product'],
      description: 'Update product status',
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
          description: 'Product UUID',
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/definitions/update_status_body',
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Successfully updated status',
          content: {
            schema: {
              $ref: '#/definitions/update_product_response',
            },
          },
        },
        '400': {
          description: 'Bad request',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '401': {
          description: 'Unauthorized',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
        '404': {
          description: 'Product not found',
          content: {
            schema: {
              $ref: '#/definitions/error_response',
            },
          },
        },
      },
    },
  },
}

const definitions = {
  product_characteristic: {
    type: 'object',
    required: ['name', 'value', 'type'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique characteristic identifier',
      },
      name: {
        type: 'string',
        maxLength: 100,
        description: 'Characteristic name',
      },
      value: {
        type: 'string',
        maxLength: 500,
        description: 'Characteristic value',
      },
      type: {
        type: 'string',
        enum: ['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'COLOR', 'SIZE', 'WEIGHT', 'MATERIAL', 'BRAND', 'MODEL'],
        description: 'Characteristic type',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Color',
      value: 'Red',
      type: 'COLOR',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  category: {
    type: 'object',
    required: ['id', 'name'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique category identifier',
      },
      name: {
        type: 'string',
        maxLength: 100,
        description: 'Category name',
      },
      description: {
        type: 'string',
        maxLength: 500,
        description: 'Category description',
      },
      parentId: {
        type: 'string',
        format: 'uuid',
        description: 'Parent category ID',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      name: 'Electronics',
      description: 'Electronic devices',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  product: {
    type: 'object',
    required: ['id', 'name', 'price', 'sku'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Unique product identifier',
      },
      name: {
        type: 'string',
        maxLength: 255,
        description: 'Product name',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Product description',
      },
      price: {
        type: 'number',
        format: 'decimal',
        minimum: 0,
        description: 'Product price',
      },
      sku: {
        type: 'string',
        maxLength: 100,
        description: 'Product SKU',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        description: 'Available stock quantity',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'],
        description: 'Product status',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
      characteristics: {
        type: 'array',
        items: {
          $ref: '#/definitions/product_characteristic',
        },
        description: 'Product characteristics',
      },
      categories: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            category: {
              $ref: '#/definitions/category',
            },
          },
        },
        description: 'Product categories',
      },
      media: {
        type: 'array',
        items: {
          $ref: '#/definitions/media',
        },
        description: 'Product media files',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174002',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones',
      price: 199.99,
      sku: 'WH-001',
      stock: 50,
      status: 'ACTIVE',
      characteristics: [
        {
          id: '123e4567-e89b-12d3-a456-426614174003',
          name: 'Color',
          value: 'Black',
          type: 'COLOR',
        },
      ],
      categories: [
        {
          id: '123e4567-e89b-12d3-a456-426614174004',
          category: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Electronics',
          },
        },
      ],
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  media: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Media file ID',
      },
      mediaType: {
        type: 'string',
        enum: ['IMAGE', 'VIDEO'],
        description: 'Media type',
      },
      mediaFileName: {
        type: 'string',
        description: 'Media file name',
      },
      fileExtension: {
        type: 'string',
        description: 'File extension',
      },
      storagePath: {
        type: 'string',
        description: 'Storage path',
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Upload timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    },
    example: {
      id: '123e4567-e89b-12d3-a456-426614174005',
      mediaType: 'IMAGE',
      mediaFileName: 'product-image-001.jpg',
      fileExtension: 'jpg',
      storagePath: '/uploads/products/product-image-001.jpg',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  },
  pagination: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        example: 1,
        description: 'Current page number',
      },
      limit: {
        type: 'integer',
        example: 20,
        description: 'Items per page',
      },
      total: {
        type: 'integer',
        example: 100,
        description: 'Total number of items',
      },
      totalPages: {
        type: 'integer',
        example: 5,
        description: 'Total number of pages',
      },
    },
  },
  create_product_body: {
    type: 'object',
    required: ['name', 'price', 'sku'],
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Product name',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Product description',
      },
      price: {
        type: 'number',
        minimum: 0,
        description: 'Product price',
      },
      sku: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        description: 'Product SKU',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        default: 0,
        description: 'Initial stock quantity',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'],
        default: 'ACTIVE',
        description: 'Product status',
      },
      characteristics: {
        type: 'array',
        items: {
          $ref: '#/definitions/product_characteristic',
        },
        description: 'Product characteristics',
      },
      categoryIds: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uuid',
        },
        description: 'Category IDs',
      },
    },
    example: {
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones',
      price: 199.99,
      sku: 'WH-001',
      stock: 50,
      status: 'ACTIVE',
      characteristics: [
        {
          name: 'Color',
          value: 'Black',
          type: 'COLOR',
        },
      ],
      categoryIds: ['123e4567-e89b-12d3-a456-426614174001'],
    },
  },
  update_product_body: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
        description: 'Product name',
      },
      description: {
        type: 'string',
        maxLength: 1000,
        description: 'Product description',
      },
      price: {
        type: 'number',
        minimum: 0,
        description: 'Product price',
      },
      stock: {
        type: 'integer',
        minimum: 0,
        description: 'Stock quantity',
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'],
        description: 'Product status',
      },
      characteristics: {
        type: 'array',
        items: {
          $ref: '#/definitions/product_characteristic',
        },
        description: 'Product characteristics (replaces all existing)',
      },
      categoryIds: {
        type: 'array',
        items: {
          type: 'string',
          format: 'uuid',
        },
        description: 'Category IDs (replaces all existing)',
      },
    },
    example: {
      price: 179.99,
      stock: 75,
      status: 'ACTIVE',
    },
  },
  update_stock_body: {
    type: 'object',
    required: ['stock'],
    properties: {
      stock: {
        type: 'integer',
        minimum: 0,
        description: 'New stock quantity',
      },
    },
    example: {
      stock: 75,
    },
  },
  update_status_body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'DRAFT', 'ARCHIVED'],
        description: 'New product status',
      },
    },
    example: {
      status: 'INACTIVE',
    },
  },
  create_product_response: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          product: {
            $ref: '#/definitions/product',
          },
        },
      },
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  get_products_response: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              $ref: '#/definitions/product',
            },
            description: 'List of products',
          },
          pagination: {
            $ref: '#/definitions/pagination',
          },
        },
      },
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  get_product_response: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          product: {
            $ref: '#/definitions/product',
          },
        },
      },
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  update_product_response: {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          product: {
            $ref: '#/definitions/product',
          },
        },
      },
      code: {
        type: 'integer',
        example: 200000,
        description: 'Response code',
      },
    },
  },
  delete_product_response: {
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
    },
    example: {
      code: 404000,
      message: 'Product not found',
    },
  },
}

export const productDocs = {
  tags,
  paths,
  definitions,
}
