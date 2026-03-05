import { AsyncResponse } from '@common';
import { Cart, CartItem, Product } from '@prisma/client';

export interface AddToCart {
  productId: string;
  quantity: number;
}

export interface UpdateCartItem {
  quantity: number;
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface CartWithItems extends Cart {
  items: CartItemWithProduct[];
}

export interface CartSummary {
  cart: CartWithItems;
  totalItems: number;
  totalPrice: string;
}

export interface ICartService {
  getOrCreateCart(data: IGetOrCreateCart): AsyncResponse<CartWithItems>;
  addToCart(data: IAddToCart): AsyncResponse<CartSummary>;
  updateCartItem(data: IUpdateCartItem): AsyncResponse<CartSummary>;
  removeFromCart(data: IRemoveFromCart): AsyncResponse<CartSummary>;
  clearCart(data: IClearCart): AsyncResponse<void>;
  getCart(data: IGetCart): AsyncResponse<CartSummary>;
}

export interface IGetOrCreateCart {
  userId: string;
}

export interface IAddToCart {
  userId: string;
  productId: string;
  quantity: number;
}

export interface IUpdateCartItem {
  userId: string;
  productId: string;
  quantity: number;
}

export interface IRemoveFromCart {
  userId: string;
  productId: string;
}

export interface IClearCart {
  userId: string;
}

export interface IGetCart {
  userId: string;
}
