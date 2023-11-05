export function* times<T>(
    n: number,
    value: T,
): Generator<T> {
    for (let i = 0; i < n; i++) {
        yield value
    }
}
