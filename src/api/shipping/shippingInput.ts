import { Request } from 'express';
import Joi from 'joi';
import { ShippingRateType } from '@prisma/client';

export const createShippingZoneSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().required().min(2).max(100),
        description: Joi.string().optional().max(500),
        countries: Joi.array()
          .optional()
          .items(
            Joi.object({
              countryCode: Joi.string().required().length(2).uppercase(),
              countryName: Joi.string().required().min(2).max(100),
            })
          ),
        rates: Joi.array()
          .optional()
          .items(
            Joi.object({
              name: Joi.string().required().min(2).max(100),
              description: Joi.string().optional().max(500),
              rateType: Joi.string()
                .required()
                .valid(...Object.values(ShippingRateType)),
              baseRate: Joi.number().required().min(0),
              minOrderValue: Joi.number().optional().min(0),
              maxOrderValue: Joi.number().optional().min(0),
              freeShippingMin: Joi.number().optional().min(0),
              estimatedDays: Joi.number().optional().min(1).max(365),
              priority: Joi.number().optional().min(0).max(100),
              weightUnit: Joi.string().optional().max(10),
              pricePerUnit: Joi.number().optional().min(0),
              minWeight: Joi.number().optional().min(0),
              maxWeight: Joi.number().optional().min(0),
            })
          ),
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      countries: req.body.countries,
      rates: req.body.rates,
    },
  };
};

export const updateShippingZoneSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().optional().min(2).max(100),
        description: Joi.string().optional().max(500),
        isActive: Joi.boolean().optional(),
        countries: Joi.array()
          .optional()
          .items(
            Joi.object({
              countryCode: Joi.string().required().length(2).uppercase(),
              countryName: Joi.string().required().min(2).max(100),
            })
          ),
        rates: Joi.array()
          .optional()
          .items(
            Joi.object({
              name: Joi.string().required().min(2).max(100),
              description: Joi.string().optional().max(500),
              rateType: Joi.string()
                .required()
                .valid(...Object.values(ShippingRateType)),
              baseRate: Joi.number().required().min(0),
              minOrderValue: Joi.number().optional().min(0),
              maxOrderValue: Joi.number().optional().min(0),
              freeShippingMin: Joi.number().optional().min(0),
              estimatedDays: Joi.number().optional().min(1).max(365),
              priority: Joi.number().optional().min(0).max(100),
              weightUnit: Joi.string().optional().max(10),
              pricePerUnit: Joi.number().optional().min(0),
              minWeight: Joi.number().optional().min(0),
              maxWeight: Joi.number().optional().min(0),
            })
          ),
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      isActive: req.body.isActive,
      countries: req.body.countries,
      rates: req.body.rates,
    },
  };
};

export const addCountrySchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        countryCode: Joi.string().required().length(2).uppercase(),
        countryName: Joi.string().required().min(2).max(100),
      })
      .options({ abortEarly: false }),
    input: {
      countryCode: req.body.countryCode,
      countryName: req.body.countryName,
    },
  };
};

export const addRateSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().required().min(2).max(100),
        description: Joi.string().optional().max(500),
        rateType: Joi.string()
          .required()
          .valid(...Object.values(ShippingRateType)),
        baseRate: Joi.number().required().min(0),
        minOrderValue: Joi.number().optional().min(0),
        maxOrderValue: Joi.number().optional().min(0),
        freeShippingMin: Joi.number().optional().min(0),
        estimatedDays: Joi.number().optional().min(1).max(365),
        priority: Joi.number().optional().min(0).max(100),
        weightUnit: Joi.string().optional().max(10),
        pricePerUnit: Joi.number().optional().min(0),
        minWeight: Joi.number().optional().min(0),
        maxWeight: Joi.number().optional().min(0),
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      rateType: req.body.rateType,
      baseRate: req.body.baseRate,
      minOrderValue: req.body.minOrderValue,
      maxOrderValue: req.body.maxOrderValue,
      freeShippingMin: req.body.freeShippingMin,
      estimatedDays: req.body.estimatedDays,
      priority: req.body.priority,
      weightUnit: req.body.weightUnit,
      pricePerUnit: req.body.pricePerUnit,
      minWeight: req.body.minWeight,
      maxWeight: req.body.maxWeight,
    },
  };
};

export const updateRateSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        name: Joi.string().optional().min(2).max(100),
        description: Joi.string().optional().max(500),
        rateType: Joi.string()
          .optional()
          .valid(...Object.values(ShippingRateType)),
        baseRate: Joi.number().optional().min(0),
        minOrderValue: Joi.number().optional().min(0),
        maxOrderValue: Joi.number().optional().min(0),
        freeShippingMin: Joi.number().optional().min(0),
        estimatedDays: Joi.number().optional().min(1).max(365),
        isActive: Joi.boolean().optional(),
        priority: Joi.number().optional().min(0).max(100),
        weightUnit: Joi.string().optional().max(10),
        pricePerUnit: Joi.number().optional().min(0),
        minWeight: Joi.number().optional().min(0),
        maxWeight: Joi.number().optional().min(0),
      })
      .options({ abortEarly: false }),
    input: {
      name: req.body.name,
      description: req.body.description,
      rateType: req.body.rateType,
      baseRate: req.body.baseRate,
      minOrderValue: req.body.minOrderValue,
      maxOrderValue: req.body.maxOrderValue,
      freeShippingMin: req.body.freeShippingMin,
      estimatedDays: req.body.estimatedDays,
      isActive: req.body.isActive,
      priority: req.body.priority,
      weightUnit: req.body.weightUnit,
      pricePerUnit: req.body.pricePerUnit,
      minWeight: req.body.minWeight,
      maxWeight: req.body.maxWeight,
    },
  };
};

export const calculateShippingSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        countryCode: Joi.string().required().length(2).uppercase(),
        orderValue: Joi.number().required().min(0),
        totalWeight: Joi.number().optional().min(0),
      })
      .options({ abortEarly: false }),
    input: {
      countryCode: req.query.countryCode,
      orderValue: req.query.orderValue,
      totalWeight: req.query.totalWeight,
    },
  };
};
