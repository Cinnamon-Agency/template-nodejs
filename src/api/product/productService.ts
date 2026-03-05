import { ResponseCode, serviceMethod, normalizePagination, buildPaginatedResult } from '@common';
import { getPrismaClient } from '@services/prisma';
import { autoInjectable, singleton } from 'tsyringe';
import { ProductStatus, ProductCharacteristicType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  IProductService,
  ICreateProduct,
  IGetProducts,
  IGetProductById,
  IGetProductBySku,
  IUpdateProduct,
  IDeleteProduct,
  IUpdateProductStock,
  IUpdateProductStatus,
  IGetProductStats
} from './interfaces';

@singleton()
@autoInjectable()
export class ProductService implements IProductService {
  @serviceMethod()
  async createProduct({ name, description, price, sku, stock, status, characteristics, categoryIds }: ICreateProduct) {
    const existingProduct = await getPrismaClient().product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return { code: ResponseCode.CONFLICT };
    }

    const product = await getPrismaClient().product.create({
      data: {
        name,
        description,
        price,
        sku,
        stock: stock || 0,
        status: status || ProductStatus.ACTIVE,
        characteristics: characteristics
          ? {
              create: characteristics.map((char: any) => ({
                name: char.name,
                value: char.value,
                type: char.type,
              })),
            }
          : undefined,
        categories: categoryIds
          ? {
              create: categoryIds.map((categoryId: any) => ({
                categoryId,
              })),
            }
          : undefined,
      },
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async getProducts({ filter = {} }: IGetProducts) {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      minPrice,
      maxPrice,
      categoryIds,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    // Validate sortBy field to prevent invalid queries
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'price', 'stock', 'sku'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    const pagination = normalizePagination(page, limit);
    const skip = (pagination.page - 1) * pagination.perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (categoryIds && categoryIds.length > 0) {
      where.categories = {
        some: {
          categoryId: {
            in: categoryIds,
          },
        },
      };
    }

    const [products, total] = await Promise.all([
      getPrismaClient().product.findMany({
        where,
        skip,
        take: pagination.perPage,
        orderBy: {
          [validSortBy]: validSortOrder,
        },
        include: {
          characteristics: true,
          categories: {
            include: {
              category: true,
            },
          },
          media: true,
        },
      }),
      getPrismaClient().product.count({ where }),
    ]);

    return {
      items: products,
      pagination: {
        page: pagination.page,
        limit: pagination.perPage,
        total,
        totalPages: Math.ceil(total / pagination.perPage),
      },
      code: ResponseCode.OK,
    };
  }

  @serviceMethod()
  async getProductById({ id }: IGetProductById) {
    const product = await getPrismaClient().product.findUnique({
      where: { id },
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    if (!product) {
      return { code: ResponseCode.NOT_FOUND };
    }

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async getProductBySku({ sku }: IGetProductBySku) {
    const product = await getPrismaClient().product.findUnique({
      where: { sku },
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    if (!product) {
      return { code: ResponseCode.NOT_FOUND };
    }

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async updateProduct({ id, data }: IUpdateProduct) {
    const { characteristics, categoryIds, ...productData } = data;

    const existingProduct = await getPrismaClient().product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const updateData: any = {
      ...productData,
    };

    if (characteristics) {
      updateData.characteristics = {
        deleteMany: {},
        create: characteristics.map(char => ({
          name: char.name,
          value: char.value,
          type: char.type,
        })),
      };
    }

    if (categoryIds) {
      updateData.categories = {
        deleteMany: {},
        create: categoryIds.map(categoryId => ({
          categoryId,
        })),
      };
    }

    const product = await getPrismaClient().product.update({
      where: { id },
      data: updateData,
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async deleteProduct({ id }: IDeleteProduct) {
    const existingProduct = await getPrismaClient().product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().product.delete({
      where: { id },
    });

    return { code: ResponseCode.OK };
  }

  @serviceMethod()
  async updateProductStock({ id, stock }: IUpdateProductStock) {
    if (stock < 0) {
      return { code: ResponseCode.BAD_REQUEST };
    }

    const product = await getPrismaClient().product.update({
      where: { id },
      data: { stock },
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async updateProductStatus({ id, status }: IUpdateProductStatus) {
    const product = await getPrismaClient().product.update({
      where: { id },
      data: { status },
      include: {
        characteristics: true,
        categories: {
          include: {
            category: true,
          },
        },
        media: true,
      },
    });

    return { product, code: ResponseCode.OK };
  }

  @serviceMethod()
  async getProductStats() {
    const [
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      archivedProducts,
      lowStockProducts,
      outOfStockProducts,
      productAggregates,
    ] = await Promise.all([
      getPrismaClient().product.count(),
      getPrismaClient().product.count({
        where: { status: ProductStatus.ACTIVE },
      }),
      getPrismaClient().product.count({
        where: { status: ProductStatus.INACTIVE },
      }),
      getPrismaClient().product.count({
        where: { status: ProductStatus.DRAFT },
      }),
      getPrismaClient().product.count({
        where: { status: ProductStatus.ARCHIVED },
      }),
      getPrismaClient().product.count({
        where: { stock: { gt: 0, lte: 10 } },
      }),
      getPrismaClient().product.count({
        where: { stock: 0 },
      }),
      getPrismaClient().product.aggregate({
        _sum: {
          stock: true,
        },
        _avg: {
          price: true,
        },
      }),
    ]);

    const products = await getPrismaClient().product.findMany({
      select: {
        price: true,
        stock: true,
      },
    });

    const totalInventoryValue = products.reduce((sum, product) => {
      const productValue = new Decimal(product.price.toString()).mul(product.stock);
      return sum.add(productValue);
    }, new Decimal(0));

    const averagePrice = productAggregates._avg.price
      ? new Decimal(productAggregates._avg.price.toString())
      : new Decimal(0);

    const stats: IGetProductStats = {
      totalProducts,
      activeProducts,
      inactiveProducts,
      draftProducts,
      archivedProducts,
      lowStockProducts,
      outOfStockProducts,
      totalInventoryValue: totalInventoryValue.toString(),
      averagePrice: averagePrice.toString(),
    };

    return { stats, code: ResponseCode.OK };
  }
}
