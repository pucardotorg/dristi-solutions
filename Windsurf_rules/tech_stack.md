# Tech Stack

> This document describes the **backend** tech stack for this repository.
> The React-based frontend for DRISTI now lives in a **separate repository**;
> any frontend tools or modules mentioned here are informational only and are
> not part of this codebase.

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
- **Coverage Tool**: JaCoCo 0.8.9

## Logging and Monitoring
- **Logging**: Logback with Loki appender (loki-logback-appender 2.0.1)
- **Log Processing**: Janino 3.1.12

## Environment Configuration
- **Config Management**: Environment-specific properties files
- **Secrets Management**: No hardcoded credentials

## Code Quality and Standards
- **Static Analysis**: SonarQube (Java backend services)
- **Coding Guidelines**: Follow DRISTI Java backend conventions (controller → service → repository layering, clear DTO/domain separation)

## CI/CD
- **Pipeline Tool**: Jenkins
- **Containerization**: Docker images for Spring Boot microservices
- **Repository**: Nexus (eGovernments and DIGIT repositories)

## Module Structure

> Frontend micro-UI modules (like `dristi`, `cases`, `hearings`, etc.) now live
> in the separate frontend repository and are not part of this backend repo.

- **Backend Services (this repository)**:
  - case
  - advocate
  - hearing
  - order
  - task
  - evidence
  - application
  - and 25+ other microservices
