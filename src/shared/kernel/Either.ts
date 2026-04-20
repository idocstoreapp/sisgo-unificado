/**
 * Either monad for handling two possible values (Left or Right)
 * Convention: Left = Error/Failure, Right = Success
 */

export type Either<L, R> = Left<L, R> | Right<L, R>;

interface Left<L, R> {
  readonly isLeft: true;
  readonly isRight: false;
  readonly left: L;
  readonly right: null;
  
  getLeft(): L;
  mapRight<R2>(_fn: (value: R) => R2): Either<L, R2>;
  mapLeft<L2>(fn: (error: L) => L2): Either<L2, R>;
  match<T>(onLeft: (left: L) => T, onRight: (right: R) => T): T;
}

interface Right<L, R> {
  readonly isLeft: false;
  readonly isRight: true;
  readonly left: null;
  readonly right: R;
  
  getRight(): R;
  mapRight<R2>(fn: (value: R) => R2): Either<L, R2>;
  mapLeft<L2>(_fn: (error: L) => L2): Either<L2, R>;
  match<T>(onLeft: (left: L) => T, onRight: (right: R) => T): T;
}

class LeftImpl<L, R> implements Left<L, R> {
  readonly isLeft = true as const;
  readonly isRight = false as const;
  readonly right = null;

  constructor(private readonly _left: L) {}

  get left(): L {
    return this._left;
  }

  getLeft(): L {
    return this._left;
  }

  mapRight<R2>(_fn: (value: R) => R2): Either<L, R2> {
    return new LeftImpl<L, R2>(this._left);
  }

  mapLeft<L2>(fn: (error: L) => L2): Either<L2, R> {
    return new LeftImpl<L2, R>(fn(this._left));
  }

  match<T>(onLeft: (left: L) => T, _onRight: (right: R) => T): T {
    return onLeft(this._left);
  }
}

class RightImpl<L, R> implements Right<L, R> {
  readonly isLeft = false as const;
  readonly isRight = true as const;
  readonly left = null;

  constructor(private readonly _right: R) {}

  get right(): R {
    return this._right;
  }

  getRight(): R {
    return this._right;
  }

  mapRight<R2>(fn: (value: R) => R2): Either<L, R2> {
    return new RightImpl<L, R2>(fn(this._right));
  }

  mapLeft<L2>(_fn: (error: L) => L2): Either<L2, R> {
    return new RightImpl<L2, R>(this._right);
  }

  match<T>(_onLeft: (left: L) => T, onRight: (right: R) => T): T {
    return onRight(this._right);
  }
}

/**
 * Either namespace - use Either.left() and Either.right() to create instances
 */
export const Either = {
  left<L, R>(value: L): Either<L, R> {
    return new LeftImpl<L, R>(value);
  },
  right<L, R>(value: R): Either<L, R> {
    return new RightImpl<L, R>(value);
  },
};
