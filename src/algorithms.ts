export function* times<T>(
    n: number,
    value: T,
): Generator<T> {
    for (let i = 0; i < n; i++) {
        yield value
    }
}

export type TRange = [number, number]

export function* range([
    first,
    last,
]: TRange): Generator<number> {
    for (let i = first; i < last; i++) {
        yield i
    }
}

export function* cartesianProduct(
    range1: TRange,
    range2: TRange,
): Generator<[number, number]> {
    for (const value1 of range(range1)) {
        for (const value2 of range(range2)) {
            yield [value1, value2]
        }
    }
}
