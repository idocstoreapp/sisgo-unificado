/**
 * Custom error types for domain and application layers
 */

/** Base error type for all domain errors */
export interface DomainError {
  readonly name: string;
  readonly message: string;
  readonly code: string;
  readonly details?: Record<string, unknown>;
}

/** Validation error - when business rules are violated */
export class ValidationError implements DomainError {
  readonly name = "ValidationError";
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    public readonly message: string,
    code?: string,
    details?: Record<string, unknown>
  ) {
    this.code = code ?? "VALIDATION_ERROR";
    this.details = details;
  }
}

/** Not Found error - when entity doesn't exist */
export class NotFoundError implements DomainError {
  readonly name = "NotFoundError";
  readonly code = "NOT_FOUND";

  constructor(
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {}
}

/** Business Rule error - when operation violates business logic */
export class BusinessRuleError implements DomainError {
  readonly name = "BusinessRuleError";
  readonly code = "BUSINESS_RULE_VIOLATION";

  constructor(
    public readonly message: string,
    public readonly details?: Record<string, unknown>
  ) {}
}

/** Repository error - when database operation fails */
export class RepositoryError implements DomainError {
  readonly name = "RepositoryError";
  readonly code: string;

  constructor(
    public readonly message: string,
    code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    this.code = code ?? "REPOSITORY_ERROR";
  }
}

/** Unexpected error - for unknown failures */
export class UnexpectedError implements DomainError {
  readonly name = "UnexpectedError";
  readonly code = "UNEXPECTED_ERROR";

  constructor(
    public readonly message: string,
    public readonly originalError?: unknown
  ) {}

  static from(error: unknown): UnexpectedError {
    if (error instanceof Error) {
      return new UnexpectedError(error.message, error);
    }
    if (typeof error === "string") {
      return new UnexpectedError(error);
    }
    return new UnexpectedError("An unexpected error occurred", error);
  }
}
