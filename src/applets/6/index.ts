import {
    mat3,
} from "gl-matrix"

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

    tranformUniformLocation: WebGLUniformLocation
    colorUniformLocation: WebGLUniformLocation
    positionAttributeLocation: number
}

let state: TState | null

let applet: IApplet = {
    get name() {
        return "Exercice 6"
    },
    setup({
        canvas,
        appletSettings: settings,
    }) {
        if (state == null) {
            const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
            if (gl == null) {
                throw new Error("Unable to get WebGL2 context.")
            }

            const program = createProgram(gl, shaderSource)

            gl.useProgram(program)

            const tranformUniformLocation = gl.getUniformLocation(program, "u_transform")
            if (tranformUniformLocation == null) {
                throw new Error("Unable to get uniform location for u_transform.")
            }

            const colorUniformLocation = gl.getUniformLocation(program, "u_color")
            if (colorUniformLocation == null) {
                throw new Error("Unable to get uniform location for u_color.")
            }

            const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
            if (positionAttributeLocation < 0) {
                throw new Error(`Unable to get attribute location for a_position.`)
            }
            gl.enableVertexAttribArray(positionAttributeLocation)

            const positionBuffer = gl.createBuffer()
            if (positionBuffer == null) {
                throw new Error("Unable to create buffer.")
            }

            state = {
                settings,
                gl,
                program,
                tranformUniformLocation,
                colorUniformLocation,
                positionAttributeLocation,
            }
        }
        return this
    },
    cleanup() {
        if (state != null ) {
            state.gl.deleteProgram(state.program)
            state = null
        }
        return this
    },
    render() {
        if (state == null) {
            throw new Error("Applet not initialized.")
        }

        const { gl } = state

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        const positionBuffer = gl.createBuffer()
        if (positionBuffer == null) {
            throw new Error("Unable to create buffer.")
        }

        const l = Math.min(gl.canvas.width, gl.canvas.height)

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0,
            l, 0,
            l, l,
            0, l,
        ]), gl.STATIC_DRAW)

        gl.vertexAttribPointer(state.positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

        let transform = mat3.create()

        // [width, height] -> [0, 1]
        mat3.scale(transform, transform, [1, -1])
        mat3.translate(transform, transform, [-1, -1])
        mat3.scale(transform, transform, [2, 2])
        mat3.scale(transform, transform, [1/gl.canvas.width, 1/gl.canvas.height])

        mat3.translate(transform, transform, [(gl.canvas.width - l)/2, (gl.canvas.height - l)/2])
        mat3.translate(transform, transform, [l/2, l/2])

        const count = 128

        for (let i = 0; i < count; i++) {
            const transformStack = [mat3.clone(transform)]

            const scale = .8*(1 - (i + 1)/count)
            const color = (i + 1)/count

            mat3.scale(transform, transform, [scale, scale])
            mat3.rotate(transform, transform, 2*i*Math.PI/count)
            mat3.translate(transform, transform, [-l/2, -l/2])

            gl.uniformMatrix3fv(state.tranformUniformLocation, false, transform)

            gl.uniform3f(state.colorUniformLocation, color, 0.2, 1 - color)
            gl.drawArrays(gl.LINE_LOOP, 0, 4)

            transform = transformStack.pop() as mat3
        }

        return this
    },
}

export default applet