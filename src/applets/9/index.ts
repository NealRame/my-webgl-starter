import {
    mat4,
    vec3,
} from "gl-matrix"

import {
    cartesianProduct,
} from "../../algorithms"

import {
    noise,
    geometry,
} from "../../maths"

import {
    createProgram,
} from "../../shaders"

import * as UI from "../../ui"

import * as shaderSource from "./shaders"

import type {
    IApplet,
} from "../types"
import { TNoise2DGenerator } from "../../maths/noise"

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext
    program: WebGLProgram

    positionAttributeLocation: number
    tranformUniformLocation: WebGLUniformLocation

    getNoise: noise.TNoise2DGenerator

    gridResolution: number

    vertices: Float32Array

    readonly viewMatrix?: mat4
    discardUI?: () => void
}

function createVerticeGenerator(sideSize: number, getNoise: TNoise2DGenerator) {
    const colToX = (col: number) =>  (2*col/sideSize - 1)
    const rowToY = (row: number) => -(2*row/sideSize - 1)

    return (col: number, row: number) => {
        const x = colToX(col)
        const y = rowToY(row)
        const z = getNoise(x, y)
        return [x, y, z] as geometry.TPoint3D
    }
}

function createSurfaceWireframe(
    sideSize: number,
    getNoise: TNoise2DGenerator,
) {
    let offset = 0
    const vertices = new Float32Array(3*6*(sideSize - 1)**2)
    const getVertice = createVerticeGenerator(sideSize, getNoise)

    for (let [col, row] of cartesianProduct([0, sideSize], [0, sideSize])) {
        // v0    v1
        // +-----+-----+
        // |   / |   / |
        // | /   | /   |
        // +-----+-----+
        // v2    v3
        const v0 = getVertice(col, row)
        const v1 = getVertice(col + 1, row)
        const v2 = getVertice(col, row + 1)
        const v3 = getVertice(col + 1, row + 1)

        // line v0, v1
        vertices.set(v0, offset); offset += 3
        vertices.set(v1, offset); offset += 3
        // line v0, v2
        vertices.set(v0, offset); offset += 3
        vertices.set(v2, offset); offset += 3
        // line v1, v2
        vertices.set(v1, offset); offset += 3
        vertices.set(v2, offset); offset += 3

        if (col === sideSize - 1) {
            // line v1, v3
            vertices.set(v1, offset); offset += 3
            vertices.set(v3, offset); offset += 3
        }
        if (row === sideSize - 1) {
            // line v2, v3
            vertices.set(v2, offset); offset += 3
            vertices.set(v3, offset); offset += 3
        }
    }

}

function createSurface(
    sideSize: number,
    getNoise: TNoise2DGenerator,
) {
    let offset = 0
    const vertices = new Float32Array(3*6*(sideSize - 1)**2)
    const getVertice = createVerticeGenerator(sideSize, getNoise)

    for (let [col, row] of cartesianProduct([0, sideSize - 1], [0, sideSize - 1])) {
        // v0    v1
        // +-----+-----+
        // |   / |   / |
        // | /   | /   |
        // +-----+-----+
        // v2    v3    |
        // |     |     |
        // +-----+-----+
        const v0 = getVertice(col, row)
        const v1 = getVertice(col + 1, row)
        const v2 = getVertice(col, row + 1)
        const v3 = getVertice(col + 1, row + 1)

        // v0, v2, v3 triangle
        vertices.set(v0, offset); offset += 3
        vertices.set(v2, offset); offset += 3
        vertices.set(v1, offset); offset += 3

        // v1, v2, v3 triangle
        vertices.set(v1, offset); offset += 3
        vertices.set(v2, offset); offset += 3
        vertices.set(v3, offset); offset += 3
    }
    return vertices
}

function setupUI(
    state: TState,
): TState {
    const eye = [0, 0, 10] as geometry.TPoint3D
    const mouseController = UI.controllers.trackballRotator({
        el: state.gl.canvas as HTMLCanvasElement,
        viewDistance: vec3.length(vec3.fromValues(...eye)),
        viewpointDirection: vec3.normalize(vec3.create(), vec3.fromValues(...eye)),
        viewUp: vec3.fromValues(0, 1, 0),
        onMouseDrag: () => {
            frame(state)
        },
    })

    Object.defineProperty(state, "viewMatrix", {
        get() {
            return mouseController.viewMatrix
        },
    })

    Object.defineProperty(state, "discardUI", {
        value() {
            mouseController.discard()
        },
    })

    return state
}

function init(
    canvas: HTMLCanvasElement,
    settings: HTMLFormElement,
): TState {
    const gl = canvas.getContext("webgl2") as WebGL2RenderingContext
    if (gl == null) {
        throw new Error("Unable to get WebGL2 context.")
    }

    const program = createProgram(gl, shaderSource)

    gl.useProgram(program)
    gl.enable(gl.CULL_FACE)
    gl.enable(gl.DEPTH_TEST)

    const gridResolution = 32
    const getNoise = noise.createNoise2DGenerator({
        seed: Date.now(),
    })

    const vertices = createSurface(gridResolution, getNoise)

    const tranformUniformLocation = gl.getUniformLocation(program, "u_MVP_matrix")
    if (tranformUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_transform.")
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_position.`)
    }
    gl.enableVertexAttribArray(positionAttributeLocation)

    return {
        settings,
        gl,
        program,

        gridResolution,

        getNoise,
        vertices,

        positionAttributeLocation,
        tranformUniformLocation,
    }
}

function frame(state: TState) {
    const { gl } = state
    const { width, height } = gl.canvas

    gl.viewport(0, 0, width, height)
    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    const positionBuffer = gl.createBuffer()
    if (positionBuffer == null) {
        throw new Error("Unable to create buffer.")
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, state.vertices, gl.STATIC_DRAW)
    gl.vertexAttribPointer(state.positionAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    const projection = mat4.create()
    mat4.perspective(projection, Math.PI/5, width/height, 1, Infinity)

    const modelView = mat4.copy(mat4.create(), state.viewMatrix ?? mat4.create())
    const transform = mat4.create()
    mat4.multiply(transform, projection, modelView)

    gl.uniformMatrix4fv(state.tranformUniformLocation, false, transform)
    // gl.drawArrays(gl.LINES, 0, state.vertices.length/3)
    gl.drawArrays(gl.TRIANGLES, 0, state.vertices.length/3)
}

let state: TState | null

let applet: IApplet = {
    get name() {
        return "Exercice 8"
    },
    setup({
        canvas,
        appletSettings: settings,
    }) {
        if (state == null) {
            state = setupUI(init(canvas, settings))
        }
        return this
    },
    cleanup() {
        if (state != null ) {
            this.animate = false
            state.discardUI?.()
            state.gl.deleteProgram(state.program)
            state = null
        }
        return this
    },
    render() {
        if (state === null) {
            throw new Error("Applet not initialized.")
        }
        frame(state)
        return this
    },
}

export default applet