import { AsyncResponse } from '@common';
import { ShippingRateType, ShippingZone, ShippingRate, ShippingZoneCountry } from '@prisma/client';

export interface CreateShippingZoneCountry {
  countryCode: string;
  countryName: string;
}

export interface CreateShippingRate {
  name: string;
  description?: string;
  rateType: ShippingRateType;
  baseRate: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  freeShippingMin?: number;
  estimatedDays?: number;
  priority?: number;
  weightUnit?: string;
  pricePerUnit?: number;
  minWeight?: number;
  maxWeight?: number;
}

export interface CreateShippingZone {
  name: string;
  description?: string;
  countries?: CreateShippingZoneCountry[];
  rates?: CreateShippingRate[];
}

export interface UpdateShippingZone {
  name?: string;
  description?: string;
  isActive?: boolean;
  countries?: CreateShippingZoneCountry[];
  rates?: CreateShippingRate[];
}

export interface UpdateShippingRate {
  name?: string;
  description?: string;
  rateType?: ShippingRateType;
  baseRate?: number;
  minOrderValue?: number;
  maxOrderValue?: number;
  freeShippingMin?: number;
  estimatedDays?: number;
  isActive?: boolean;
  priority?: number;
  weightUnit?: string;
  pricePerUnit?: number;
  minWeight?: number;
  maxWeight?: number;
}

export interface ShippingZoneFilter {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  countryCode?: string;
  sortBy?: 'name' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ShippingZoneWithRelations extends ShippingZone {
  countries: ShippingZoneCountry[];
  rates: ShippingRate[];
}

export interface PaginatedShippingZones {
  items: ShippingZoneWithRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalculateShippingRequest {
  countryCode: string;
  orderValue: number;
  totalWeight?: number;
}

export interface CalculateShippingResponse {
  availableRates: Array<{
    id: string;
    name: string;
    description?: string;
    cost: number;
    estimatedDays?: number;
    isFreeShipping: boolean;
    zoneName: string;
  }>;
  cheapestRate?: {
    id: string;
    name: string;
    cost: number;
  };
  fastestRate?: {
    id: string;
    name: string;
    estimatedDays: number;
  };
}

export interface IShippingZoneService {
  createShippingZone(data: ICreateShippingZone): AsyncResponse<ShippingZoneWithRelations>;
  getShippingZones(data: IGetShippingZones): AsyncResponse<PaginatedShippingZones>;
  getShippingZoneById(data: IGetShippingZoneById): AsyncResponse<ShippingZoneWithRelations>;
  updateShippingZone(data: IUpdateShippingZone): AsyncResponse<ShippingZoneWithRelations>;
  deleteShippingZone(data: IDeleteShippingZone): AsyncResponse<void>;
  addCountryToZone(data: IAddCountryToZone): AsyncResponse<ShippingZoneWithRelations>;
  removeCountryFromZone(data: IRemoveCountryFromZone): AsyncResponse<ShippingZoneWithRelations>;
  addRateToZone(data: IAddRateToZone): AsyncResponse<ShippingZoneWithRelations>;
  updateRate(data: IUpdateRate): AsyncResponse<ShippingRate>;
  deleteRate(data: IDeleteRate): AsyncResponse<void>;
  calculateShipping(data: ICalculateShipping): AsyncResponse<CalculateShippingResponse>;
  getZoneByCountry(data: IGetZoneByCountry): AsyncResponse<ShippingZoneWithRelations>;
}

export interface ICreateShippingZone {
  name: string;
  description?: string;
  countries?: CreateShippingZoneCountry[];
  rates?: CreateShippingRate[];
}

export interface IGetShippingZones {
  filter?: ShippingZoneFilter;
}

export interface IGetShippingZoneById {
  id: string;
}

export interface IUpdateShippingZone {
  id: string;
  data: UpdateShippingZone;
}

export interface IDeleteShippingZone {
  id: string;
}

export interface IAddCountryToZone {
  zoneId: string;
  countryCode: string;
  countryName: string;
}

export interface IRemoveCountryFromZone {
  zoneId: string;
  countryCode: string;
}

export interface IAddRateToZone {
  zoneId: string;
  rate: CreateShippingRate;
}

export interface IUpdateRate {
  rateId: string;
  data: UpdateShippingRate;
}

export interface IDeleteRate {
  rateId: string;
}

export interface ICalculateShipping {
  countryCode: string;
  orderValue: number;
  totalWeight?: number;
}

export interface IGetZoneByCountry {
  countryCode: string;
}
