# API Conventions

## Request & Response Shapes

### Standard Request Structure
```json
{
  "RequestInfo": {
    "apiId": "string",
    "ver": "string",
    "ts": "timestamp",
    "action": "string",
    "did": "string",
    "key": "string",
    "msgId": "string",
    "authToken": "string",
    "userInfo": {
      "id": "string",
      "uuid": "string",
      "userName": "string",
      "roles": [
        {
          "name": "string",
          "code": "string",
          "tenantId": "string"
        }
      ],
      "tenantId": "string"
    }
  },
  // Domain-specific request payload
}
```

### Standard Response Structure
```json
{
  "ResponseInfo": {
    "apiId": "string",
    "ver": "string",
    "ts": "timestamp",
    "status": "string",
    "msgId": "string"
  },
  // Domain-specific response payload
}
```

### Common API Patterns
- **Create**: POST `/v1/_create` - Creates a new resource
- **Update**: POST `/v1/_update` - Updates an existing resource
- **Search**: POST `/v1/_search` - Searches for resources based on criteria
- **Delete**: POST `/v1/_delete` - Soft deletes a resource (sets isActive=false)
- **Exists**: POST `/v1/_exists` - Checks if a resource exists

## RequestInfo Conventions

### Required Fields
- **apiId**: Unique identifier for the API being called
- **ver**: API version string
- **ts**: Timestamp of the request
- **action**: Action being performed (create, update, search, etc.)
- **authToken**: JWT token for authentication
- **userInfo**: Information about the authenticated user

### UserInfo Structure
- **id**: User ID
- **uuid**: Unique user identifier
- **userName**: Username
- **roles**: Array of user roles with name, code, and tenantId
- **tenantId**: Tenant identifier for multi-tenancy support

### Usage Guidelines
- RequestInfo must be included in all API requests
- All timestamps must be in UTC format
- TenantId is mandatory and used for data isolation
- Role information is used for authorization checks

## Interceptors Behavior

### Request Interceptors
- **Authentication**: Adds JWT token to request headers
- **Tenant**: Ensures tenantId is present in all requests
- **Correlation ID**: Adds a unique correlation ID for request tracing
- **Content Type**: Sets application/json content type
- **Request Logging**: Logs incoming request details (excluding sensitive data)

### Response Interceptors
- **Error Handling**: Processes error responses and formats them consistently
- **Response Transformation**: Standardizes response format
- **Response Logging**: Logs response details for auditing
- **Performance Metrics**: Captures response time metrics

## Validation & Error Handling

### Input Validation
- All request payloads must be validated against defined schemas
- Validation must occur before business logic processing
- Use Jakarta Validation annotations for backend validation
- Frontend must pre-validate before sending requests

### Error Response Format
```json
{
  "ResponseInfo": {
    "apiId": "string",
    "ver": "string",
    "ts": "timestamp",
    "status": "ERROR",
    "msgId": "string"
  },
  "Errors": [
    {
      "code": "string",
      "message": "string",
      "description": "string",
      "params": ["string"]
    }
  ]
}
```

### Error Codes
- **400**: Bad Request - Invalid input parameters
- **401**: Unauthorized - Authentication failure
- **403**: Forbidden - Authorization failure
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Business validation failure
- **500**: Internal Server Error - Unexpected server error

### Validation Best Practices
- Validate all user inputs on both client and server
- Sanitize inputs to prevent injection attacks
- Use parameterized queries for database operations
- Implement strict type checking
- Validate against business rules after basic validation passes
- Return clear, actionable error messages

## Security Considerations

### Authentication
- All APIs must require authentication via JWT tokens
- Tokens must be validated for every request
- Token expiration must be enforced

### Authorization
- Role-based access control for all endpoints
- Tenant-based data isolation
- Resource-level permission checks

### Data Protection
- Sensitive data must be encrypted in transit and at rest
- PII must be handled according to data protection regulations
- Implement rate limiting to prevent abuse

## API Versioning

### Version Strategy
- Major version changes in URL path: `/v1/`, `/v2/`
- Minor version changes in request header or query parameter
- Breaking changes require a new major version
- Backward compatibility maintained within the same major version

### Deprecation Policy
- APIs are deprecated before removal
- Deprecated APIs continue to function for a grace period
- Deprecation notices provided in documentation and response headers
- Migration path to new versions clearly documented
