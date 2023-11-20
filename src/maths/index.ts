export * as geometry from "./geometry"
export * as noise from "./noise"

export function degToRad(
    degrees: number,
): number {
    return degrees*Math.PI/180
}

export function radToDeg(
    radians: number,
): number {
    return radians*180/Math.PI
}
