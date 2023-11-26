import {
    TController,
} from "./types"

import {
    geometry,
} from "../../maths"

export type TMouseRotatorOptions = {
    el: HTMLElement
    eye: geometry.TPoint3D
    onMouseDrag: (p: geometry.TPoint3D) => void
}

export function mouseRotator({
    el,
    eye,
    onMouseDrag,
}: TMouseRotatorOptions): TController {
    let [radius, latitude, longitude] = geometry.cartesianToSpherical(...eye)

    const mousemove = ({ movementX, movementY }: MouseEvent) => {
        latitude -= movementY*Math.PI/el.clientHeight
        longitude -= movementX*Math.PI/el.clientWidth
        onMouseDrag(geometry.sphericalToCartesian(radius, latitude, longitude))
    }
    const mousewheel = ({ deltaY }: WheelEvent) => {
        radius = radius - deltaY/100
        onMouseDrag(geometry.sphericalToCartesian(radius, latitude, longitude))
    }
    const mouseup = () => {
        el.removeEventListener("mousemove", mousemove)
        el.removeEventListener("mouseup", mouseup)
    }
    const mousedown = () => {
        el.addEventListener("mousemove", mousemove)
        el.addEventListener("mouseup", mouseup)
    }

    el.addEventListener("mousedown", mousedown)
    el.addEventListener("wheel", mousewheel)

    return {
        discard: () => {
            el.removeEventListener("mousemove", mousemove)
            el.removeEventListener("mouseup", mouseup)
            el.removeEventListener("mousedown", mousedown)
            el.removeEventListener("wheel", mousewheel)
        }
    }
}
