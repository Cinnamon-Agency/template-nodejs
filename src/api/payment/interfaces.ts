import { Order, Payment, OrderStatus, PaymentStatus } from '@prisma/client';

export interface IPaymentService {
  createOrder(params: ICreateOrder): Promise<ICreateOrderResult>;
  createPaymentIntent(params: ICreatePaymentIntent): Promise<ICreatePaymentIntentResult>;
  confirmPayment(params: IConfirmPayment): Promise<IConfirmPaymentResult>;
  getOrder(params: IGetOrder): Promise<IGetOrderResult>;
  getUserOrders(params: IGetUserOrders): Promise<IGetUserOrdersResult>;
  cancelOrder(params: ICancelOrder): Promise<ICancelOrderResult>;
  handleWebhook(params: IHandleWebhook): Promise<IHandleWebhookResult>;
}

export interface ICreateOrder {
  userId: string;
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  shippingZoneId?: string;
  shippingRateId?: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
}

export interface ICreateOrderResult {
  code: number;
  order?: Order & { items: any[]; payment: Payment | undefined };
  message?: string;
}

export interface ICreatePaymentIntent {
  orderId: string;
  userId: string;
}

export interface ICreatePaymentIntentResult {
  code: number;
  clientSecret?: string;
  publishableKey?: string;
  paymentIntentId?: string;
  message?: string;
}

export interface IConfirmPayment {
  paymentIntentId: string;
}

export interface IConfirmPaymentResult {
  code: number;
  order?: Order;
  payment?: Payment;
  message?: string;
}

export interface IGetOrder {
  orderId: string;
  userId: string;
}

export interface IGetOrderResult {
  code: number;
  order?: Order & { items: any[]; payment: Payment | undefined };
  message?: string;
}

export interface IGetUserOrders {
  userId: string;
  filter?: {
    status?: OrderStatus;
    page?: number;
    limit?: number;
  };
}

export interface IGetUserOrdersResult {
  code: number;
  items?: (Order & { items: any[]; payment: Payment | undefined })[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface ICancelOrder {
  orderId: string;
  userId: string;
}

export interface ICancelOrderResult {
  code: number;
  order?: Order;
  message?: string;
}

export interface IHandleWebhook {
  signature: string;
  payload: string | Buffer;
}

export interface IHandleWebhookResult {
  code: number;
  message?: string;
}
