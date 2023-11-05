export type TMatrix4 = [
    number, number, number, number, // column 0
    number, number, number, number, // column 1
    number, number, number, number, // column 2
    number, number, number, number, // column 3
]

export function identity(): TMatrix4 {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]
}

export function orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number,
): TMatrix4 {
    const sx = 2/(right - left)
    const sy = 2/(top - bottom)
    const sz = 2/(near - far)

    const tx = (left + right)/(left - right)
    const ty = (bottom + top)/(bottom - top)
    const tz = (near + far)/(near - far)

    return [
        sx,  0,  0,  0,
         0, sy,  0,  0,
         0,  0, sz,  0,
        tx, ty, tz,  1,
    ]
}

export function perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number,
): TMatrix4 {
    const f = Math.tan(.5*Math.PI - .5*fov);
    const rangeInv = 1./(near - far);

    return [
        f/aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far)*rangeInv, -1,
        0, 0, 2*near*far*rangeInv, 0,
    ]
}

export function xRotation(
    angleInRadians: number,
): TMatrix4 {
    const s = Math.sin(angleInRadians)
    const c = Math.cos(angleInRadians)
    return [
        1,  0, 0, 0,
        0,  c, s, 0,
        0, -s, c, 0,
        0,  0, 0, 1,
    ]
}

export function yRotation(
    angleInRadians: number,
): TMatrix4 {
    const s = Math.sin(angleInRadians)
    const c = Math.cos(angleInRadians)
    return [
        c, 0, -s, 0,
        0, 1, 0, 0,
        s, 0, c, 0,
        0, 0, 0, 1,
    ]
}

export function zRotation(
    angleInRadians: number,
): TMatrix4 {
    const s = Math.sin(angleInRadians)
    const c = Math.cos(angleInRadians)
    return [
         c, s, 0, 0,
        -s, c, 0, 0,
         0, 0, 1, 0,
         0, 0, 0, 1,
    ]
}

export function scaling(
    sx: number,
    sy: number,
    sz: number,
): TMatrix4 {
    return [
        sx,  0,  0, 0,
         0, sy,  0, 0,
         0,  0, sz, 0,
         0,  0,  0, 1,
    ]
}

export function translation(
    tx: number,
    ty: number,
    tz: number,
): TMatrix4 {
    return [
         1,  0,  0, 0,
         0,  1,  0, 0,
         0,  0,  1, 0,
        tx, ty, tz, 1,
    ]
}

export function multiply(
    a: TMatrix4,
    b: TMatrix4,
    ...tail: TMatrix4[]
): TMatrix4 {
    const [
        a00, a10, a20, a30, // column 0
        a01, a11, a21, a31, // column 1
        a02, a12, a22, a32, // column 2
        a03, a13, a23, a33, // column 3
    ] = a
    const [
        b00, b10, b20, b30, // column 0
        b01, b11, b21, b31, // column 1
        b02, b12, b22, b32, // column 2
        b03, b13, b23, b33, // column 3
    ] = b
    const m = [
        a00*b00 + a01*b10 + a02*b20 + a03*b30,
        a10*b00 + a11*b10 + a12*b20 + a13*b30,
        a20*b00 + a21*b10 + a22*b20 + a23*b30,
        a30*b00 + a31*b10 + a32*b20 + a33*b30, // column 0
        a00*b01 + a01*b11 + a02*b21 + a03*b31,
        a10*b01 + a11*b11 + a12*b21 + a13*b31,
        a20*b01 + a21*b11 + a22*b21 + a23*b31,
        a30*b01 + a31*b11 + a32*b21 + a33*b31, // column 1
        a00*b02 + a01*b12 + a02*b22 + a03*b32,
        a10*b02 + a11*b12 + a12*b22 + a13*b32,
        a20*b02 + a21*b12 + a22*b22 + a23*b32,
        a30*b02 + a31*b12 + a32*b22 + a33*b32, // column 2
        a00*b03 + a01*b13 + a02*b23 + a03*b33,
        a10*b03 + a11*b13 + a12*b23 + a13*b33,
        a20*b03 + a21*b13 + a22*b23 + a23*b33,
        a30*b03 + a31*b13 + a32*b23 + a33*b33, // column 3
    ] as TMatrix4

    return tail.length === 0
        ? m
        : multiply(m, tail[0], ...tail.slice(1))
}

export class Matrix4 {
    private _m: TMatrix4

    public constructor(m: TMatrix4 | null = null) {
        this._m = m ?? identity()
    }

    public get float32Array(): Float32Array {
        return new Float32Array(this._m)
    }

    public orthographic(
        left: number,
        right: number,
        bottom: number,
        top: number,
        near: number,
        far: number,
    ): Matrix4 {
        this._m = multiply(this._m, orthographic(left, right, bottom, top, near, far))
        return this
    }

    public perspective(
        fov: number,
        aspect: number,
        near: number,
        far: number,
    ): Matrix4 {
        this._m = multiply(this._m, perspective(fov, aspect, near, far))
        return this
    }

    public xRotate(angleInRadians: number): Matrix4 {
        this._m = multiply(this._m, xRotation(angleInRadians))
        return this
    }

    public yRotate(angleInRadians: number): Matrix4 {
        this._m = multiply(this._m, yRotation(angleInRadians))
        return this
    }

    public zRotate(angleInRadians: number): Matrix4 {
        this._m = multiply(this._m, zRotation(angleInRadians))
        return this
    }

    public scale(
        sx: number,
        sy: number,
        sz: number,
    ): Matrix4 {
        this._m = multiply(this._m, scaling(sx, sy, sz))
        return this
    }

    public translate(
        tx: number,
        ty: number,
        tz: number,
    ): Matrix4 {
        this._m = multiply(this._m, translation(tx, ty, tz))
        return this
    }
}
