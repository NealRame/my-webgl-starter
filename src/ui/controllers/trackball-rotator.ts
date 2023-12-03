import {
    vec3,
    mat4,
} from "gl-matrix"

import {
    TController,
} from "./types"


export type TTrackballRotatorConfig = {
    el: HTMLElement
    viewDistance: number
    viewpointDirection: vec3
    viewUp: vec3
    onMouseDrag: (viewMatrix: mat4) => void
}

export type TControllerConroller = TController & {
    readonly viewMatrix: mat4
}

/**
 * The code below is adapted from https://math.hws.edu/graphicsbook/source/webgl/trackball-rotator.js
 * @param config
 * @returns
 */
export function trackballRotator({
    el,
    viewDistance,
    viewpointDirection,
    viewUp,
    onMouseDrag,
}: TTrackballRotatorConfig): TControllerConroller {
    let centerX: number
    let centerY: number
    let squaredRadius: number
    let prevx: number
    let prevy: number
    let dragging = false

    let unitx = vec3.create()
    let unity = vec3.create()
    let unitz = vec3.create()

    let center: vec3
    let viewZ: number

    const setView = (
        viewDistance: number,
        viewpointDirection: vec3,
        viewUp: vec3,
    ) => {
        unitz = viewpointDirection ?? vec3.fromValues(0, 0, 10)
        viewUp = viewUp ?? vec3.fromValues(0, 1, 0)
        viewZ = viewDistance

        vec3.normalize(unitz, unitz)
        vec3.copy(unity, unitz)
        vec3.scale(unity, unity, vec3.dot(unitz, viewUp))
        vec3.subtract(unity, viewUp, unity)
        vec3.normalize(unity, unity)
        vec3.cross(unitx, unity, unitz)
    }

    const getViewMatrix = () => {
        const mat = mat4.fromValues(
            unitx[0], unity[0], unitz[0], 0,
            unitx[1], unity[1], unitz[1], 0,
            unitx[2], unity[2], unitz[2], 0,
            0,        0,        0,        1,
        )

        if (center != undefined) {
            // multiply on left by translation by rotationCenter
            // multiply on right by translation by -rotationCenter
            const t0 = center[0] - mat[0]*center[0] - mat[4]*center[1] - mat[8]*center[2]
            const t1 = center[1] - mat[1]*center[0] - mat[5]*center[1] - mat[9]*center[2]
            const t2 = center[2] - mat[2]*center[0] - mat[6]*center[1] - mat[10]*center[2]
            mat[12] = t0
            mat[13] = t1
            mat[14] = t2
        }

        if (viewZ != undefined) {
            mat[14] -= viewZ
        }

        return mat
    }

    function applyTransvection(e1: vec3, e2: vec3) {
        // rotate vector e1 onto e2
        function reflectInAxis(axis: vec3, source: vec3, destination: vec3) {
            const s = 2*vec3.dot(axis, source)

            destination[0] = s*axis[0] - source[0]
            destination[1] = s*axis[1] - source[1]
            destination[2] = s*axis[2] - source[2]
        }
        vec3.normalize(e1, e1)
        vec3.normalize(e2, e2)

        const e = vec3.normalize(
            vec3.create(),
            vec3.add(vec3.create(), e1, e2),
        )
        const temp = vec3.create()

        reflectInAxis(e, unitz, temp)
        reflectInAxis(e1, temp, unitz)
        reflectInAxis(e, unitx, temp)
        reflectInAxis(e1, temp, unitx)
        reflectInAxis(e, unity, temp)
        reflectInAxis(e1, temp, unity)
    }

    const toRay = (x: number, y: number) => {
        // converts a point (x,y) in pixel coords to a 3D ray by mapping
        // interior of a circle in the plane to a hemisphere with that circle
        // as equator.
        const dx = x - centerX
        const dy = centerY - y

        // v = dx*unitx + dy*unity
        const v = vec3.add(
            vec3.create(),
            vec3.scale(vec3.create(), unitx, dx),
            vec3.scale(vec3.create(), unity, dy),
        )
        const squareLen = vec3.squaredLength(v)

        // if the point is inside the circle, map it onto the hemisphere
        if (squareLen <= squaredRadius) {
            const z = Math.sqrt(squaredRadius - squareLen)
            // v = v + z*unitz
            vec3.add(v, v, vec3.scale(vec3.create(), unitz, z))
        }

        return v
    }

    const onMouseDown = (evt: MouseEvent) => {
        if (!dragging) {
            dragging = true

            const { left, top } = el.getBoundingClientRect()

            centerX = el.clientWidth/2
            centerY = el.clientHeight/2

            const radius = Math.min(centerX, centerY)

            document.addEventListener("mousemove", onMouseMove, false)
            document.addEventListener("mouseup", onMouseUp, false)
            
            squaredRadius = radius*radius
            prevx = evt.clientX - left
            prevy = evt.clientY - top
        }
    }

    const onMouseMove = (evt: MouseEvent) => {
        if (dragging) {
            const { left, top } = el.getBoundingClientRect()
            const x = evt.clientX - left
            const y = evt.clientY - top
            const ray1 = toRay(prevx, prevy)
            const ray2 = toRay(x, y)

            applyTransvection(ray1, ray2)
            prevx = x
            prevy = y

            onMouseDrag(getViewMatrix())
        }
    }

    const onMouseUp = () => {
        if (dragging) {
            document.removeEventListener("mousemove", onMouseMove, false)
            document.removeEventListener("mouseup", onMouseUp, false)
            dragging = false
        }
    }

    const onMouseWheel = ({ deltaY }: WheelEvent) => {
        viewZ = viewZ - deltaY/100
        onMouseDrag(getViewMatrix())
    }

    setView(viewDistance, viewpointDirection, viewUp);
    el.addEventListener("mousedown", onMouseDown, false);
    el.addEventListener("wheel", onMouseWheel, false)

    return {
        discard: () => {
            el.removeEventListener("mousedown", onMouseDown, false)
            el.removeEventListener("mousemove", onMouseMove, false)
            el.removeEventListener("mouseup", onMouseUp, false)
            el.removeEventListener("wheel", onMouseWheel, false)
        },
        get viewMatrix() {
            return getViewMatrix()
        },
    }
}
