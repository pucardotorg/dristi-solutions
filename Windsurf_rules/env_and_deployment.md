# Environment and Deployment

## Environments

### Local Development
- **Purpose**: Individual developer environment for feature development and testing
- **Setup**:
  - Frontend: `yarn start` (runs on http://localhost:3000)
  - Backend: Run individual microservices via IDE or Maven
  - Database: Local PostgreSQL instance
  - Kafka: Local Kafka broker or Docker container
  - Redis: Local Redis instance or Docker container

### Development (DEV)
- **Purpose**: Integration environment for feature testing
- **URL**: https://dev.digit.org
- **Deployment**: Automated via Jenkins pipeline
- **Database**: Shared development PostgreSQL instance
- **Data**: Refreshed periodically, not production data

### Quality Assurance (QA)
- **Purpose**: Testing environment for QA team
- **URL**: https://qa.digit.org
- **Deployment**: Automated via Jenkins pipeline after DEV validation
- **Database**: Dedicated QA PostgreSQL instance
- **Data**: Test data maintained by QA team

### User Acceptance Testing (UAT)
- **Purpose**: Client validation environment
- **URL**: https://uat.digit.org
- **Deployment**: Controlled deployment after QA sign-off
- **Database**: Production-like PostgreSQL instance
- **Data**: Sanitized copy of production data or realistic test data

### Production (PROD)
- **Purpose**: Live environment for end users
- **URL**: https://digit.org
- **Deployment**: Controlled deployment after UAT sign-off
- **Database**: Production PostgreSQL cluster with high availability
- **Data**: Production data with regular backups

## Build & Run Commands

### Frontend

#### Setup
```bash
# Install dependencies
cd frontend/micro-ui/web
yarn install

# Install module dependencies
yarn build:libraries
```

#### Development
```bash
# Start development server
cd frontend/micro-ui/web
yarn start
```

#### Build
```bash
# Production build
cd frontend/micro-ui/web
yarn build:prod
```

### Backend

#### Setup
```bash
# Build service
cd backend/<service-name>
mvn clean install -DskipTests
```

#### Development
```bash
# Run service
cd backend/<service-name>
mvn spring-boot:run
```

#### Build
```bash
# Create deployable JAR
cd backend/<service-name>
mvn clean package
```

## Docker Configuration

### Frontend Docker
```dockerfile
FROM node:14-alpine AS build
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build:prod

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Backend Docker
```dockerfile
FROM openjdk:17-slim
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

## Kubernetes Setup

### Deployment Structure
- Separate namespaces for each environment
- ConfigMaps for environment-specific configuration
- Secrets for sensitive information
- Horizontal Pod Autoscaling for dynamic scaling
- Liveness and readiness probes for health monitoring

### Resource Requirements
- **Frontend**: 
  - CPU: 0.5 core (request), 1 core (limit)
  - Memory: 512Mi (request), 1Gi (limit)
- **Backend Services**: 
  - CPU: 1 core (request), 2 cores (limit)
  - Memory: 1Gi (request), 2Gi (limit)
- **Database**: 
  - CPU: 2 cores (request), 4 cores (limit)
  - Memory: 4Gi (request), 8Gi (limit)

## CI/CD Pipeline

### Jenkins Pipeline Stages
1. **Checkout**: Clone repository from Git
2. **Build**: Compile code and run unit tests
3. **Static Analysis**: Run SonarQube analysis
4. **Package**: Create deployable artifacts
5. **Publish**: Push artifacts to Nexus repository
6. **Deploy**: Deploy to target environment
7. **Integration Tests**: Run integration tests
8. **Notify**: Send deployment notifications

### Quality Gates
- All unit tests must pass
- Code coverage must meet minimum threshold (80%)
- SonarQube quality gates must pass
- No critical or high security vulnerabilities

### Deployment Approval Process
- DEV: Automatic deployment on successful build
- QA: Automatic deployment after DEV validation
- UAT: Manual approval required
- PROD: Manual approval required with change management

## Environment Variables

### Common Variables
```
# Server Configuration
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=<environment>

# Database Configuration
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<database>
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS=<kafka-host>:<kafka-port>

# Redis Configuration
SPRING_REDIS_HOST=<redis-host>
SPRING_REDIS_PORT=<redis-port>

# Logging Configuration
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_ORG_PUCAR=DEBUG
```

### Environment-Specific Configuration
- Configuration stored in environment-specific properties files
- Sensitive information stored in secure vaults
- Environment variables injected via Kubernetes ConfigMaps and Secrets

## Monitoring and Logging

### Monitoring Tools
- Prometheus for metrics collection
- Grafana for visualization
- Alertmanager for alerting

### Logging Setup
- Centralized logging with ELK stack
- Structured logging format (JSON)
- Log retention policy: 30 days for non-production, 90 days for production

### Health Checks
- Actuator endpoints for service health monitoring
- Regular database connection validation
- Kafka connectivity checks
