import { Request, Response, NextFunction } from 'express';
import { autoInjectable, singleton } from 'tsyringe';
import { ShippingZoneService } from './shippingService';

@singleton()
@autoInjectable()
export class ShippingController {
  constructor(private readonly shippingZoneService: ShippingZoneService) {}

  async createShippingZone(req: Request, res: Response, next: NextFunction) {
    const { name, description, countries, rates } = res.locals.input;

    const result = await this.shippingZoneService.createShippingZone({
      name,
      description,
      countries,
      rates,
    });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async getShippingZones(req: Request, res: Response, next: NextFunction) {
    const filter = req.query;

    const result = await this.shippingZoneService.getShippingZones({ filter });

    return next({
      code: result.code,
      data: {
        items: result.items,
        pagination: result.pagination,
      },
    });
  }

  async getShippingZoneById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const result = await this.shippingZoneService.getShippingZoneById({ id });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async updateShippingZone(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const data = res.locals.input;

    const result = await this.shippingZoneService.updateShippingZone({ id, data });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async deleteShippingZone(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const result = await this.shippingZoneService.deleteShippingZone({ id });

    return next({
      code: result.code,
    });
  }

  async addCountryToZone(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { countryCode, countryName } = res.locals.input;

    const result = await this.shippingZoneService.addCountryToZone({
      zoneId: id,
      countryCode,
      countryName,
    });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async removeCountryFromZone(req: Request, res: Response, next: NextFunction) {
    const { id, countryCode } = req.params;

    const result = await this.shippingZoneService.removeCountryFromZone({
      zoneId: id,
      countryCode,
    });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async addRateToZone(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const rate = res.locals.input;

    const result = await this.shippingZoneService.addRateToZone({
      zoneId: id,
      rate,
    });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }

  async updateRate(req: Request, res: Response, next: NextFunction) {
    const { rateId } = req.params;
    const data = res.locals.input;

    const result = await this.shippingZoneService.updateRate({ rateId, data });

    return next({
      code: result.code,
      data: { rate: result.rate },
    });
  }

  async deleteRate(req: Request, res: Response, next: NextFunction) {
    const { rateId } = req.params;

    const result = await this.shippingZoneService.deleteRate({ rateId });

    return next({
      code: result.code,
    });
  }

  async calculateShipping(req: Request, res: Response, next: NextFunction) {
    const { countryCode, orderValue } = req.query;

    const result = await this.shippingZoneService.calculateShipping({
      countryCode: countryCode as string,
      orderValue: Number(orderValue),
    });

    return next({
      code: result.code,
      data: { shipping: result.shipping },
    });
  }

  async getZoneByCountry(req: Request, res: Response, next: NextFunction) {
    const { countryCode } = req.params;

    const result = await this.shippingZoneService.getZoneByCountry({ countryCode });

    return next({
      code: result.code,
      data: { shippingZone: result.shippingZone },
    });
  }
}
