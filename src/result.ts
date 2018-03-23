function unreachable(): never {
    throw Error("unreachable");
}

export abstract class Result<T, E> {
    isOk(): this is Ok<T, E> { return this instanceof Ok; }
    isErr(): this is Err<T, E> { return this instanceof Err; }

    map<U>(f: (value: T) => U): Result<U, E> {
        if (this.isOk()) {
            return new Ok(f(this.value));
        }
        else if (this.isErr()) {
            return new Err(this.error);
        }
        else {
            return unreachable();
        }
    }

    mapErr<U>(f: (err: E) => U): Result<T, U> {
        if (this.isOk()) {
            return new Ok(this.value);
        }
        else if (this.isErr()) {
            return new Err(f(this.error));
        }
        else {
            return unreachable();
        }
    }
}

export class Ok<T, E> extends Result<T, E> {
    value: T;

    constructor(value: T) {
        super();
        this.value = value;
    }
}

export class Err<T, E> extends Result<T, E> {
    error: E;

    constructor(error: E) {
        super();
        this.error = error;
    }
}

// export interface Ok<T> {
//     Ok: T;
// }

// export interface Err<E> {
//     Err: E;
// }

// export type Result<T, E> = Ok<T> | Err<E>;
// export default Result;

// export function isOk<T, E>(res: Result<T, E>): res is Ok<T> {
//     return (<Ok<T>>res).Ok !== undefined;
// }

// export function isErr<T, E>(res: Result<T, E>): res is Err<E> {
//     return (<Err<E>>res).Err !== undefined;
// }
