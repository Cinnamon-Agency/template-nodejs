import { ResponseCode, serviceMethod } from '@common';
import { getPrismaClient } from '@services/prisma';
import { autoInjectable, singleton } from 'tsyringe';
import { 
  ICartService,
  IGetOrCreateCart,
  IAddToCart,
  IUpdateCartItem,
  IRemoveFromCart,
  IClearCart,
  IGetCart,
  CartSummary
} from './interfaces';

@singleton()
@autoInjectable()
export class CartService implements ICartService {
  @serviceMethod()
  async getOrCreateCart({ userId }: IGetOrCreateCart) {
    let cart = await getPrismaClient().cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await getPrismaClient().cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return { cart, code: ResponseCode.OK };
  }

  @serviceMethod()
  async addToCart({ userId, productId, quantity }: IAddToCart) {
    if (quantity <= 0) {
      return { code: ResponseCode.BAD_REQUEST };
    }

    const product = await getPrismaClient().product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { code: ResponseCode.NOT_FOUND };
    }

    if (product.stock < quantity) {
      return { code: ResponseCode.CONFLICT };
    }

    const cartResult = await this.getOrCreateCart({ userId });
    if (!cartResult.cart) {
      return { code: cartResult.code };
    }

    const existingItem = await getPrismaClient().cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cartResult.cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        return { code: ResponseCode.CONFLICT };
      }

      await getPrismaClient().cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      await getPrismaClient().cartItem.create({
        data: {
          cartId: cartResult.cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart({ userId });
  }

  @serviceMethod()
  async updateCartItem({ userId, productId, quantity }: IUpdateCartItem) {
    if (quantity <= 0) {
      return this.removeFromCart({ userId, productId });
    }

    const product = await getPrismaClient().product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { code: ResponseCode.NOT_FOUND };
    }

    if (product.stock < quantity) {
      return { code: ResponseCode.CONFLICT };
    }

    const cartResult = await this.getOrCreateCart({ userId });
    if (!cartResult.cart) {
      return { code: cartResult.code };
    }

    const existingItem = await getPrismaClient().cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cartResult.cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().cartItem.update({
      where: { id: existingItem.id },
      data: { quantity },
    });

    return this.getCart({ userId });
  }

  @serviceMethod()
  async removeFromCart({ userId, productId }: IRemoveFromCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    if (!cartResult.cart) {
      return { code: cartResult.code };
    }

    const existingItem = await getPrismaClient().cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cartResult.cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().cartItem.delete({
      where: { id: existingItem.id },
    });

    return this.getCart({ userId });
  }

  @serviceMethod()
  async clearCart({ userId }: IClearCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    if (!cartResult.cart) {
      return { code: cartResult.code };
    }

    await getPrismaClient().cartItem.deleteMany({
      where: { cartId: cartResult.cart.id },
    });

    return { code: ResponseCode.OK };
  }

  @serviceMethod()
  async getCart({ userId }: IGetCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    if (!cartResult.cart) {
      return { code: cartResult.code };
    }

    const cart = cartResult.cart;
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    const summary: CartSummary = {
      cart,
      totalItems,
      totalPrice,
    };

    return { cart: summary, code: ResponseCode.OK };
  }
}
