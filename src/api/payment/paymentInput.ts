import { Request } from 'express';
import Joi from 'joi';

export const createOrderSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        shippingAddress: Joi.object({
          name: Joi.string().required(),
          line1: Joi.string().required(),
          line2: Joi.string().optional(),
          city: Joi.string().required(),
          state: Joi.string().optional(),
          postalCode: Joi.string().required(),
          country: Joi.string().required(),
        }).optional(),
        shippingZoneId: Joi.string().uuid().optional(),
        shippingRateId: Joi.string().uuid().optional(),
        customerEmail: Joi.string().email().required(),
        customerPhone: Joi.string().optional(),
        notes: Joi.string().optional(),
      })
      .options({ abortEarly: false }),
    input: {
      shippingAddress: req.body.shippingAddress,
      shippingZoneId: req.body.shippingZoneId,
      shippingRateId: req.body.shippingRateId,
      customerEmail: req.body.customerEmail,
      customerPhone: req.body.customerPhone,
      notes: req.body.notes,
    },
  };
};

export const createPaymentIntentSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        orderId: Joi.string().uuid().required(),
      })
      .options({ abortEarly: false }),
    input: {
      orderId: req.body.orderId,
    },
  };
};

export const confirmPaymentSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        paymentIntentId: Joi.string().required(),
      })
      .options({ abortEarly: false }),
    input: {
      paymentIntentId: req.body.paymentIntentId,
    },
  };
};
