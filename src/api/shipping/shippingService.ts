import { ResponseCode, serviceMethod, normalizePagination } from '@common';
import { getPrismaClient } from '@services/prisma';
import { autoInjectable, singleton } from 'tsyringe';
import { ShippingRateType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  IShippingZoneService,
  ICreateShippingZone,
  IGetShippingZones,
  IGetShippingZoneById,
  IUpdateShippingZone,
  IDeleteShippingZone,
  IAddCountryToZone,
  IRemoveCountryFromZone,
  IAddRateToZone,
  IUpdateRate,
  IDeleteRate,
  ICalculateShipping,
  IGetZoneByCountry,
  CalculateShippingResponse,
} from './interfaces';

@singleton()
@autoInjectable()
export class ShippingZoneService implements IShippingZoneService {
  @serviceMethod()
  async createShippingZone({ name, description, countries, rates }: ICreateShippingZone) {
    const existingZone = await getPrismaClient().shippingZone.findUnique({
      where: { name },
    });

    if (existingZone) {
      return { code: ResponseCode.CONFLICT };
    }

    const shippingZone = await getPrismaClient().shippingZone.create({
      data: {
        name,
        description,
        countries: countries
          ? {
              create: countries.map((country) => ({
                countryCode: country.countryCode.toUpperCase(),
                countryName: country.countryName,
              })),
            }
          : undefined,
        rates: rates
          ? {
              create: rates.map((rate) => ({
                name: rate.name,
                description: rate.description,
                rateType: rate.rateType,
                baseRate: rate.baseRate,
                minOrderValue: rate.minOrderValue,
                maxOrderValue: rate.maxOrderValue,
                freeShippingMin: rate.freeShippingMin,
                estimatedDays: rate.estimatedDays,
                priority: rate.priority || 0,
                weightUnit: rate.weightUnit,
                pricePerUnit: rate.pricePerUnit,
                minWeight: rate.minWeight,
                maxWeight: rate.maxWeight,
              })),
            }
          : undefined,
      },
      include: {
        countries: true,
        rates: true,
      },
    });

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async getShippingZones({ filter = {} }: IGetShippingZones) {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      countryCode,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const validSortOrder = sortOrder === 'asc' || sortOrder === 'desc' ? sortOrder : 'desc';

    const pagination = normalizePagination(page, limit);
    const skip = (pagination.page - 1) * pagination.perPage;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (countryCode) {
      where.countries = {
        some: {
          countryCode: countryCode.toUpperCase(),
        },
      };
    }

    const [shippingZones, total] = await Promise.all([
      getPrismaClient().shippingZone.findMany({
        where,
        skip,
        take: pagination.perPage,
        orderBy: {
          [validSortBy]: validSortOrder,
        },
        include: {
          countries: true,
          rates: {
            where: { isActive: true },
            orderBy: { priority: 'desc' },
          },
        },
      }),
      getPrismaClient().shippingZone.count({ where }),
    ]);

    return {
      items: shippingZones,
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
  async getShippingZoneById({ id }: IGetShippingZoneById) {
    const shippingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id },
      include: {
        countries: true,
        rates: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!shippingZone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async updateShippingZone({ id, data }: IUpdateShippingZone) {
    const { countries, rates, ...zoneData } = data;

    const existingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const updateData: any = {
      ...zoneData,
    };

    if (countries) {
      updateData.countries = {
        deleteMany: {},
        create: countries.map((country) => ({
          countryCode: country.countryCode.toUpperCase(),
          countryName: country.countryName,
        })),
      };
    }

    if (rates) {
      updateData.rates = {
        deleteMany: {},
        create: rates.map((rate) => ({
          name: rate.name,
          description: rate.description,
          rateType: rate.rateType,
          baseRate: rate.baseRate,
          minOrderValue: rate.minOrderValue,
          maxOrderValue: rate.maxOrderValue,
          freeShippingMin: rate.freeShippingMin,
          estimatedDays: rate.estimatedDays,
          priority: rate.priority || 0,
          weightUnit: rate.weightUnit,
          pricePerUnit: rate.pricePerUnit,
          minWeight: rate.minWeight,
          maxWeight: rate.maxWeight,
        })),
      };
    }

    const shippingZone = await getPrismaClient().shippingZone.update({
      where: { id },
      data: updateData,
      include: {
        countries: true,
        rates: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async deleteShippingZone({ id }: IDeleteShippingZone) {
    const existingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id },
    });

    if (!existingZone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().shippingZone.delete({
      where: { id },
    });

    return { code: ResponseCode.OK };
  }

  @serviceMethod()
  async addCountryToZone({ zoneId, countryCode, countryName }: IAddCountryToZone) {
    const zone = await getPrismaClient().shippingZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const existingCountry = await getPrismaClient().shippingZoneCountry.findUnique({
      where: {
        shippingZoneId_countryCode: {
          shippingZoneId: zoneId,
          countryCode: countryCode.toUpperCase(),
        },
      },
    });

    if (existingCountry) {
      return { code: ResponseCode.CONFLICT };
    }

    await getPrismaClient().shippingZoneCountry.create({
      data: {
        shippingZoneId: zoneId,
        countryCode: countryCode.toUpperCase(),
        countryName,
      },
    });

    const shippingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        countries: true,
        rates: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async removeCountryFromZone({ zoneId, countryCode }: IRemoveCountryFromZone) {
    const country = await getPrismaClient().shippingZoneCountry.findUnique({
      where: {
        shippingZoneId_countryCode: {
          shippingZoneId: zoneId,
          countryCode: countryCode.toUpperCase(),
        },
      },
    });

    if (!country) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().shippingZoneCountry.delete({
      where: {
        shippingZoneId_countryCode: {
          shippingZoneId: zoneId,
          countryCode: countryCode.toUpperCase(),
        },
      },
    });

    const shippingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        countries: true,
        rates: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async addRateToZone({ zoneId, rate }: IAddRateToZone) {
    const zone = await getPrismaClient().shippingZone.findUnique({
      where: { id: zoneId },
    });

    if (!zone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().shippingRate.create({
      data: {
        shippingZoneId: zoneId,
        name: rate.name,
        description: rate.description,
        rateType: rate.rateType,
        baseRate: rate.baseRate,
        minOrderValue: rate.minOrderValue,
        maxOrderValue: rate.maxOrderValue,
        freeShippingMin: rate.freeShippingMin,
        estimatedDays: rate.estimatedDays,
        priority: rate.priority || 0,
        weightUnit: rate.weightUnit,
        pricePerUnit: rate.pricePerUnit,
        minWeight: rate.minWeight,
        maxWeight: rate.maxWeight,
      },
    });

    const shippingZone = await getPrismaClient().shippingZone.findUnique({
      where: { id: zoneId },
      include: {
        countries: true,
        rates: {
          orderBy: { priority: 'desc' },
        },
      },
    });

    return { shippingZone, code: ResponseCode.OK };
  }

  @serviceMethod()
  async updateRate({ rateId, data }: IUpdateRate) {
    const existingRate = await getPrismaClient().shippingRate.findUnique({
      where: { id: rateId },
    });

    if (!existingRate) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const rate = await getPrismaClient().shippingRate.update({
      where: { id: rateId },
      data,
    });

    return { rate, code: ResponseCode.OK };
  }

  @serviceMethod()
  async deleteRate({ rateId }: IDeleteRate) {
    const existingRate = await getPrismaClient().shippingRate.findUnique({
      where: { id: rateId },
    });

    if (!existingRate) {
      return { code: ResponseCode.NOT_FOUND };
    }

    await getPrismaClient().shippingRate.delete({
      where: { id: rateId },
    });

    return { code: ResponseCode.OK };
  }

  @serviceMethod()
  async calculateShipping({ countryCode, orderValue, totalWeight }: ICalculateShipping) {
    const zone = await getPrismaClient().shippingZone.findFirst({
      where: {
        isActive: true,
        countries: {
          some: {
            countryCode: countryCode.toUpperCase(),
          },
        },
      },
      include: {
        rates: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!zone || zone.rates.length === 0) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const availableRates = zone.rates
      .filter((rate) => {
        if (rate.minOrderValue && orderValue < Number(rate.minOrderValue)) return false;
        if (rate.maxOrderValue && orderValue > Number(rate.maxOrderValue)) return false;
        if (rate.rateType === ShippingRateType.WEIGHT_BASED) {
          if (!totalWeight) return false;
          if (rate.minWeight && totalWeight < Number(rate.minWeight)) return false;
          if (rate.maxWeight && totalWeight > Number(rate.maxWeight)) return false;
        }
        return true;
      })
      .map((rate) => {
        let cost = Number(rate.baseRate);
        let isFreeShipping = false;

        if (rate.freeShippingMin && orderValue >= Number(rate.freeShippingMin)) {
          cost = 0;
          isFreeShipping = true;
        } else if (rate.rateType === ShippingRateType.PRICE_BASED) {
          cost = (orderValue * Number(rate.baseRate)) / 100;
        } else if (rate.rateType === ShippingRateType.WEIGHT_BASED) {
          if (totalWeight && rate.pricePerUnit) {
            cost = Number(rate.baseRate) + (totalWeight * Number(rate.pricePerUnit));
          }
        } else if (rate.rateType === ShippingRateType.FREE_SHIPPING) {
          cost = 0;
          isFreeShipping = true;
        }

        return {
          id: rate.id,
          name: rate.name,
          description: rate.description || undefined,
          cost: Math.round(cost * 100) / 100,
          estimatedDays: rate.estimatedDays || undefined,
          isFreeShipping,
          zoneName: zone.name,
        };
      });

    if (availableRates.length === 0) {
      return { code: ResponseCode.NOT_FOUND };
    }

    const cheapestRate = availableRates.reduce((prev, curr) =>
      curr.cost < prev.cost ? curr : prev
    );

    const ratesWithEstimatedDays = availableRates.filter((r) => r.estimatedDays !== undefined);
    const fastestRate =
      ratesWithEstimatedDays.length > 0
        ? ratesWithEstimatedDays.reduce((prev, curr) =>
            curr.estimatedDays! < prev.estimatedDays! ? curr : prev
          )
        : undefined;

    const response: CalculateShippingResponse = {
      availableRates,
      cheapestRate: {
        id: cheapestRate.id,
        name: cheapestRate.name,
        cost: cheapestRate.cost,
      },
      fastestRate: fastestRate
        ? {
            id: fastestRate.id,
            name: fastestRate.name,
            estimatedDays: fastestRate.estimatedDays!,
          }
        : undefined,
    };

    return { shipping: response, code: ResponseCode.OK };
  }

  @serviceMethod()
  async getZoneByCountry({ countryCode }: IGetZoneByCountry) {
    const shippingZone = await getPrismaClient().shippingZone.findFirst({
      where: {
        isActive: true,
        countries: {
          some: {
            countryCode: countryCode.toUpperCase(),
          },
        },
      },
      include: {
        countries: true,
        rates: {
          where: { isActive: true },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!shippingZone) {
      return { code: ResponseCode.NOT_FOUND };
    }

    return { shippingZone, code: ResponseCode.OK };
  }
}
