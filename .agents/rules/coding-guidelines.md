---
trigger: always_on
---

# Coding Guidelines

## Mandatory Coding Rules

### General
- **Code Quality**: All code must pass SonarQube quality gates before merging
- **Security**: No sensitive information (passwords, tokens) in code or comments
- **Documentation**: All public methods, classes, and modules must be documented
- **Error Handling**: All exceptions must be properly caught and handled
- **Logging**: Use appropriate logging levels (DEBUG, INFO, WARN, ERROR)
- **Testing**: Minimum 80% code coverage required for all new code

### Input Validation
- **Frontend Validation**: All user inputs must be validated using React Hook Form validators
- **Backend Validation**: All request payloads must be validated using Spring Boot Validation
- **Sanitization**: All user-supplied content must be sanitized before processing
- **Parameter Binding**: Use strong typing and validation annotations for all API parameters
- **SQL Protection**: Use parameterized queries or ORM to prevent SQL injection
- **XSS Prevention**: Escape all user-generated content before rendering in UI

## Folder & File Conventions

### Frontend Structure
```
frontend/
├── micro-ui/
│   ├── web/
│   │   ├── micro-ui-internals/
│   │   │   ├── packages/
│   │   │   │   ├── libraries/       # Shared utility functions
│   │   │   │   ├── react-components/# Reusable UI components
│   │   │   │   ├── modules/         # Feature modules
│   │   │   │   │   ├── dristi/      # Main application module
│   │   │   │   │   │   ├── src/
│   │   │   │   │   │   │   ├── components/  # UI components
│   │   │   │   │   │   │   ├── hooks/       # Custom React hooks
│   │   │   │   │   │   │   ├── pages/       # Page components
│   │   │   │   │   │   │   │   ├── citizen/ # Citizen-facing pages
│   │   │   │   │   │   │   │   ├── employee/# Employee-facing pages
│   │   │   │   │   │   │   ├── services/    # API service calls
│   │   │   │   │   │   │   ├── Utils/       # Utility functions
│   │   │   │   │   │   │   ├── Module.js    # Module definition
```

### Backend Structure
```
backend/
├── <service-name>/              # e.g., case, hearing, order
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   ├── org/pucar/dristi/
│   │   │   │   │   ├── config/       # Configuration classes
│   │   │   │   │   ├── enrichment/   # Request enrichment
│   │   │   │   │   ├── kafka/        # Kafka producers/consumers
│   │   │   │   │   ├── repository/   # Data access layer
│   │   │   │   │   │   ├── querybuilder/ # SQL query builders
│   │   │   │   │   │   ├── rowmapper/    # Result set mappers
│   │   │   │   │   ├── service/      # Business logic
│   │   │   │   │   ├── util/         # Utility classes
│   │   │   │   │   ├── validators/   # Input validation
│   │   │   │   │   ├── web/          # API controllers
│   │   │   │   │   │   ├── controllers/ # REST controllers
│   │   │   │   │   │   ├── models/      # Request/response models
│   │   │   ├── resources/
│   │   │   │   ├── db/migration/     # Flyway migrations
│   │   │   │   ├── application.properties # Configuration
│   │   ├── test/                     # Unit tests
```

## React / JS Rules

### Component Structure
- **Functional Components**: Use functional components with hooks instead of class components
- **Component Size**: Keep components focused on a single responsibility
- **Props**: Use prop-types or TypeScript for prop validation
- **State Management**: Use React Query for server state, Redux for global state
- **Side Effects**: Manage side effects with useEffect, cleanup properly

### JavaScript Best Practices
- **ES6+ Features**: Use modern JavaScript features (arrow functions, destructuring, etc.)
- **Immutability**: Treat state as immutable, use spread operators for updates
- **Async/Await**: Prefer async/await over promise chains
- **Named Exports**: Use named exports for better code splitting and tree shaking
- **Constants**: Define constants for magic strings and numbers

### React Hook Form Usage
- **Form Validation**: Define validation schema using built-in validators
- **Error Handling**: Display validation errors clearly to users
- **Form Submission**: Use handleSubmit for controlled form submission
- **Field Registration**: Register all form fields properly

## Error Handling & Logging Rules

### Frontend Error Handling
- **API Errors**: Handle all API errors gracefully with user-friendly messages
- **Global Error Boundary**: Implement React error boundaries to catch rendering errors
- **Form Validation Errors**: Display validation errors inline with form fields
- **Network Errors**: Handle offline scenarios and network timeouts

### Backend Error Handling
- **Exception Hierarchy**: Use appropriate exception types for different error scenarios
- **Global Exception Handler**: Implement a global exception handler for consistent error responses
- **Validation Errors**: Return detailed validation error messages
- **Business Logic Errors**: Use custom exceptions for business rule violations

### Logging Standards
- **Context Information**: Include relevant context in log messages (user ID, request ID)
- **Sensitive Data**: Never log sensitive information (passwords, personal data)
- **Log Levels**:
  - ERROR: Application errors requiring immediate attention
  - WARN: Potential issues that don't stop execution
  - INFO: Important application events
  - DEBUG: Detailed information for troubleshooting
- **Performance Logging**: Log performance metrics for critical operations
