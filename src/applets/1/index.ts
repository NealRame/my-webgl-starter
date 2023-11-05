import {
    createProgram,
} from "../../shaders"

import * as UI from "../../ui"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext
    program: WebGLProgram
    colorUniformLocation: WebGLUniformLocation
    sizeUniformLocation: WebGLUniformLocation
    positionAttributeLocation: number
    positionBuffer: WebGLBuffer
    red: number
    green: number
    blue: number
}

function setupUI(state: TState) {
    UI.createNumberInput(state.settings, {
        label: "Red",
        min: 0,
        max: 1,
        step: 0.01,
        get value() {
            return state.red
        },
        set value(value: number) {
            state.red = value
        },
    })
    UI.createNumberInput(state.settings, {
        label: "Green",
        min: 0,
        max: 1,
        step: 0.01,
        get value() {
            return state.green
        },
        set value(value: number) {
            state.green = value
        },
    })
    UI.createNumberInput(state.settings, {
        label: "Blue",
        min: 0,
        max: 1,
        step: 0.01,
        get value() {
            return state.blue
        },
        set value(value: number) {
            state.blue = value
        },
    })
}

function init(
    canvas: HTMLCanvasElement,
    settings: HTMLFormElement,
): TState {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
    if (!gl) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.")
    }

    const program = createProgram(gl, shaderSource)

    gl.enable(gl.DEPTH_TEST)
    gl.useProgram(program)

    const colorUniformLocation = gl.getUniformLocation(program, "u_color")
    if (!colorUniformLocation) {
        throw new Error("Unable to get uniform location for u_color.")
    }

    const sizeUniformLocation = gl.getUniformLocation(program, "u_size")
    if (!sizeUniformLocation) {
        throw new Error("Unable to get uniform location for u_size.")
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error("Unable to get attribute location for a_position.")
    }

    const positionBuffer = gl.createBuffer()
    if (!positionBuffer) {
        throw new Error("Failed to create vertices buffer.")
    }
    gl.enableVertexAttribArray(positionAttributeLocation)

    return {
        settings,
        gl,
        program,
        colorUniformLocation,
        sizeUniformLocation,
        positionAttributeLocation,
        positionBuffer,
        red:   .5,
        green: .5,
        blue:  .5,
    }
}

let state: TState | null = null

const applet: IApplet = {
    get name() {
        return "Exercise 1"
    },
    cleanup() {
        if (state != null) {
            const { gl } = state

            gl.clearColor(0, 0, 0, 0)
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

            gl.deleteBuffer(state.positionBuffer)
            gl.deleteProgram(state.program)
            gl.disableVertexAttribArray(state.positionAttributeLocation)
            gl.deleteBuffer(state.positionBuffer)

            state.settings.removeEventListener("input", this.render)
            state.settings.innerHTML = ""
            state = null
        }
        return this
    },
    setup({ canvas, appletSettings }) {
        if (state == null) {
            state = init(canvas, appletSettings)
            setupUI(state)
            state.settings.addEventListener("input", this.render)
        }
        return this
    },
    render() {
        if (!state) {
            throw new Error("State not initialized. Call setup() first.")
        }

        const { gl } = state
        const canvas = gl.canvas as HTMLCanvasElement
        const vertices = new Float32Array([
            // triangle 1
            0           , 0,
            canvas.width, 0,
            0           , canvas.height,
            // triangle 2
            canvas.width, 0,
            canvas.width, canvas.height,
            0           , canvas.height,
        ])
        const verticesCount = vertices.length/2

        gl.viewport(0, 0, canvas.width, canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        // ----------------------------------------------------------------
        // set position attribute
        gl.bindBuffer(gl.ARRAY_BUFFER, state.positionBuffer)
        gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

        // ----------------------------------------------------------------
        // set uniforms
        gl.uniform3f(state.colorUniformLocation, state.red, state.green, state.blue)
        gl.uniform2f(state.sizeUniformLocation, gl.canvas.width, gl.canvas.height)

        // ----------------------------------------------------------------
        // draw
        gl.drawArrays(gl.TRIANGLES, 0, verticesCount)

        return this
    }
}

export default applet