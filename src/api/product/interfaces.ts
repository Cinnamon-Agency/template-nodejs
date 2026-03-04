import { AsyncResponse } from '@common'
import { ProductStatus, ProductCharacteristicType, Product, Category, Media } from '@prisma/client';

export interface CreateProductCharacteristic {
  name: string;
  value: string;
  type: ProductCharacteristicType;
}

export interface CreateProduct {
  name: string;
  description?: string;
  price: number;
  sku: string;
  stock?: number;
  status?: ProductStatus;
  characteristics?: CreateProductCharacteristic[];
  categoryIds?: string[];
}

export interface UpdateProductCharacteristic {
  name?: string;
  value?: string;
  type?: ProductCharacteristicType;
}

export interface UpdateProduct {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  status?: ProductStatus;
  characteristics?: CreateProductCharacteristic[];
  categoryIds?: string[];
}

export interface ProductFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  categoryIds?: string[];
  sortBy?: 'name' | 'price' | 'stock' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateCategory {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategory {
  name?: string;
  description?: string;
  parentId?: string;
}

export interface CategoryFilter {
  page?: number;
  limit?: number;
  search?: string;
  parentId?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductWithRelations extends Product {
  characteristics: Array<{
    id: string;
    name: string;
    value: string;
    type: ProductCharacteristicType;
    createdAt: Date;
    updatedAt: Date;
    productId: string;
  }>;
  categories: Array<{
    id: string;
    categoryId: string;
    productId: string;
    category: Category;
  }>;
  media: Media[];
}

export interface PaginatedProducts {
  items: ProductWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Service Interfaces - Following project naming convention with AsyncResponse and specific types
export interface IProductService {
  createProduct(data: ICreateProduct): AsyncResponse<ProductWithRelations>;
  getProducts(data: IGetProducts): AsyncResponse<PaginatedProducts>;
  getProductById(data: IGetProductById): AsyncResponse<ProductWithRelations>;
  getProductBySku(data: IGetProductBySku): AsyncResponse<ProductWithRelations>;
  updateProduct(data: IUpdateProduct): AsyncResponse<ProductWithRelations>;
  deleteProduct(data: IDeleteProduct): AsyncResponse<void>;
  updateProductStock(data: IUpdateProductStock): AsyncResponse<ProductWithRelations>;
  updateProductStatus(data: IUpdateProductStatus): AsyncResponse<ProductWithRelations>;
}

// Service Method Interfaces
export interface ICreateProduct {
  name: string;
  description?: string;
  price: number;
  sku: string;
  stock?: number;
  status?: ProductStatus;
  characteristics?: CreateProductCharacteristic[];
  categoryIds?: string[];
}

export interface IGetProducts {
  filter?: ProductFilter;
}

export interface IGetProductById {
  id: string;
}

export interface IGetProductBySku {
  sku: string;
}

export interface IUpdateProduct {
  id: string;
  data: UpdateProduct;
}

export interface IDeleteProduct {
  id: string;
}

export interface IUpdateProductStock {
  id: string;
  stock: number;
}

export interface IUpdateProductStatus {
  id: string;
  status: ProductStatus;
}
