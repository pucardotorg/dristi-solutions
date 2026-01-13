# Tech Stack

## Frontend
- **Framework**: React 17.0.2
- **Routing**: React Router 5.3.0
- **State Management**: 
  - Server State: React Query 3.6.1
  - Global State: Redux 4.1.x with Redux Thunk
- **UI Components**: 
  - Digit UI Components (@egovernments/digit-ui-components 0.0.1-beta.28)
  - Custom React Components (@egovernments/digit-ui-react-components 1.8.2-beta.11)
- **Form Handling**: React Hook Form 6.15.8
- **Internationalization**: React i18next 11.16.2
- **HTTP Client**: Axios
- **Build Tools**: Webpack 4.x, Babel
- **Package Manager**: Yarn
- **CSS**: Custom CSS with dristi-ui-css 0.1.0-dristi-kerala.2

## Backend
- **Language**: Java 17
- **Framework**: Spring Boot 3.2.2
- **Build Tool**: Maven
- **Architecture**: Microservices with domain-driven design
- **API Documentation**: Swagger/OpenAPI 3.0
- **Validation**: Spring Boot Validation (JSR-380)

## Database and Persistence
- **Database**: PostgreSQL 42.7.2
- **Migration Tool**: Flyway 9.22.3
- **Connection**: Spring JDBC
- **Caching**: Redis (Spring Data Redis)

## Messaging and Event Handling
- **Event Streaming**: Kafka
- **Serialization**: JSON
- **Topic Naming Convention**: `<domain>.<action>.<entity>`

## Authentication and Authorization
- **Authentication**: OAuth 2.0
- **Token Format**: JWT
- **Access Control**: Role-based (RBAC)
- **Security**: Encrypted storage of sensitive data (enc-client 2.9.0)

## Testing
- **Backend**: JUnit 5, Spring Boot Test
- **Frontend**: Jest, React Testing Library
- **Coverage Tool**: JaCoCo 0.8.9

## Logging and Monitoring
- **Logging**: Logback with Loki appender (loki-logback-appender 2.0.1)
- **Log Processing**: Janino 3.1.12

## Environment Configuration
- **Config Management**: Environment-specific properties files
- **Secrets Management**: No hardcoded credentials

## Code Quality and Standards
- **Linting**: ESLint for JavaScript/React
- **Formatting**: Prettier
- **Static Analysis**: SonarQube

## CI/CD
- **Pipeline Tool**: Jenkins
- **Containerization**: Docker
- **Repository**: Nexus (eGovernments and DIGIT repositories)

## Module Structure
- **Frontend Modules**:
  - dristi (core application)
  - cases
  - hearings
  - home
  - orders
  - submissions
  - core

- **Backend Services**:
  - case
  - advocate
  - hearing
  - order
  - task
  - evidence
  - application
  - and 25+ other microservices
