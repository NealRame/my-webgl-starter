export * from "./widgets/header"
export * from "./widgets/number-input"
export * from "./widgets/select"
export * from "./widgets/toggle"
export * from "./types"


export function resizeCanvasToDisplaySize(
    canvas: HTMLCanvasElement,
) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const displayWidth  = canvas.clientWidth
    const displayHeight = canvas.clientHeight

    // Check if the canvas is not the same size.
    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width  = displayWidth
        canvas.height = displayHeight
    }
}
