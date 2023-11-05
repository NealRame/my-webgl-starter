import { determinant } from "./matrix4x4"

export type TMatrix3 = [
    number, number, number, // column 0
    number, number, number, // column 1
    number, number, number, // column 2
]

export function identity(): TMatrix3 {
    return [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
    ]
}

export function translation(
    tx: number,
    ty: number,
): TMatrix3 {
    return [
         1,  0, 0,
         0,  1, 0,
        tx, ty, 1,
    ]
}

export function rotation(
    angleInRadians: number,
): TMatrix3 {
    const s = Math.sin(angleInRadians)
    const c = Math.cos(angleInRadians)
    return [
        c, -s, 0,
        s,  c, 0,
        0,  0, 1,
    ]
}

export function scaling(
    sx: number,
    sy: number,
): TMatrix3 {
    return [
        sx,  0, 0,
         0, sy, 0,
         0,  0, 1,
    ]
}

export function projection(
    width: number,
    height: number,
): TMatrix3 {
    return multiply(
        scaling(2, -2),
        scaling(1/width, 1/height),
        translation(-1, 1),
    )
}

export function multiply(
    a: TMatrix3,
    b: TMatrix3,
    ...tail: Array<TMatrix3>
): TMatrix3 {
    const [a00, a10, a20, a01, a11, a21, a02, a12, a22] = a
    const [b00, b10, b20, b01, b11, b21, b02, b12, b22] = b

    const m = [
        a00*b00 + a10*b01 + a20*b02,
        a10*b00 + a11*b10 + a12*b20,
        a20*b00 + a21*b10 + a22*b20, // column 0
        a00*b01 + a01*b11 + a02*b21,
        a10*b01 + a11*b11 + a12*b21,
        a20*b01 + a21*b11 + a22*b21, // column 1
        a00*b02 + a01*b12 + a02*b22,
        a10*b02 + a11*b12 + a12*b22,
        a20*b02 + a21*b12 + a22*b22, // column 2
    ] as TMatrix3

    return tail.length === 0
        ? m
        : multiply(m, tail[0], ...tail.slice(1))
}

export class Matrix3 {
    private _m: TMatrix3

    public constructor(m: TMatrix3 | null = null) {
        this._m = m ?? identity()
    }

    public get float32Array(): Float32Array {
        return new Float32Array(this._m)
    }

    public project(width: number, height: number): Matrix3 {
        this._m = multiply(projection(width, height), this._m)
        return this
    }

    public rotate(angleInRadians: number): Matrix3 {
        this._m = multiply(rotation(angleInRadians), this._m)
        return this
    }

    public scale(
        sx: number,
        sy: number,
    ): Matrix3 {
        this._m = multiply(scaling(sx, sy), this._m)
        return this
    }

    public translate(
        tx: number,
        ty: number,
    ): Matrix3 {
        this._m = multiply(translation(tx, ty), this._m)
        return this
    }
}