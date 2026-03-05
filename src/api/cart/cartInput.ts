import { Request } from 'express';
import Joi from 'joi';

export const addToCartSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(1).max(1000).required(),
      })
      .options({ abortEarly: false }),
    input: {
      productId: req.body.productId,
      quantity: req.body.quantity,
    },
  };
};

export const updateCartItemSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        productId: Joi.string().uuid().required(),
        quantity: Joi.number().integer().min(0).max(1000).required(),
      })
      .options({ abortEarly: false }),
    input: {
      productId: req.params.productId,
      quantity: req.body.quantity,
    },
  };
};

export const removeFromCartSchema = (req: Request) => {
  return {
    schema: Joi.object()
      .keys({
        productId: Joi.string().uuid().required(),
      })
      .options({ abortEarly: false }),
    input: {
      productId: req.params.productId,
    },
  };
};
