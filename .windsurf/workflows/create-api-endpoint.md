---
description: Create a new API endpoint following project standards
---

# Create New API Endpoint

## **Steps to Create API Endpoint**

1. **Define the route structure**
   - Create route file in `src/api/` directory
   - Follow package-by-feature structure
   - Use kebab-case for file names

2. **Implement the controller**
   ```typescript
   // src/api/feature-name/controller.ts
   import { Request, Response } from 'express';
   import { FeatureService } from './service';
   
   export class FeatureController {
     constructor(private featureService: FeatureService) {}
   
     async createFeature(req: Request, res: Response) {
       try {
         const result = await this.featureService.create(req.body);
         res.status(201).json({ success: true, data: result });
       } catch (error) {
         res.status(400).json({ success: false, error: error.message });
       }
     }
   }
   ```

3. **Create service layer**
   ```typescript
   // src/api/feature-name/service.ts
   import { PrismaClient } from '@prisma/client';
   
   export class FeatureService {
     constructor(private prisma: PrismaClient) {}
   
     async create(data: CreateFeatureDto) {
       return await this.prisma.feature.create({ data });
     }
   }
   ```

4. **Add validation schemas**
   ```typescript
   // src/api/feature-name/validation.ts
   import Joi from 'joi';
   
   export const createFeatureSchema = Joi.object({
     name: Joi.string().required(),
     description: Joi.string().optional(),
   });
   ```

5. **Register routes**
   ```typescript
   // src/api/feature-name/router.ts
   import { Router } from 'express';
   import { FeatureController } from './controller';
   
   const router = Router();
   const controller = new FeatureController(/* dependencies */);
   
   router.post('/', validate(createFeatureSchema), controller.createFeature);
   
   export { router as featureRouter };
   ```

6. **Update main router**
   - Import and register the new router in `src/api/index.ts`

7. **Add database operations**
   - Update Prisma schema if needed
   - Create migration: `npm run migrate:dev -- --name add-feature`

8. **Write tests**
   ```typescript
   // tests/api/feature-name.test.ts
   describe('Feature API', () => {
     it('should create feature', async () => {
       // Test implementation
     });
   });
   ```

9. **Update documentation**
   - Add Swagger annotations
   - Update API documentation

## **Quality Checks**
- [ ] TypeScript compilation passes
- [ ] ESLint rules pass
- [ ] Tests written and passing
- [ ] API documented with Swagger
- [ ] Error handling implemented
- [ ] Input validation added
- [ ] Database operations use transactions where needed

## **Example Commands**
```bash
# Create migration
npm run migrate:dev -- --name add-feature

# Run tests
npm test

# Build project
npm run build

# Start development
npm run dev
```
