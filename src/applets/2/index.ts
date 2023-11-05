import {
    createProgram,
} from "../../shaders"

import * as UI from "../../ui"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TPoint = [number, number]
type TColor = [number, number, number]

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext

    program: WebGLProgram

    colorAttributeLocation: number
    positionAttributeLocation: number
    
    positionBuffer: WebGLBuffer
    colorBuffer: WebGLBuffer

    positions: [TPoint, TPoint, TPoint]
    colors: [TColor, TColor, TColor]

    discardUI?: () => void
}

let state: TState | null = null

function setupUI(
    state: TState,
    update: () => void,
) {
    const discardCallbacks: Array<() => void> = []

    ;["A", "B", "C"].forEach((label, index) => {
        ;UI.createHeader(state.settings, label)
        ;["r", "g", "b"].forEach((color, colorIndex) => {
            discardCallbacks.push(UI.createNumberInput(state.settings, {
                label: `${color}`,
                min: 0,
                max: 1,
                step: 0.01,
                get value() {
                    return state.colors[index][colorIndex]
                },
                set value(value: number) {
                    state.colors[index][colorIndex] = value
                },
            }))
        })
    })

    state.settings.addEventListener("input", update)
    state.discardUI = () => {
        state.settings.removeEventListener("input", update)
        discardCallbacks.forEach(discard => discard())
        state.settings.innerHTML = ""
    }
}

function init(
    canvas: HTMLCanvasElement,
    settings: HTMLFormElement,
): TState {
    const gl = canvas.getContext("webgl2", { alpha: false, depth: false })
    if (gl == null) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.")
    }

    const program = createProgram(gl, shaderSource)

    gl.useProgram(program)

    const colorAttributeLocation = gl.getAttribLocation(program, "a_color")
    if (colorAttributeLocation < 0) {
        throw new Error("Unable to get attribute location for a_color.")
    }
    gl.enableVertexAttribArray(colorAttributeLocation)

    const colorBuffer = gl.createBuffer()
    if (colorBuffer == null) {
        throw new Error("Unable to create color buffer.")
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error("Unable to get attribute location for a_position.")
    }
    gl.enableVertexAttribArray(positionAttributeLocation)

    const positionBuffer = gl.createBuffer()
    if (positionBuffer == null) {
        throw new Error("Unable to create position buffer.")
    }

    return {
        gl,
        settings,

        program,
        colorAttributeLocation,
        positionAttributeLocation,

        colorBuffer,
        positionBuffer,

        colors: [
            [1, 1, 0],            // A
            [0, 1, 1],            // B
            [1, 0, 1],            // C
        ],
        positions: [
            [-1 + .25,  1 - .25], // A
            [ 1 - .25,  1 - .25], // B
            [0       , -1 + .25], // C
        ],
    }
}

const applet: IApplet = {
    get name() {
        return "Exercise 2"
    },
    cleanup() {
        if (state != null) {
            state.discardUI?.()
            state = null
        }
        return this
    },
    setup({canvas, appletSettings}) {
        if (state == null) {
            state = init(canvas, appletSettings)
            setupUI(state, this.render)
        }
        return this
    },
    render() {
        if (state == null) {
            throw new Error("Applet not initialized.")
        }

        const { gl } = state

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state.positions.flat()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

        gl.bindBuffer(gl.ARRAY_BUFFER, state.colorBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(state.colors.flat()), gl.STATIC_DRAW)
        gl.vertexAttribPointer(state.colorAttributeLocation, 3, gl.FLOAT, false, 0, 0)

        gl.drawArrays(gl.TRIANGLES, 0, state.positions.length)

        return this
    }
}

export default applet