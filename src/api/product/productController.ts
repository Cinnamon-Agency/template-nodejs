import { NextFunction, Request, Response } from 'express';
import { ResponseCode } from '@common';
import { autoInjectable, singleton } from 'tsyringe';
import { ProductService } from './productService';

@singleton()
@autoInjectable()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  public getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
    const filter = req.query as any;

    const result = await this.productService.getProducts({ filter });

    return next({
      data: result,
      code: result.code,
    });
  };

  public getProductById = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await this.productService.getProductById({ id });

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };

  public getProductBySku = async (req: Request, res: Response, next: NextFunction) => {
    const { sku } = req.params;

    const result = await this.productService.getProductBySku({ sku });

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };

  public createProduct = async (req: Request, res: Response, next: NextFunction) => {
    const productData = req.body;

    const result = await this.productService.createProduct(productData);

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };

  public updateProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updateData = req.body;

    const result = await this.productService.updateProduct({ id, data: updateData });

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const result = await this.productService.deleteProduct({ id });

    return next({
      code: result.code,
    });
  };

  public updateProductStock = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { stock } = req.body;

    const result = await this.productService.updateProductStock({ id, stock });

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };

  public updateProductStatus = async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    const result = await this.productService.updateProductStatus({ id, status });

    if (!result.product) {
      return next({ code: result.code });
    }

    return next({
      data: { product: result.product },
      code: result.code,
    });
  };
}
