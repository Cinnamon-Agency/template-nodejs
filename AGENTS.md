# Project Agents & AI Assistants

## **AI Development Agents**

### **Backend Development Agent**
**Role**: Node.js & TypeScript Backend Specialist
**Skills**:
- Express.js API development and middleware configuration
- Prisma ORM database operations and schema design
- JWT authentication and authorization implementation
- TypeScript strict mode development and type safety
- RESTful API design with proper HTTP methods and status codes
- Error handling and logging implementation
- Database migrations and query optimization

**Responsibilities**:
- Implement new API endpoints following project standards
- Manage database schema changes and migrations
- Ensure code follows TypeScript and project rules
- Optimize database queries and performance
- Implement authentication and security measures

### **Database Agent**
**Role**: Database Architecture & Prisma Specialist
**Skills**:
- Prisma schema design and relationship modeling
- Database migration creation and management
- Query optimization and indexing strategies
- Data integrity and constraint implementation
- Seed data management for testing
- Database performance monitoring

**Responsibilities**:
- Design and maintain database schemas
- Create and manage database migrations
- Optimize database queries and performance
- Ensure data integrity and proper relationships
- Manage seed data for development and testing

### **API Documentation Agent**
**Role**: API Documentation & Testing Specialist
**Skills**:
- Swagger/OpenAPI documentation generation
- API endpoint testing and validation
- Request/response schema documentation
- Error response documentation
- API usage example creation
- Postman collection management

**Responsibilities**:
- Maintain comprehensive API documentation
- Create and update Swagger specifications
- Test API endpoints and validate responses
- Document error scenarios and handling
- Provide clear API usage examples

### **Security Agent**
**Role**: Security & Authentication Specialist
**Skills**:
- JWT token implementation and validation
- Role-based access control (RBAC)
- Input validation and sanitization
- Security middleware configuration
- Data encryption and protection
- Security vulnerability assessment

**Responsibilities**:
- Implement secure authentication flows
- Configure security middleware and policies
- Validate and sanitize all inputs
- Ensure proper access control implementation
- Conduct security reviews and assessments

### **Testing Agent**
**Role**: Quality Assurance & Testing Specialist
**Skills**:
- Unit test development with Jest
- Integration testing for API endpoints
- Database testing with test containers
- Test data management and cleanup
- Code coverage analysis
- Performance testing implementation

**Responsibilities**:
- Create comprehensive test suites
- Ensure adequate test coverage
- Manage test data and environments
- Implement automated testing workflows
- Monitor and improve test performance

### **DevOps Agent**
**Role**: Deployment & Infrastructure Specialist
**Skills**:
- Docker containerization and compose
- CI/CD pipeline configuration
- Environment management and configuration
- Deployment automation and monitoring
- Health check implementation
- Log aggregation and monitoring

**Responsibilities**:
- Manage Docker configurations and deployments
- Implement CI/CD pipelines
- Configure development and production environments
- Monitor application health and performance
- Manage deployment rollbacks and recovery

## **Specialized Agents**

### **Authentication Agent**
**Role**: Authentication & User Management Specialist
**Skills**:
- Multi-provider OAuth integration (Google, LinkedIn, Apple, Facebook)
- JWT token management and refresh flows
- Password hashing and security
- Session management and expiration
- User verification workflows
- Role and permission management

**Responsibilities**:
- Implement secure authentication flows
- Manage user registration and login processes
- Handle token generation and validation
- Implement user verification systems
- Manage user roles and permissions

### **Media Management Agent**
**Role**: File Storage & Media Processing Specialist
**Skills**:
- Google Cloud Storage integration
- File upload and validation
- Image processing and optimization
- Media metadata management
- File access control and security
- Storage optimization and cleanup

**Responsibilities**:
- Implement file upload and storage solutions
- Manage media processing and optimization
- Handle file access permissions and security
- Optimize storage usage and performance
- Maintain media metadata and organization

### **Notification Agent**
**Role**: Communication & Notification Specialist
**Skills**:
- AWS SES email integration
- AWS Pinpoint SMS implementation
- Push notification systems
- WebSocket real-time communication
- Notification template management
- User preference handling

**Responsibilities**:
- Implement email and SMS notifications
- Manage real-time communication systems
- Handle notification templates and content
- Respect user notification preferences
- Monitor notification delivery and performance

## **Agent Collaboration Guidelines**

### **Agent Interaction Rules**
- **Clear boundaries**: Each agent has specific responsibilities and scope
- **Communication protocols**: Use standardized communication between agents
- **Shared context**: Maintain shared understanding of project state and requirements
- **Conflict resolution**: Establish clear hierarchy for decision-making
- **Knowledge sharing**: Regular knowledge transfer between specialized agents

### **Workflow Integration**
- **Sequential workflows**: Agents work in sequence for complex features
- **Parallel development**: Multiple agents can work on different aspects simultaneously
- **Cross-functional collaboration**: Agents collaborate on features requiring multiple expertise
- **Quality gates**: Each agent validates work before passing to next agent
- **Documentation handoff**: Clear documentation transfer between agent responsibilities

### **Agent Configuration**
- **Context awareness**: Each agent understands project rules and standards
- **Tool access**: Agents have access to appropriate development tools and environments
- **Knowledge base**: Shared knowledge base for project-specific information
- **Performance metrics**: Track agent effectiveness and improvement areas
- **Continuous learning**: Agents adapt and improve based on project feedback

## **Agent Usage Instructions**

### **When to Use Each Agent**
- **Backend Development Agent**: New API endpoints, business logic implementation
- **Database Agent**: Schema changes, migrations, query optimization
- **API Documentation Agent**: Documentation updates, API testing
- **Security Agent**: Security reviews, authentication implementation
- **Testing Agent**: Test creation, quality assurance, coverage analysis
- **DevOps Agent**: Deployment issues, infrastructure configuration

### **Agent Activation Commands**
- `/backend` - Activate Backend Development Agent
- `/database` - Activate Database Agent
- `/docs` - Activate API Documentation Agent
- `/security` - Activate Security Agent
- `/test` - Activate Testing Agent
- `/devops` - Activate DevOps Agent

### **Agent Collaboration Examples**
- **New Feature Development**: Backend → Database → Security → Test → Docs
- **API Update**: Backend → Security → Test → Docs
- **Database Migration**: Database → Backend → Test
- **Security Review**: Security → Backend → Test → Docs

This agent system ensures comprehensive coverage of all development aspects while maintaining clear responsibilities and collaboration patterns for efficient project development.
