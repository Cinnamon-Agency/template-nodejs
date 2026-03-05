import { ResponseCode, serviceMethod, normalizePagination } from '@common';
import { getPrismaClient } from '@services/prisma';
import { getStripeClient } from '@services/stripe/stripeClient';
import { autoInjectable, singleton } from 'tsyringe';
import { OrderStatus, PaymentStatus, ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@core/logger';
import {
  IPaymentService,
  ICreateOrder,
  ICreatePaymentIntent,
  IConfirmPayment,
  IGetOrder,
  IGetUserOrders,
  ICancelOrder,
  IHandleWebhook,
} from './interfaces';

@singleton()
@autoInjectable()
export class PaymentService implements IPaymentService {
  @serviceMethod()
  async createOrder({
    userId,
    shippingAddress,
    shippingZoneId,
    shippingRateId,
    customerEmail,
    customerPhone,
    notes,
  }: ICreateOrder) {
    const cart = await getPrismaClient().cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: 'Cart is empty',
      };
    }

    let subtotal = new Decimal(0);
    const orderItems = [];

    for (const item of cart.items) {
      if (item.product.status !== ProductStatus.ACTIVE) {
        return {
          code: ResponseCode.BAD_REQUEST,
          message: `Product is not available: ${item.product.name}`,
        };
      }

      if (item.product.stock < item.quantity) {
        return {
          code: ResponseCode.CONFLICT,
          message: `Insufficient stock for product: ${item.product.name}`,
        };
      }

      const itemPrice = new Decimal(item.product.price.toString());
      const itemTotal = itemPrice.mul(item.quantity);
      subtotal = subtotal.add(itemTotal);

      orderItems.push({
        productId: item.productId,
        productName: item.product.name,
        productSku: item.product.sku,
        quantity: item.quantity,
        unitPrice: item.product.price,
        totalPrice: itemTotal.toNumber(),
      });
    }

    let shippingCost = new Decimal(0);
    if (shippingRateId) {
      const shippingRate = await getPrismaClient().shippingRate.findUnique({
        where: { id: shippingRateId },
      });

      if (shippingRate && shippingRate.isActive) {
        shippingCost = new Decimal(shippingRate.baseRate.toString());
      }
    }

    const tax = new Decimal(0);
    const total = subtotal.add(shippingCost).add(tax);

    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    const order = await getPrismaClient().order.create({
      data: {
        userId,
        orderNumber,
        status: OrderStatus.PENDING,
        subtotal: subtotal.toNumber(),
        shippingCost: shippingCost.toNumber(),
        tax: tax.toNumber(),
        total: total.toNumber(),
        currency: 'usd',
        shippingAddress: shippingAddress || undefined,
        shippingZoneId,
        shippingRateId,
        customerEmail,
        customerPhone,
        notes,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
        payment: true,
      },
    });

    return {
      code: ResponseCode.OK,
      order: {
        ...order,
        payment: order.payment ?? undefined,
      },
    };
  }

  @serviceMethod()
  async createPaymentIntent({ orderId, userId }: ICreatePaymentIntent) {
    const order = await getPrismaClient().order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return {
        code: ResponseCode.NOT_FOUND,
        message: 'Order not found',
      };
    }

    if (order.status !== OrderStatus.PENDING) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: 'Order is not in pending status',
      };
    }

    if (order.payment && order.payment.status === PaymentStatus.SUCCEEDED) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: 'Order has already been paid',
      };
    }

    const amountInCents = Math.round(parseFloat(order.total.toString()) * 100);

    const paymentIntent = await getStripeClient().paymentIntents.create({
      amount: amountInCents,
      currency: order.currency,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    const payment = await getPrismaClient().payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripePaymentIntentId: paymentIntent.id,
        status: PaymentStatus.PENDING,
        amount: order.total,
        currency: order.currency,
        clientSecret: paymentIntent.client_secret || undefined,
      },
      update: {
        stripePaymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined,
        status: PaymentStatus.PENDING,
      },
    });

    return {
      code: ResponseCode.OK,
      clientSecret: paymentIntent.client_secret || undefined,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      paymentIntentId: paymentIntent.id,
    };
  }

  @serviceMethod()
  async confirmPayment({ paymentIntentId }: IConfirmPayment) {
    const payment = await getPrismaClient().payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
      include: {
        order: {
          include: {
            items: true,
          },
        },
      },
    });

    if (!payment) {
      return {
        code: ResponseCode.NOT_FOUND,
        message: 'Payment not found',
      };
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      return {
        code: ResponseCode.OK,
        message: 'Payment already processed',
        payment,
        order: payment.order,
      };
    }

    const paymentIntent = await getStripeClient().paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await this.fulfillPayment(payment.id, payment.orderId, payment.order.userId, payment.order.items, paymentIntent.payment_method as string);

      const updatedPayment = await getPrismaClient().payment.findUnique({
        where: { id: payment.id },
        include: {
          order: true,
        },
      });

      return {
        code: ResponseCode.OK,
        payment: updatedPayment || undefined,
        order: updatedPayment?.order,
      };
    }

    return {
      code: ResponseCode.BAD_REQUEST,
      message: `Payment status: ${paymentIntent.status}`,
    };
  }

  @serviceMethod()
  async getOrder({ orderId, userId }: IGetOrder) {
    const order = await getPrismaClient().order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        items: true,
        payment: true,
      },
    });

    if (!order) {
      return {
        code: ResponseCode.NOT_FOUND,
        message: 'Order not found',
      };
    }

    return {
      code: ResponseCode.OK,
      order: {
        ...order,
        payment: order.payment ?? undefined,
      },
    };
  }

  @serviceMethod()
  async getUserOrders({ userId, filter = {} }: IGetUserOrders) {
    const { status, page = 1, limit = 20 } = filter;

    const pagination = normalizePagination(page, limit);
    const skip = (pagination.page - 1) * pagination.perPage;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      getPrismaClient().order.findMany({
        where,
        skip,
        take: pagination.perPage,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          items: true,
          payment: true,
        },
      }),
      getPrismaClient().order.count({ where }),
    ]);

    return {
      code: ResponseCode.OK,
      items: orders.map(order => ({
        ...order,
        payment: order.payment ?? undefined,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.perPage,
        total,
        totalPages: Math.ceil(total / pagination.perPage),
      },
    };
  }

  @serviceMethod()
  async cancelOrder({ orderId, userId }: ICancelOrder) {
    const order = await getPrismaClient().order.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        payment: true,
      },
    });

    if (!order) {
      return {
        code: ResponseCode.NOT_FOUND,
        message: 'Order not found',
      };
    }

    if (order.status === OrderStatus.CANCELLED) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: 'Order is already cancelled',
      };
    }

    if (order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: 'Cannot cancel order that has been shipped or delivered',
      };
    }

    if (order.payment && order.payment.stripePaymentIntentId) {
      try {
        await getStripeClient().paymentIntents.cancel(order.payment.stripePaymentIntentId);
      } catch (error) {
        logger.error('Error cancelling Stripe payment intent:', error);
      }
    }

    const updatedOrder = await getPrismaClient().$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date(),
        },
      });

      if (order.payment) {
        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            status: PaymentStatus.CANCELLED,
          },
        });
      }

      return updated;
    });

    return {
      code: ResponseCode.OK,
      order: updatedOrder,
    };
  }

  @serviceMethod()
  async handleWebhook({ signature, payload }: IHandleWebhook) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return {
        code: ResponseCode.SERVER_ERROR,
        message: 'Webhook secret not configured',
      };
    }

    let event;

    try {
      event = getStripeClient().webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err: any) {
      return {
        code: ResponseCode.BAD_REQUEST,
        message: `Webhook signature verification failed: ${err.message}`,
      };
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await getPrismaClient().payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
          include: {
            order: {
              include: {
                items: true,
              },
            },
          },
        });

        if (payment && payment.status !== PaymentStatus.SUCCEEDED) {
          await this.fulfillPayment(payment.id, payment.orderId, payment.order.userId, payment.order.items, paymentIntent.payment_method as string);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const payment = await getPrismaClient().payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await getPrismaClient().payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.FAILED,
              errorMessage: paymentIntent.last_payment_error?.message,
            },
          });
        }
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        const payment = await getPrismaClient().payment.findUnique({
          where: { stripePaymentIntentId: paymentIntent.id },
        });

        if (payment) {
          await getPrismaClient().payment.update({
            where: { id: payment.id },
            data: {
              status: PaymentStatus.CANCELLED,
            },
          });
        }
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return {
      code: ResponseCode.OK,
      message: 'Webhook processed successfully',
    };
  }

  private async fulfillPayment(
    paymentId: string,
    orderId: string,
    userId: string,
    orderItems: { productId: string; quantity: number }[],
    paymentMethod: string,
  ): Promise<void> {
    await getPrismaClient().$transaction(async (tx) => {
      const current = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { status: true },
      });

      if (current?.status === PaymentStatus.SUCCEEDED) {
        return;
      }

      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.SUCCEEDED,
          paidAt: new Date(),
          paymentMethod,
        },
      });

      await tx.order.update({
        where: { id: orderId },
        data: {
          status: OrderStatus.PROCESSING,
        },
      });

      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: {
          cart: {
            userId,
          },
        },
      });
    });
  }
}
