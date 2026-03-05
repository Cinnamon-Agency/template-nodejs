import { ResponseCode, serviceMethod } from '@common';
import { getPrismaClient } from '@services/prisma';
import { autoInjectable, singleton } from 'tsyringe';
import { ProductStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { cache, CacheKeys } from '@services/cache';
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
      return { 
        code: ResponseCode.BAD_REQUEST,
        message: 'Quantity must be greater than 0'
      };
    }

    const product = await getPrismaClient().product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { 
        code: ResponseCode.NOT_FOUND,
        message: 'Product not found'
      };
    }

    if (product.status !== ProductStatus.ACTIVE) {
      return { 
        code: ResponseCode.BAD_REQUEST,
        message: 'Product is not available for purchase'
      };
    }

    const cartResult = await this.getOrCreateCart({ userId });
    const cart = cartResult.cart!;

    // Use transaction for atomic stock validation and cart update
    try {
      await getPrismaClient().$transaction(async (tx) => {
        // Re-fetch product with lock to ensure stock consistency
        const lockedProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!lockedProduct || lockedProduct.stock < quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
        });

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          
          if (lockedProduct.stock < newQuantity) {
            throw new Error('INSUFFICIENT_STOCK');
          }

          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: newQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId,
              quantity,
            },
          });
        }
      });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_STOCK') {
        return { 
          code: ResponseCode.CONFLICT,
          message: 'Insufficient stock available'
        };
      }
      throw error;
    }

    await cache.del(CacheKeys.userById(userId));
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
      return { 
        code: ResponseCode.NOT_FOUND,
        message: 'Product not found'
      };
    }

    if (product.status !== ProductStatus.ACTIVE) {
      return { 
        code: ResponseCode.BAD_REQUEST,
        message: 'Product is not available for purchase'
      };
    }

    const cartResult = await this.getOrCreateCart({ userId });
    const cart = cartResult.cart!;

    // Use transaction for atomic stock validation
    try {
      await getPrismaClient().$transaction(async (tx) => {
        const lockedProduct = await tx.product.findUnique({
          where: { id: productId },
        });

        if (!lockedProduct || lockedProduct.stock < quantity) {
          throw new Error('INSUFFICIENT_STOCK');
        }

        const existingItem = await tx.cartItem.findUnique({
          where: {
            cartId_productId: {
              cartId: cart.id,
              productId,
            },
          },
        });

        if (!existingItem) {
          throw new Error('ITEM_NOT_FOUND');
        }

        await tx.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity },
        });
      });
    } catch (error: any) {
      if (error.message === 'INSUFFICIENT_STOCK') {
        return { 
          code: ResponseCode.CONFLICT,
          message: 'Insufficient stock available'
        };
      }
      if (error.message === 'ITEM_NOT_FOUND') {
        return { 
          code: ResponseCode.NOT_FOUND,
          message: 'Item not found in cart'
        };
      }
      throw error;
    }

    await cache.del(CacheKeys.userById(userId));
    return this.getCart({ userId });
  }

  @serviceMethod()
  async removeFromCart({ userId, productId }: IRemoveFromCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    const cart = cartResult.cart!;

    const existingItem = await getPrismaClient().cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (!existingItem) {
      return { 
        code: ResponseCode.NOT_FOUND,
        message: 'Item not found in cart'
      };
    }

    await getPrismaClient().cartItem.delete({
      where: { id: existingItem.id },
    });

    await cache.del(CacheKeys.userById(userId));
    return this.getCart({ userId });
  }

  @serviceMethod()
  async clearCart({ userId }: IClearCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    const cart = cartResult.cart!;

    await getPrismaClient().cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    await cache.del(CacheKeys.userById(userId));
    return { 
      code: ResponseCode.OK,
      message: 'Cart cleared successfully'
    };
  }

  @serviceMethod()
  async getCart({ userId }: IGetCart) {
    const cartResult = await this.getOrCreateCart({ userId });
    const cart = cartResult.cart!;

    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Use Decimal for precise price calculations
    const totalPrice = cart.items.reduce(
      (sum, item) => {
        const itemPrice = new Decimal(item.product.price.toString());
        const itemTotal = itemPrice.mul(item.quantity);
        return sum.add(itemTotal);
      },
      new Decimal(0)
    );

    const summary: CartSummary = {
      cart,
      totalItems,
      totalPrice: totalPrice.toString(),
    };

    return { cart: summary, code: ResponseCode.OK };
  }
}
