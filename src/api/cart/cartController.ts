import { NextFunction, Request, Response } from 'express';
import { autoInjectable, singleton } from 'tsyringe';
import { CartService } from './cartService';

@singleton()
@autoInjectable()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  public getCart = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;

    const result = await this.cartService.getCart({ userId });


    return next({
      data: result.cart,
      code: result.code,
    });
  };

  public addToCart = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { productId, quantity } = res.locals.input;

    const result = await this.cartService.addToCart({ userId, productId, quantity });


    return next({
      data: result.cart,
      code: result.code,
    });
  };

  public updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { productId } = req.params;
    const { quantity } = res.locals.input;

    const result = await this.cartService.updateCartItem({ userId, productId, quantity });

    return next({
      data: result.cart,
      code: result.code,
    });
  };

  public removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;
    const { productId } = req.params;

    const result = await this.cartService.removeFromCart({ userId, productId });

    return next({
      data: result.cart,
      code: result.code,
    });
  };

  public clearCart = async (req: Request, res: Response, next: NextFunction) => {
    const userId = res.locals.user.id;

    const result = await this.cartService.clearCart({ userId });

    return next({
      code: result.code,
    });
  };
}
