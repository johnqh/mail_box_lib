# ADR-002: Interface-First Design Pattern

**Date:** 2025-01-13  
**Status:** Accepted  
**Context:** AI-assisted development optimization

## Context

To ensure consistent, testable, and maintainable code across the @johnqh/lib project, we need a standardized approach to defining services, operations, and data structures. This is especially important for AI-assisted development where patterns need to be clear and consistent.

## Decision

Adopt an interface-first design pattern where:

1. **All services must define TypeScript interfaces first** before implementation
2. **Business operations consume interfaces**, never concrete implementations  
3. **Interfaces are defined in `src/types/services/`** separate from implementations
4. **Custom error types** are defined alongside their related interfaces
5. **Type guards and validation functions** accompany interfaces when needed

Pattern example:
```typescript
// src/types/services/email.interface.ts
export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<EmailResult>;
  validateAddress(address: string): boolean;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailServiceError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'EmailServiceError';
  }
}
```

## Consequences

### Positive
- **Testability**: Business logic can be tested with mocked interfaces
- **Platform Independence**: Business operations work with any implementation
- **Clear Contracts**: Interfaces serve as documentation and contracts
- **AI Understanding**: Clear patterns help AI assistants generate consistent code
- **Refactoring Safety**: Interface changes are caught by TypeScript compiler
- **Dependency Injection**: Natural fit for DI patterns

### Negative
- **Initial Overhead**: Requires defining interfaces before implementation
- **File Count**: More files to maintain (interface + implementations)
- **Learning Curve**: Developers must understand interface patterns

### Neutral
- **Abstraction**: Adds layer between business logic and implementation
- **Compilation**: Slightly longer compilation time due to more files

## Implementation

1. **Interface Location**: All service interfaces in `src/types/services/`
2. **Naming Convention**: 
   - Interfaces: `ServiceNameInterface` or `ServiceName`
   - Implementations: `WebServiceName`, `ReactNativeServiceName`
   - Operations: `ServiceNameOperations`
   - Errors: `ServiceNameError`

3. **Interface Requirements**:
   - Must include comprehensive method signatures
   - Must define parameter and return types
   - Must include error handling approach
   - Should include JSDoc comments for complex methods

4. **Implementation Requirements**:
   - Must implement full interface
   - Must handle all error cases defined in interface
   - Must maintain interface compatibility across platforms

5. **Business Operations Pattern**:
   ```typescript
   export class EmailOperations {
     constructor(private emailService: EmailService) {}
     
     async sendWelcomeEmail(user: User): Promise<void> {
       // Business logic using interface
     }
   }
   ```

## Alternatives Considered

1. **Implementation-First Approach**: Start with concrete implementations
   - Rejected: Leads to tight coupling and testing difficulties

2. **Abstract Classes Instead of Interfaces**: Use abstract base classes
   - Rejected: Less flexible, complicates multiple inheritance scenarios

3. **Duck Typing**: Rely on TypeScript structural typing without explicit interfaces
   - Rejected: Less clear contracts, harder for AI to understand patterns

4. **Mixed Approach**: Some services with interfaces, others without
   - Rejected: Inconsistent patterns confuse AI assistants and developers