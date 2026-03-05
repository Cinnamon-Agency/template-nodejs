import express from 'express';
import { container } from 'tsyringe';
import { PaymentController } from './paymentController';
import { requireToken } from '@middleware/auth';
import { validate } from '@middleware/validation';
import { createOrderSchema, createPaymentIntentSchema, confirmPaymentSchema } from './paymentInput';

const paymentController = container.resolve(PaymentController);

export const paymentRouter = express.Router();

paymentRouter.post(
  '/orders',
  requireToken(),
  validate(createOrderSchema),
  paymentController.createOrder
);

paymentRouter.post(
  '/payment-intent',
  requireToken(),
  validate(createPaymentIntentSchema),
  paymentController.createPaymentIntent
);

paymentRouter.post(
  '/confirm',
  validate(confirmPaymentSchema),
  paymentController.confirmPayment
);

paymentRouter.get(
  '/orders/:orderId',
  requireToken(),
  paymentController.getOrder
);

paymentRouter.get(
  '/orders',
  requireToken(),
  paymentController.getUserOrders
);

paymentRouter.post(
  '/orders/:orderId/cancel',
  requireToken(),
  paymentController.cancelOrder
);

paymentRouter.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

paymentRouter.get(
  '/config',
  paymentController.getPublishableKey
);
