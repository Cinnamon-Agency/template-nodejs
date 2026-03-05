import { NextFunction, Request, Response } from 'express';
import { autoInjectable, singleton } from 'tsyringe';
import { PaymentService } from './paymentService';
import { ResponseCode } from '@common';

@singleton()
@autoInjectable()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  public createOrder = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const orderData = res.locals.input;

    const result = await this.paymentService.createOrder({
      userId,
      ...orderData,
    });

    return next({
      code: result.code,
      data: {
        order: result.order,
      },
      message: result.message,
    });
  };

  public createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { orderId } = res.locals.input;

    const result = await this.paymentService.createPaymentIntent({
      orderId,
      userId,
    });

    return next({
      code: result.code,
      data: {
        clientSecret: result.clientSecret,
        publishableKey: result.publishableKey,
        paymentIntentId: result.paymentIntentId,
      },
      message: result.message,
    });
  };

  public confirmPayment = async (req: Request, res: Response, next: NextFunction) => {
    const { paymentIntentId } = res.locals.input;

    const result = await this.paymentService.confirmPayment({
      paymentIntentId,
    });

    return next({
      code: result.code,
      data: {
        order: result.order,
        payment: result.payment,
      },
      message: result.message,
    });
  };

  public getOrder = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { orderId } = req.params;

    const result = await this.paymentService.getOrder({
      orderId,
      userId,
    });

    if (!result.order) {
      return next({ code: result.code });
    }

    return next({
      code: result.code,
      data: {
        order: result.order,
      },
      message: result.message,
    });
  };

  public getUserOrders = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { status, page, limit } = req.query;

    const result = await this.paymentService.getUserOrders({
      userId,
      filter: {
        status: status as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      },
    });

    return next({
      code: result.code,
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    });
  };

  public cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { orderId } = req.params;

    const result = await this.paymentService.cancelOrder({
      orderId,
      userId,
    });

    if (!result.order) {
      return next({ code: result.code });
    }

    return next({
      code: result.code,
      data: {
        order: result.order,
      },
      message: result.message,
    });
  };

  public handleWebhook = async (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['stripe-signature'] as string;
    const payload = req.body;

    const result = await this.paymentService.handleWebhook({
      signature,
      payload,
    });

    return next({
      code: result.code,
      message: result.message,
    });
  };

  public getPublishableKey = async (req: Request, res: Response, next: NextFunction) => {
    return next({
      code: ResponseCode.OK,
      data: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      },
    });
  };
}
