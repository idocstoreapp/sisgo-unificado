/**
 * Result monad for handling operations that can succeed or fail
 * Inspired by the Railway Oriented Programming pattern
 */

export interface Result<T, E = Error> {
  readonly isSuccess: boolean;
  readonly isFailure: boolean;
  readonly error: E | null;
  readonly value: T | null;
  
  /** Get the value or throw if failed */
  getValue(): T;
  
  /** Get the error or throw if successful */
  getError(): E;
  
  /** Chain another operation that returns a Result */
  chain<U>(fn: (value: T) => Result<U, E>): Result<U, E>;
  
  /** Map the success value */
  map<U>(fn: (value: T) => U): Result<U, E>;
  
  /** Handle both cases */
  match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U;
  
  /** Execute side effect on success */
  tap(fn: (value: T) => void): Result<T, E>;
  
  /** Execute side effect on failure */
  tapFailure(fn: (error: E) => void): Result<T, E>;
  
  /** Provide a default value if failed */
  getOrElse(defaultValue: T): T;
  
  /** Convert to Promise for async operations */
  toPromise(): Promise<T>;
}

/**
 * Concrete implementation of Result
 */
class ResultImpl<T, E = Error> implements Result<T, E> {
  private readonly _isSuccess: boolean;
  private readonly _value: T | null;
  private readonly _error: E | null;

  private constructor(isSuccess: boolean, value: T | null, error: E | null) {
    this._isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get error(): E | null {
    return this._error;
  }

  get value(): T | null {
    return this._value;
  }

  getValue(): T {
    if (this.isFailure) {
      throw new Error("Cannot get value from failed Result. Check isSuccess first.");
    }
    return this._value!;
  }

  getError(): E {
    if (this.isSuccess) {
      throw new Error("Cannot get error from successful Result.");
    }
    return this._error!;
  }

  chain<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return fn(this._value!);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<U, E>(this._error!);
    }
    return Result.ok(fn(this._value!));
  }

  match<U>(onSuccess: (value: T) => U, onFailure: (error: E) => U): U {
    if (this.isSuccess) {
      return onSuccess(this._value!);
    }
    return onFailure(this._error!);
  }

  tap(fn: (value: T) => void): Result<T, E> {
    if (this.isSuccess) {
      fn(this._value!);
    }
    return this;
  }

  tapFailure(fn: (error: E) => void): Result<T, E> {
    if (this.isFailure) {
      fn(this._error!);
    }
    return this;
  }

  getOrElse(defaultValue: T): T {
    if (this.isSuccess) {
      return this._value!;
    }
    return defaultValue;
  }

  async toPromise(): Promise<T> {
    if (this.isFailure) {
      throw this._error;
    }
    return this._value!;
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new ResultImpl<T, E>(true, value, null);
  }

  static fail<T, E = Error>(error: E): Result<T, E> {
    return new ResultImpl<T, E>(false, null, error);
  }
}

/**
 * Result namespace - use Result.ok() and Result.fail() to create instances
 */
export const Result = ResultImpl;
