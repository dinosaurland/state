/**
 * Create a `State` object with an initial value.
 * 
 * @example 
 * ```ts
 * const state = new State(0);
 * state.addListener(value => console.log(value));
 * state.value = 1; // logs 1
 * ```
 */
export class State<T> {
    private _listeners: Set<(value: T) => void> = new Set();
    private _value: T;
    private _update(value: T) {
        this._listeners.forEach(r => r(value));
    }

    constructor(initialState: T) {
        this._value = initialState;
    }

    addListener(listener: (value: T) => void) {
        this._listeners.add(listener);
    }

    removeListener(listener: (value: T) => void) {
        this._listeners.delete(listener);
    }

    get value(): T {
        return this._value;
    }
    set value(newValue: T) {
        this._value = newValue;
        this._update(newValue);
    }

    async next(): Promise<T> {
        const { promise, resolve } = Promise.withResolvers<T>();
        this.addListener(resolve);
        const value = await promise;
        this.removeListener(resolve);
        return value;
    }

    watch(): StateObserver<T> {
        return new StateObserver(this);
    }

    derive<U>(transformer: (value: T) => U): State<U> {
        const state = new State(transformer(this._value));
        this.addListener(value => state.value = transformer(value));
        return state;
    }

    static merge<U extends Record<string | number | symbol, State<unknown>>>(
        states: U
    ): State<{ [K in keyof U]: U[K]['value'] }> {
        const keys = Object.keys(states) as Array<keyof U>;
        const merged = {} as { [K in keyof U]: U[K]['value'] };
        const state = new State({ ...merged });
        for (const key of keys) {
            merged[key] = states[key].value;
            states[key].addListener(newState => {
                merged[key] = newState;
                state.value = { ...merged };
            });
        }
        return state;
    }
}

/**
 * Disposale async iterator that yields the values of a `State` object.
 * 
 * @example
 * ```ts
 * const state = new State(0);
 * using values = state.watch();
 * for await (const value of values) {
 *    console.log(value);
 * }
 * ```
 */
export class StateObserver<T> {
    private _watcher!: PromiseWithResolvers<T>;

    constructor(private _state: State<T>) { }

    async *[Symbol.asyncIterator](): AsyncGenerator<T, void, void> {
        while (true) {
            this._watcher = Promise.withResolvers<T>();
            this._state.addListener(this._watcher.resolve);
            yield await this._watcher.promise;
            this._state.removeListener(this._watcher.resolve);
        }
    }

    [Symbol.dispose]() {
        this._state.removeListener(this._watcher.resolve);
    }
}
