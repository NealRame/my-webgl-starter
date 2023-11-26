import {
    TController,
} from "./types"

export function resizeCanvasToDisplaySize(
    canvas: HTMLCanvasElement,
): TController {
    const resize = () => {
        // Lookup the size the browser is displaying the canvas in CSS pixels.
        const displayWidth  = canvas.clientWidth
        const displayHeight = canvas.clientHeight

        // Check if the canvas is not the same size.
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width  = displayWidth
            canvas.height = displayHeight
        }
    }

    window.addEventListener("resize", resize)
    resize()

    return {
        discard: () => {
            window.removeEventListener("resize", resize)
        },
    }
}
