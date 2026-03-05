import express from 'express';
import { container } from 'tsyringe';
import { ShippingController } from './shippingController';
import { requireToken } from '@middleware/auth';
import { RoleType } from '@prisma/client';
import { validate } from '@middleware/validation';
import {
  createShippingZoneSchema,
  updateShippingZoneSchema,
  addCountrySchema,
  addRateSchema,
  updateRateSchema,
  calculateShippingSchema,
} from './shippingInput';

export const shippingRouter = express.Router();

const shippingController = container.resolve(ShippingController);

shippingRouter.get('/', shippingController.getShippingZones.bind(shippingController));
shippingRouter.get('/calculate', validate(calculateShippingSchema), shippingController.calculateShipping.bind(shippingController));
shippingRouter.get('/country/:countryCode', shippingController.getZoneByCountry.bind(shippingController));
shippingRouter.get('/:id', shippingController.getShippingZoneById.bind(shippingController));

shippingRouter.post(
  '/',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  validate(createShippingZoneSchema),
  shippingController.createShippingZone.bind(shippingController)
);

shippingRouter.put(
  '/:id',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  validate(updateShippingZoneSchema),
  shippingController.updateShippingZone.bind(shippingController)
);

shippingRouter.delete(
  '/:id',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  shippingController.deleteShippingZone.bind(shippingController)
);

shippingRouter.post(
  '/:id/countries',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  validate(addCountrySchema),
  shippingController.addCountryToZone.bind(shippingController)
);

shippingRouter.delete(
  '/:id/countries/:countryCode',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  shippingController.removeCountryFromZone.bind(shippingController)
);

shippingRouter.post(
  '/:id/rates',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  validate(addRateSchema),
  shippingController.addRateToZone.bind(shippingController)
);

shippingRouter.put(
  '/rates/:rateId',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  validate(updateRateSchema),
  shippingController.updateRate.bind(shippingController)
);

shippingRouter.delete(
  '/rates/:rateId',
  requireToken([RoleType.ADMIN, RoleType.SUPERADMIN]),
  shippingController.deleteRate.bind(shippingController)
);
