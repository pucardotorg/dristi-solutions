# Known Gotchas

## Known Bugs

### Input Validation Vulnerability
- **Issue**: Inadequate validation of user-supplied input across frontend and backend components (A03:2021-Injection vulnerability)
- **Impact**: Potential for injection attacks including SQL injection, XSS, and command injection
- **Workaround**: Implement comprehensive input validation on both frontend and backend
- **Fix Status**: Needs implementation of comprehensive input validation strategy

### Authentication Token Handling
- **Issue**: JWT tokens not properly refreshed before expiration
- **Impact**: Users unexpectedly logged out during active sessions
- **Workaround**: Manually refresh page or re-login when session expires
- **Fix Status**: In progress, implementing proactive token refresh

### Case Search Performance
- **Issue**: Case search queries timeout with large result sets
- **Impact**: Users unable to retrieve complete search results for broad queries
- **Workaround**: Use more specific search criteria to limit result set size
- **Fix Status**: Pagination improvements planned

### Document Upload Size Limitation
- **Issue**: Large document uploads (>10MB) fail silently
- **Impact**: Users unable to upload large documents without clear error message
- **Workaround**: Split large documents into smaller files before upload
- **Fix Status**: Implementing proper error handling and progress indicators

## Tricky Logic

### Case Status Transitions
- **Complexity**: Case status transitions follow complex business rules based on case type, court, and current status
- **Gotcha**: Status transitions may be rejected without clear error messages
- **Solution**: Refer to the state machine diagram in `/docs/Case/status_transitions.md`
- **Code Location**: `backend/case/src/main/java/org/pucar/dristi/service/CaseService.java`

### Hearing Date Calculations
- **Complexity**: Hearing date calculations must account for court holidays, weekends, and judge availability
- **Gotcha**: Calculated dates may appear incorrect if not accounting for all factors
- **Solution**: Always use the `HearingDateService` for date calculations, never calculate manually
- **Code Location**: `backend/hearing/src/main/java/org/pucar/dristi/service/HearingDateService.java`

### Multi-tenant Data Access
- **Complexity**: All data access must be tenant-aware to maintain data isolation
- **Gotcha**: Missing tenant filters can expose data across tenants
- **Solution**: Always include tenant ID in repository queries and service methods
- **Code Location**: All repository classes implement tenant filtering

### Document Version Control
- **Complexity**: Documents maintain version history with complex rules for which version is "current"
- **Gotcha**: Retrieving the wrong document version can lead to displaying outdated information
- **Solution**: Use `DocumentService.getCurrentVersion()` instead of direct document access
- **Code Location**: `backend/digitalized-documents/src/main/java/org/pucar/dristi/service/DocumentService.java`

## Things That Have Broken Before

### Redis Connection Pooling
- **Issue**: Redis connection pool exhaustion under high load
- **Root Cause**: Connections not properly released after use
- **Fix Applied**: Implemented connection pool management with proper release
- **Prevention**: Monitor Redis connection metrics in production

### Kafka Consumer Group Rebalancing
- **Issue**: Message processing duplicates during Kafka consumer group rebalancing
- **Root Cause**: Lack of idempotent message processing
- **Fix Applied**: Implemented idempotent consumers with message deduplication
- **Prevention**: Design all Kafka consumers to be idempotent

### Frontend Memory Leaks
- **Issue**: Browser performance degradation after prolonged use
- **Root Cause**: Event listeners and subscriptions not properly cleaned up
- **Fix Applied**: Added proper cleanup in useEffect return functions
- **Prevention**: Review all component unmount logic during code reviews

### Database Connection Leaks
- **Issue**: Database connections exhausted during peak load
- **Root Cause**: Connections not properly closed in exception paths
- **Fix Applied**: Implemented try-with-resources pattern for all database operations
- **Prevention**: Static analysis to detect potential connection leaks

## Performance Pitfalls

### N+1 Query Problem
- **Issue**: Excessive database queries when fetching related entities
- **Impact**: Slow API response times, database overload
- **Detection**: Monitor query counts per request in development
- **Prevention**: Use join fetches or batch loading for related entities

### Large Result Set Pagination
- **Issue**: Attempting to load too many records in a single request
- **Impact**: High memory usage, slow response times, potential OOM errors
- **Detection**: Monitor response sizes and query execution times
- **Prevention**: Implement keyset pagination instead of offset pagination

### Frontend Render Performance
- **Issue**: Unnecessary re-renders of complex components
- **Impact**: UI lag, poor user experience
- **Detection**: Use React DevTools profiler to identify excessive renders
- **Prevention**: Proper use of React.memo, useMemo, and useCallback

### Kafka Message Size
- **Issue**: Very large messages sent through Kafka
- **Impact**: Increased latency, potential message delivery failures
- **Detection**: Monitor message size metrics
- **Prevention**: Limit message size, store large data externally and reference in messages

### Redis Cache Key Design
- **Issue**: Poor cache key design leading to low cache hit rates
- **Impact**: Increased database load, slower response times
- **Detection**: Monitor cache hit/miss ratios
- **Prevention**: Design cache keys based on access patterns, implement proper cache invalidation
