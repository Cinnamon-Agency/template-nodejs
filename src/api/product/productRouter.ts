import express from 'express';
import { validate } from '@middleware/validation';
import { container } from 'tsyringe';
import { requireToken } from '@middleware/auth';
import { RoleType } from '@prisma/client';
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
productRouter.get('/stats', requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]), productController.getProductStats);
productRouter.get('/:id', validate(getProductByIdSchema), productController.getProductById);
productRouter.get('/sku/:sku', validate(getProductBySkuSchema), productController.getProductBySku);

// Protected routes - require ADMIN role
productRouter.post('/', requireToken([RoleType.ADMIN]), validate(createProductSchema), productController.createProduct);
productRouter.put('/:id', requireToken([RoleType.ADMIN]), validate(updateProductSchema), productController.updateProduct);
productRouter.delete('/:id', requireToken([RoleType.ADMIN]), validate(getProductByIdSchema), productController.deleteProduct);
productRouter.patch('/:id/stock', requireToken([RoleType.ADMIN]), validate(updateProductStockSchema), productController.updateProductStock);
productRouter.patch('/:id/status', requireToken([RoleType.ADMIN]), validate(updateProductStatusSchema), productController.updateProductStatus);
