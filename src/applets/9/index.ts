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

    const vertices: Array<geometry.TPoint3D> = []

    const noiseSeed = Date.now()
    const getNoise = noise.createNoise2DGenerator({
        seed: noiseSeed,
    })

    const colToX = (col: number) => 2*col/gridResolution - 1
    const rowToY = (row: number) => -(2*row/gridResolution - 1)

    const vertice = (col: number, row: number) => {
        const x = colToX(col)
        const y = rowToY(row)
        const z = getNoise(x, y)
        return [x, y, z] as geometry.TPoint3D
    }
    // const vertice = (col: number, row: number) => [colToX(col), rowToY(row), 0] as TPoint

    for (let [col, row] of cartesianProduct([0, gridResolution], [0, gridResolution])) {
        const v1 = vertice(col, row)
        const v2 = vertice(col + 1, row)
        const v3 = vertice(col, row + 1)
        const v4 = vertice(col + 1, row + 1)
        // v1    v2
        // +-----+-----+
        // |   / |   / |
        // | /   | /   |
        // +-----+-----+
        // v3    v4
        vertices.push(v1, v3, v1, v2, v3, v2,)
        if (col === gridResolution - 1) {
            vertices.push(v2, v4)
        }
        if (row === gridResolution - 1) {
            vertices.push(v3, v4)
        }
    }

    // console.log(vertices)

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

        vertices: Float32Array.from(vertices.flat()),

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
    gl.drawArrays(gl.LINES, 0, state.vertices.length/3)
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