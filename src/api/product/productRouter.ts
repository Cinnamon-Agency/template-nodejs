import express from 'express';
import { validate } from '@middleware/validation';
import { container } from 'tsyringe';
import { requireToken } from '@middleware/auth';
import { ProductController } from './productController';
import { 
  createProductSchema, 
  updateProductSchema, 
  getProductsSchema,
  getProductByIdSchema,
  getProductBySkuSchema,
  updateProductStockSchema,
  updateProductStatusSchema
} from './productInput';

const productController = container.resolve(ProductController);
export const productRouter = express.Router();

// Public routes - anyone can view products
productRouter.get('/', validate(getProductsSchema), productController.getAllProducts);
productRouter.get('/:id', validate(getProductByIdSchema), productController.getProductById);
productRouter.get('/sku/:sku', validate(getProductBySkuSchema), productController.getProductBySku);

// Protected routes - require authentication
productRouter.post('/', requireToken(), validate(createProductSchema), productController.createProduct);
productRouter.put('/:id', requireToken(), validate(updateProductSchema), productController.updateProduct);
productRouter.delete('/:id', requireToken(), validate(getProductByIdSchema), productController.deleteProduct);
productRouter.patch('/:id/stock', requireToken(), validate(updateProductStockSchema), productController.updateProductStock);
productRouter.patch('/:id/status', requireToken(), validate(updateProductStatusSchema), productController.updateProductStatus);
