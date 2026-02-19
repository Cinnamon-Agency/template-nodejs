# Windsurf Configuration

This directory contains the configuration files for the Windsurf development environment, including rules, skills, and workflows that define the project's development standards and agent capabilities.

## **Directory Structure**

```
.windsurf/
├── rules/                    # Project rules and guidelines
│   ├── project-standards.md     # Core project standards and quality guidelines
│   ├── coding-conventions.md    # TypeScript and code organization conventions
│   └── security-guidelines.md   # Security implementation guidelines
├── skills/                   # Agent skill definitions and capabilities
│   ├── backend-development.md   # Backend development and Node.js skills
│   ├── database-management.md   # Database and Prisma ORM skills
│   ├── api-documentation.md     # API documentation and testing skills
│   ├── security-implementation.md # Security and authentication skills
│   ├── testing-strategy.md      # Testing and quality assurance skills
│   ├── devops-deployment.md     # DevOps and deployment skills
│   └── specialized-services.md # Specialized service integration skills
└── workflows/               # Development workflows and procedures
    ├── create-api-endpoint.md   # API endpoint creation workflow
    ├── database-migration.md    # Database migration workflow
    ├── deployment.md            # Deployment process workflow
    ├── security-review.md       # Security review workflow
    ├── setup-development.md     # Development environment setup
    └── testing-strategy.md       # Testing strategy implementation
```

## **Rules Overview**

### **Project Standards**
- Code quality standards and best practices
- TypeScript strict mode requirements
- API development standards
- Database operation guidelines
- Security implementation requirements
- Testing and documentation standards

### **Coding Conventions**
- Naming conventions for files, variables, and functions
- Code structure and organization patterns
- TypeScript specific conventions
- API and service layer patterns
- Database and repository conventions

### **Security Guidelines**
- Authentication and authorization standards
- Input validation and sanitization
- Data protection and encryption
- API security measures
- Compliance and audit requirements

## **Skills Overview**

### **Core Development Skills**
- **Backend Development**: Node.js, TypeScript, Express.js, Prisma ORM
- **Database Management**: PostgreSQL, query optimization, migrations
- **API Documentation**: Swagger/OpenAPI, testing, validation
- **Security Implementation**: JWT, OAuth, encryption, compliance
- **Testing Strategy**: Unit testing, integration testing, E2E testing
- **DevOps Deployment**: Docker, CI/CD, monitoring, infrastructure
- **Specialized Services**: Authentication, media management, notifications

### **Agent Capabilities**
Each skill area defines the capabilities and responsibilities for specialized AI agents:
- Backend Development Agent for API and business logic
- Database Agent for schema design and optimization
- API Documentation Agent for comprehensive documentation
- Security Agent for authentication and vulnerability assessment
- Testing Agent for quality assurance and coverage
- DevOps Agent for deployment and infrastructure
- Specialized Service Agents for specific integrations

## **Workflows Overview**

### **Development Workflows**
- **API Endpoint Creation**: Standard process for creating new API endpoints
- **Database Migration**: Database schema change management
- **Deployment**: Application deployment and infrastructure management
- **Security Review**: Security assessment and vulnerability checking
- **Development Setup**: Environment configuration and initialization
- **Testing Strategy**: Comprehensive testing implementation

### **Workflow Activation**
Workflows can be activated using slash commands:
- `/create-api-endpoint` - Create new API endpoints
- `/database-migration` - Manage database migrations
- `/deployment` - Handle deployment processes
- `/security-review` - Conduct security reviews
- `/setup-development` - Setup development environment
- `/testing-strategy` - Implement testing strategies

## **Usage Guidelines**

### **For AI Agents**
- Follow all rules defined in the `rules/` directory
- Use skills defined in `skills/` to guide development decisions
- Execute workflows when appropriate for the task
- Maintain consistency with project standards
- Collaborate with other agents using defined patterns

### **For Developers**
- Review rules to understand project standards
- Use workflows as guides for common tasks
- Leverage skill definitions for agent interactions
- Contribute to improving rules and workflows
- Follow security guidelines in all implementations

### **For Project Maintenance**
- Keep rules updated with evolving best practices
- Expand skills as new technologies are adopted
- Refine workflows based on project experience
- Ensure documentation remains current
- Validate agent compliance with rules

## **Integration with Project**

### **Agent System Integration**
The rules and skills in this directory integrate with the agent system defined in `AGENTS.md`:
- Rules provide the constraints and standards agents must follow
- Skills define the capabilities and expertise of each agent
- Workflows provide structured processes for complex tasks
- Agents collaborate using defined interaction patterns

### **Project Structure Alignment**
The configuration aligns with the project's structure:
- `src/api/` - API endpoints following backend development standards
- `src/core/` - Core services using defined patterns
- `src/common/` - Shared utilities following conventions
- `prisma/` - Database operations using management skills
- Documentation maintained using API documentation skills

## **Quality Assurance**

### **Rule Compliance**
- Automated validation of coding conventions
- Security guideline enforcement
- Testing strategy compliance checking
- Documentation standard validation

### **Skill Validation**
- Agent capability verification
- Skill coverage assessment
- Performance metric tracking
- Continuous improvement processes

### **Workflow Effectiveness**
- Workflow execution monitoring
- Success rate tracking
- Efficiency measurement
- User feedback collection

## **Future Development**

### **Expansion Plans**
- Additional rules for emerging technologies
- New skill areas as project grows
- Additional workflows for complex scenarios
- Enhanced agent collaboration patterns

### **Improvement Processes**
- Regular review of rules effectiveness
- Skill assessment and updates
- Workflow optimization based on usage
- Community feedback integration

This configuration ensures consistent, high-quality development across the project while enabling effective AI agent collaboration and maintaining security and performance standards.
