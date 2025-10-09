import { exhaustive } from 'exhaustive';

export class Result<T, E = Error> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E
  ) {}

  public static success<T>(value: T): Result<T, never> {
    return new Result<T, never>(true, value);
  }

  public static failure<E>(error: E): Result<never, E> {
    return new Result<never, E>(false, undefined, error);
  }

  public isSuccess(): boolean {
    return this._isSuccess;
  }

  public isFailure(): boolean {
    return !this._isSuccess;
  }

  public getValue(): T {
    if (this._isSuccess) {
      return this._value!;
    }
    throw new Error('Cannot get value from failure result');
  }

  public getError(): E {
    if (!this._isSuccess) {
      return this._error!;
    }
    throw new Error('Cannot get error from success result');
  }

  public map<U>(fn: (value: T) => U): Result<U, E> {
    if (this._isSuccess) {
      try {
        return Result.success<U>(fn(this._value!));
      } catch (error) {
        return Result.failure<E>(error as E);
      }
    }
    return Result.failure<E>(this._error!);
  }

  public flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this._isSuccess) {
      return fn(this._value!);
    }
    return Result.failure(this._error!);
  }

  public match<U>(
    onSuccess: (value: T) => U,
    onFailure: (error: E) => U
  ): U {
    return exhaustive(String(this._isSuccess), {
      'true': () => onSuccess(this._value!),
      'false': () => onFailure(this._error!)
    });
  }
}
