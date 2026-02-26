# API Documentation Agent Guide

## Role
API Documentation & Testing Specialist

## Scope
This directory (`src/documentation/`) contains API documentation generation, Swagger/OpenAPI specifications, and documentation utilities. The API Documentation Agent ensures comprehensive and accurate API documentation.

## Key Responsibilities in This Directory

### 1. Swagger/OpenAPI Documentation
- Maintain OpenAPI specifications for all endpoints
- Document request/response schemas
- Provide clear endpoint descriptions and examples
- Keep documentation synchronized with code changes

### 2. Documentation Generation
- Configure Swagger UI for interactive documentation
- Generate API documentation from code annotations
- Maintain documentation versioning
- Export documentation in multiple formats

### 3. API Testing & Validation
- Validate API responses against schemas
- Test documented examples
- Ensure documentation accuracy
- Maintain Postman collections

## Standards for This Directory

### Swagger Annotation Pattern
```typescript
/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of all users
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
```

### Schema Definition Pattern
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique user identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         name:
 *           type: string
 *           description: User full name
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         email: "user@example.com"
 *         name: "John Doe"
 *         createdAt: "2024-01-01T00:00:00.000Z"
 */
```

## Common Tasks

### Documenting a New Endpoint

1. **Add Swagger annotations to controller**
```typescript
/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     tags:
 *       - Posts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostDto'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Post'
 */
```

2. **Define request/response schemas**
3. **Add examples for common use cases**
4. **Document error responses**
5. **Test documentation in Swagger UI**

### Updating Existing Documentation

1. Review endpoint changes in controller
2. Update Swagger annotations to match
3. Update schema definitions if data structure changed
4. Update examples to reflect new behavior
5. Test updated documentation

### Creating Schema Components

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     CreatePostDto:
 *       type: object
 *       required:
 *         - title
 *         - content
 *       properties:
 *         title:
 *           type: string
 *           minLength: 1
 *           maxLength: 200
 *         content:
 *           type: string
 *           minLength: 1
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *       example:
 *         title: "My First Post"
 *         content: "This is the content of my post"
 *         tags: ["tutorial", "nodejs"]
 */
```

## Documentation Best Practices

### 1. Completeness
- Document all public endpoints
- Include all request parameters
- Document all possible response codes
- Provide examples for complex requests

### 2. Clarity
- Use clear, concise descriptions
- Explain purpose and behavior
- Document edge cases and limitations
- Include usage examples

### 3. Accuracy
- Keep documentation synchronized with code
- Test documented examples
- Validate schemas against actual responses
- Update documentation with code changes

### 4. Organization
- Group related endpoints with tags
- Use consistent naming conventions
- Order endpoints logically
- Separate public and internal APIs

## Swagger Configuration

### Basic Setup
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/api/**/*.ts', './src/routes/**/*.ts'],
};

const specs = swaggerJsdoc(options);
```

### Security Documentation
```typescript
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token for authentication
 */
```

## Response Documentation Patterns

### Success Response
```typescript
/**
 * @swagger
 * responses:
 *   200:
 *     description: Successful operation
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *             data:
 *               $ref: '#/components/schemas/User'
 */
```

### Error Response
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Error:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             code:
 *               type: string
 *               example: "VALIDATION_ERROR"
 *             message:
 *               type: string
 *               example: "Invalid input data"
 *             details:
 *               type: array
 *               items:
 *                 type: object
 */
```

### Pagination Response
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Pagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         total:
 *           type: integer
 *           example: 100
 *         totalPages:
 *           type: integer
 *           example: 10
 */
```

## Testing Documentation

### Manual Testing
1. Open Swagger UI at `/api-docs`
2. Test each endpoint using "Try it out"
3. Verify request/response formats
4. Check authentication flows
5. Validate error responses

### Automated Validation
```typescript
import { validateAgainstSchema } from './validation';

// Validate response matches documented schema
const response = await fetch('/api/users');
const data = await response.json();
validateAgainstSchema(data, 'User');
```

## Common Documentation Patterns

### Query Parameters
```typescript
/**
 * @swagger
 * parameters:
 *   - in: query
 *     name: search
 *     schema:
 *       type: string
 *     description: Search term for filtering
 *   - in: query
 *     name: sortBy
 *     schema:
 *       type: string
 *       enum: [createdAt, name, email]
 *     description: Field to sort by
 *   - in: query
 *     name: order
 *     schema:
 *       type: string
 *       enum: [asc, desc]
 *       default: desc
 *     description: Sort order
 */
```

### Path Parameters
```typescript
/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 */
```

### Request Body
```typescript
/**
 * @swagger
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         $ref: '#/components/schemas/CreateUserDto'
 *     multipart/form-data:
 *       schema:
 *         type: object
 *         properties:
 *           file:
 *             type: string
 *             format: binary
 */
```

## Integration Points

### Controllers (`src/api/`)
- Add Swagger annotations to all controller methods
- Document request/response types
- Include authentication requirements

### Routes (`src/routes/`)
- Document route-level middleware
- Group related routes with tags
- Document route parameters

### DTOs
- Create schema definitions for all DTOs
- Include validation rules in documentation
- Provide examples for complex objects

## Maintenance Checklist

- [ ] All endpoints have Swagger documentation
- [ ] All schemas are defined in components
- [ ] Examples are provided for complex requests
- [ ] Error responses are documented
- [ ] Authentication requirements are clear
- [ ] Pagination is documented where applicable
- [ ] Documentation is tested in Swagger UI
- [ ] Postman collection is up to date

## Related Documentation
- Main AGENTS.md: `/home/matejmusap/Desktop/template-nodejs/AGENTS.md`
- API Reference: `/home/matejmusap/Desktop/template-nodejs/docs/API_REFERENCE.md`
- Architecture: `/home/matejmusap/Desktop/template-nodejs/docs/ARCHITECTURE.md`
