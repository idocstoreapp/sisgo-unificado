/**
 * Shared kernel - Core types and utilities used across all layers
 * This module has NO dependencies on external libraries
 */

export { Result } from "./Result";
export type { Either } from "./Either";
export type { DomainError } from "./errors";
export { ValidationError, NotFoundError, BusinessRuleError, RepositoryError, UnexpectedError } from "./errors";
export type { BaseEntity, EntityProps, ValueObject } from "./types";
