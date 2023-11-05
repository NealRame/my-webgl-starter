import {
    createProgram,
} from "../../shaders"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext
    program: WebGLProgram
    positionAttributeLocation: number
    sizeUniformLocation: WebGLUniformLocation
}

function init(
    canvas: HTMLCanvasElement,
    settings: HTMLFormElement,
): TState {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext

    const program = createProgram(gl, shaderSource)

    gl.useProgram(program)

    const sizeUniformLocation = gl.getUniformLocation(program, "u_size")
    if (sizeUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_size.")
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_position.`)
    }

    return {
        settings,
        gl,
        program,
        positionAttributeLocation,
        sizeUniformLocation,
    } as TState

}

let state: TState | null

const applet: IApplet = {
    get name() {
        return "Exercice 5"
    },
    cleanup() {
        if (state != null) {
            state.gl.deleteProgram(state.program)
            state = null
        }
        return this
    },
    setup({
        canvas,
        appletSettings,
    }) {
        if (state == null) {
            state = init(canvas, appletSettings)
        }
        return this
    },
    render() {
        if (state == null) {
            throw new Error("Applet not initialized.")
        }

        const { gl } = state

        const verticesCount = 32
        const canvas = gl.canvas as HTMLCanvasElement
        const positions = new Float32Array(2*verticesCount)

        for (let i = 0; i < verticesCount; i++) {
            const angle = 2*i*Math.PI/verticesCount
            const radius = Math.min(canvas.width, canvas.height)/3

            positions[2*i] = canvas.width/2 + radius*Math.cos(angle)
            positions[2*i + 1] = canvas.height/2 + radius*Math.sin(angle)
        }

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.uniform2f(state.sizeUniformLocation, gl.canvas.width, gl.canvas.height)

        const positionBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)
        gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(state.positionAttributeLocation)

        gl.drawArrays(gl.POINTS, 0, verticesCount)

        return this
    },
}

export default applet
