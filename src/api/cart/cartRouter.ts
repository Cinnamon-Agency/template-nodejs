import express from 'express';
import { validate } from '@middleware/validation';
import { container } from 'tsyringe';
import { requireToken } from '@middleware/auth';
import { CartController } from './cartController';
import { 
  addToCartSchema, 
  updateCartItemSchema,
  removeFromCartSchema
} from './cartInput';

const cartController = container.resolve(CartController);
export const cartRouter = express.Router();

cartRouter.get('/', requireToken(), cartController.getCart);
cartRouter.post('/items', requireToken(), validate(addToCartSchema), cartController.addToCart);
cartRouter.put('/items/:productId', requireToken(), validate(updateCartItemSchema), cartController.updateCartItem);
cartRouter.delete('/items/:productId', requireToken(), validate(removeFromCartSchema), cartController.removeFromCart);
cartRouter.delete('/', requireToken(), cartController.clearCart);
