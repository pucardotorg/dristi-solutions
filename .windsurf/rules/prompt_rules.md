# Prompt Rules

## General Behavior

### Documentation as Hard Constraints
- **ALWAYS** treat the documentation files in `/Windsurf_rules` as the source of truth
- **NEVER** contradict established patterns, conventions, or rules defined in these documents
- **ALWAYS** re-read relevant documentation sections before answering questions
- **IMMEDIATELY** flag any proposed changes that would violate documented standards

### Code Consistency
- **ALWAYS** follow existing code patterns and conventions in the codebase
- **MAINTAIN** consistent naming, formatting, and architectural patterns
- **RESPECT** the established tech stack and avoid suggesting alternative technologies
- **PRESERVE** the existing folder structure and file organization

### Security First
- **ALWAYS** implement proper input validation on both frontend and backend
- **NEVER** suggest code that could introduce security vulnerabilities
- **PRIORITIZE** fixing the known input validation vulnerability (A03:2021-Injection)
- **ENSURE** all user inputs are properly validated and sanitized

## Change Management

### Minimal Diffs
- **PREFER** minimal code changes that solve the problem
- **AVOID** unnecessary refactoring or "improvements" that increase diff size
- **FOCUS** on the specific task at hand rather than broader improvements
- **LIMIT** changes to files directly related to the task

### Refactoring Rules
- **ASK** before suggesting significant refactoring
- **EXPLAIN** the benefits and risks of any proposed refactoring
- **PROVIDE** both minimal fix and refactoring options when appropriate
- **PRIORITIZE** security and bug fixes over code cleanliness

### Feature Implementation
- **FOLLOW** the task playbooks for adding new features
- **ENSURE** new code matches existing patterns and conventions
- **IMPLEMENT** comprehensive validation for all user inputs
- **MAINTAIN** separation of concerns in the architecture

## Communication Style

### Precision Over Speculation
- **BE PRECISE** in explanations and recommendations
- **AVOID** speculative suggestions without clear evidence
- **CITE** specific files, functions, or documentation when explaining
- **ACKNOWLEDGE** uncertainty when information is incomplete

### Error Handling
- **PRIORITIZE** robust error handling in all code
- **ENSURE** user-friendly error messages
- **IMPLEMENT** proper logging for debugging
- **CONSIDER** both happy path and error scenarios

### Documentation Updates
- **SUGGEST** documentation updates when implementing new features
- **MAINTAIN** consistency between code and documentation
- **UPDATE** relevant documentation files when architectural changes occur
- **DOCUMENT** any workarounds for known issues

## Project-Specific Rules

### API Conventions
- **STRICTLY FOLLOW** the API conventions documented in `api_conventions.md`
- **MAINTAIN** consistent request/response structures
- **INCLUDE** proper RequestInfo/ResponseInfo objects
- **IMPLEMENT** proper validation and error handling

### Frontend Development
- **USE** React functional components with hooks
- **FOLLOW** the micro-frontend architecture
- **LEVERAGE** existing UI components from Digit UI library
- **IMPLEMENT** proper form validation with React Hook Form

### Backend Development
- **FOLLOW** the microservice architecture
- **IMPLEMENT** proper input validation
- **USE** Spring Boot validation annotations
- **MAINTAIN** tenant isolation in all data access

### Testing Requirements
- **ENSURE** minimum 80% code coverage for new code
- **WRITE** unit tests for all new functionality
- **CONSIDER** edge cases and error scenarios in tests
- **FOLLOW** existing testing patterns and frameworks
