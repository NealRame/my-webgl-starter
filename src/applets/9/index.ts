import {
    mat4,
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

    cameraDistance: number
    cameraAngleTheta: number
    cameraAnglePhi: number

    getNoise: noise.TNoise2DGenerator

    gridResolution: number

    vertices: Float32Array

    discardUI?: () => void
}

function setupUI(
    state: TState,
): TState {

    const canvas = state.gl.canvas as HTMLCanvasElement

    const onMouseWheel = (event: WheelEvent) => {
        const { deltaY } = event
        state.cameraDistance = Math.max(1, state.cameraDistance - deltaY/100)
        frame(state)
    }

    const onMouseMove = (event: MouseEvent) => {
        const { movementX, movementY } = event

        state.cameraAngleTheta -= movementY/100
        state.cameraAnglePhi -= movementX/100
        frame(state)
    }

    const onMouseDown = () => {
        canvas.addEventListener("mousemove", onMouseMove)
    }

    const onMouseUp = () => {
        canvas.removeEventListener("mousemove", onMouseMove)
    }

    canvas.addEventListener("wheel", onMouseWheel)
    canvas.addEventListener("mousedown", onMouseDown)
    canvas.addEventListener("mouseup", onMouseUp)

    return {
        ...state,
        discardUI() {
            canvas.removeEventListener("wheel", onMouseWheel)
            canvas.removeEventListener("mousedown", onMouseDown)
            canvas.removeEventListener("mouseup", onMouseUp)
            canvas.removeEventListener("mousemove", onMouseMove)
        }
    }
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

    const gridResolution = 25

    const [cameraDistance, cameraAngleTheta, cameraAnglePhi] = geometry.cartesianToSpherical(0, 0, 6)
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

    console.log(vertices)

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

        cameraDistance,
        cameraAngleTheta,
        cameraAnglePhi,

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

    const eye = geometry.sphericalToCartesian(
        state.cameraDistance,
        state.cameraAngleTheta,
        state.cameraAnglePhi,
    )

    const modelView = mat4.create()
    mat4.lookAt(modelView, Float32Array.from(eye), [0, 0, 0], [0, 0, 1])

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