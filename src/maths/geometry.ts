import {
    vec3
} from 'gl-matrix'

export type TColor = [number, number, number, number]
export type TPoint3D = [number, number, number]

export type TCuboidFacesColor = [
    // Back face
    TColor,
    // Front face
    TColor,
    // Bottom face
    TColor,
    // Top face
    TColor,
    // Left face
    TColor,
    // Right face
    TColor,
]
export function cube(): Float32Array {
    const vert0 = [0, 0, 1]
    const vert1 = [1, 0, 1]
    const vert2 = [1, 1, 1]
    const vert3 = [0, 1, 1]
    const vert4 = [0, 0, 0]
    const vert5 = [1, 0, 0]
    const vert6 = [1, 1, 0]
    const vert7 = [0, 1, 0]

    return new Float32Array([
        // Front face
        vert0, vert1, vert2, vert2, vert3, vert0,
        // Back face
        vert4, vert6, vert5, vert6, vert4, vert7,

        // Top face
        vert3, vert2, vert6, vert6, vert7, vert3,
        // Bottom face
        vert4, vert5, vert1, vert1, vert0, vert4,

        // Right face
        vert1, vert5, vert6, vert6, vert2, vert1,
        // Left face
        vert4, vert0, vert3, vert3, vert7, vert4,
    ].flat())
}

export function normals(
    vertices: Float32Array,
): Float32Array {
    const normals = new Float32Array(vertices.length)
    for (let i = 0; i < vertices.length; i += 9) {
        const v1 = vertices.slice(i, i + 3)
        const v2 = vertices.slice(i + 3, i + 6)
        const v3 = vertices.slice(i + 6, i + 9)
        const a = vec3.sub(vec3.create(), v2, v1)
        const b = vec3.sub(vec3.create(), v3, v1)
        const normal = vec3.create()
        vec3.cross(normal, a, b)
        vec3.normalize(normal, normal)
        normals.set(normal, i)
        normals.set(normal, i + 3)
        normals.set(normal, i + 6)
    }
    return normals
}

export function cartesianToSpherical(
    x: number,
    y: number,
    z: number,
): [number, number, number] {
    if (x === 0 && y === 0 && z === 0) {
        return [0, 0, 0]
    }

    const r = Math.sqrt(x*x + y*y + z*z)
    const rp = Math.sqrt(x*x + z*z)
    const theta = Math.atan2(rp, y)
    const phi = Math.atan2(x, z)

    return [r, theta, phi]
}

export function sphericalToCartesian(
    r: number,
    theta: number,
    phi: number,
): [number, number, number] {
    theta = theta%(Math.PI)
    phi = phi%(2*Math.PI)

    const x = r*Math.sin(theta)*Math.sin(phi)
    const y = r*Math.cos(theta)
    const z = r*Math.sin(theta)*Math.cos(phi)

    return [x, y, z]
}
