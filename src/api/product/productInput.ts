import { Request } from 'express'
import Joi from 'joi'

// Temporarily define enums until Prisma client is regenerated
enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED'
}

enum ProductCharacteristicType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
  COLOR = 'COLOR',
  SIZE = 'SIZE',
  WEIGHT = 'WEIGHT',
  MATERIAL = 'MATERIAL',
  BRAND = 'BRAND',
  MODEL = 'MODEL'
}

export const createProductSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().required().min(1).max(255),
        description: Joi.string().optional().max(1000),
        price: Joi.number().required().min(0),
        sku: Joi.string().required().min(1).max(100),
        stock: Joi.number().optional().integer().min(0).default(0),
        status: Joi.string().optional().valid(...Object.values(ProductStatus)).default(ProductStatus.ACTIVE),
        characteristics: Joi.array().optional().items(
          Joi.object({
            name: Joi.string().required().min(1).max(100),
            value: Joi.string().required().min(1).max(500),
            type: Joi.string().required().valid(...Object.values(ProductCharacteristicType))
          })
        ),
        categoryIds: Joi.array().optional().items(Joi.string().uuid())
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      sku: req.body.sku,
      stock: req.body.stock,
      status: req.body.status,
      characteristics: req.body.characteristics,
      categoryIds: req.body.categoryIds
    },
  }
}

export const updateProductSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().optional().min(1).max(255),
        description: Joi.string().optional().max(1000),
        price: Joi.number().optional().min(0),
        stock: Joi.number().optional().integer().min(0),
        status: Joi.string().optional().valid(...Object.values(ProductStatus)),
        characteristics: Joi.array().optional().items(
          Joi.object({
            name: Joi.string().required().min(1).max(100),
            value: Joi.string().required().min(1).max(500),
            type: Joi.string().required().valid(...Object.values(ProductCharacteristicType))
          })
        ),
        categoryIds: Joi.array().optional().items(Joi.string().uuid())
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      stock: req.body.stock,
      status: req.body.status,
      characteristics: req.body.characteristics,
      categoryIds: req.body.categoryIds
    },
  }
}

export const getProductsSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        page: Joi.number().optional().integer().min(1).default(1),
        limit: Joi.number().optional().integer().min(1).max(100).default(20),
        search: Joi.string().optional().max(100),
        status: Joi.string().optional().valid(...Object.values(ProductStatus)),
        minPrice: Joi.number().optional().min(0),
        maxPrice: Joi.number().optional().min(0),
        categoryIds: Joi.alternatives().try(
          Joi.array().items(Joi.string().uuid()),
          Joi.string().uuid()
        ).optional(),
        sortBy: Joi.string().optional().valid('name', 'price', 'stock', 'createdAt', 'updatedAt').default('createdAt'),
        sortOrder: Joi.string().optional().valid('asc', 'desc').default('desc')
      })
      .options({ abortEarly: false }),
    input: {
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      status: req.query.status,
      minPrice: req.query.minPrice,
      maxPrice: req.query.maxPrice,
      categoryIds: req.query.categoryIds,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    },
  }
}

export const getProductByIdSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        id: Joi.string()
          .regex(
            /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
          )
          .required(),
      })
      .options({ abortEarly: false }),
    input: {
      id: req.params.id,
    },
  }
}

export const getProductBySkuSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        sku: Joi.string().required().min(1).max(100),
      })
      .options({ abortEarly: false }),
    input: {
      sku: req.params.sku,
    },
  }
}

export const updateProductStockSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        stock: Joi.number().required().integer().min(0)
      })
      .options({ abortEarly: false }),
    input: {
      stock: req.body.stock,
    },
  }
}

export const updateProductStatusSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        status: Joi.string().required().valid(...Object.values(ProductStatus))
      })
      .options({ abortEarly: false }),
    input: {
      status: req.body.status,
    },
  }
}
