import {
    mat4,
} from "gl-matrix"

import {
    createProgram,
} from "../../shaders"

import {
    times,
} from "../../algorithms"

import * as geometry from "../../maths/geometry"
import * as UI from "../../ui"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext
    program: WebGLProgram

    tranformUniformLocation: WebGLUniformLocation
    positionAttributeLocation: number
    colorAttributeLocation: number

    projection: "orthographic" | "perspective"

    vertices: Float32Array
    colors: Float32Array

    eye: geometry.TPoint3D

    discardUI?: () => void
}

let state: TState | null

function frame(
    state: TState,
) {
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

    const colorBuffer = gl.createBuffer()
    if (colorBuffer == null) {
        throw new Error("Unable to create buffer.")
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, state.colors, gl.STATIC_DRAW)
    gl.vertexAttribPointer(state.colorAttributeLocation, 4, gl.FLOAT, false, 0, 0)

    const projection = mat4.create()
    if (state.projection === "perspective") {
        mat4.perspective(projection, Math.PI/5, width/height, 1, Infinity)
    } else {
        mat4.ortho(projection, -2, 2, -2, 2, 4, 8)
    }

    const modelView = mat4.create()
    mat4.lookAt(modelView, Float32Array.from(state.eye), [0, 0, 0], [0, 1, 0])
    mat4.translate(modelView, modelView, [-0.5, -0.5, -0.5])

    let transform = mat4.create()
    mat4.multiply(transform, projection, modelView)

    gl.uniformMatrix4fv(state.tranformUniformLocation, false, transform)
    gl.drawArrays(gl.TRIANGLES, 0, state.vertices.length/3)
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

    const tranformUniformLocation = gl.getUniformLocation(program, "u_transform")
    if (tranformUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_transform.")
    }

    const colorAttributeLocation = gl.getAttribLocation(program, "a_color")
    if (colorAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_color.`)
    }
    gl.enableVertexAttribArray(colorAttributeLocation)

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_position.`)
    }
    gl.enableVertexAttribArray(positionAttributeLocation)

    const randomColor = () => [Math.random(), Math.random(), Math.random(), 1]
    const vertices = geometry.cube()
    const colors = Float32Array.from([
        ...times(6, randomColor()), // Front face
        ...times(6, randomColor()), // Back face
        ...times(6, randomColor()), // Top face
        ...times(6, randomColor()), // Bottom face
        ...times(6, randomColor()), // Right face
        ...times(6, randomColor()), // Left face
    ].flat())

    const eye = [6, 2, 6] as geometry.TPoint3D

    return {
        settings,
        gl,
        program,

        projection: "perspective",

        tranformUniformLocation,
        colorAttributeLocation,
        positionAttributeLocation,

        vertices,
        colors,

        eye,
    }
}

function setupUI(
    state: TState,
): TState {
    const projectionSelect = UI.widget.createSelect(state.settings, {
        label: "Projection",
        values: [["orthographic", "Orthographic"], ["perspective", "Perspective"]],
        get value() {
            return state.projection
        },
        set value(value) {
            state.projection = value
            frame(state)
        },
    })

    const mouseController = UI.controllers.mouseRotator({
        el: state.gl.canvas as HTMLCanvasElement,
        eye: state.eye,
        onMouseDrag: p => {
            state.eye = p
            frame(state)
        },
    })

    return Object.assign(state, {
        discardUI() {
            projectionSelect.discard()
            mouseController.discard()
        }
    })
}


let applet: IApplet = {
    get name() {
        return "Exercice 7"
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
        if (state == null) {
            throw new Error("Applet not initialized.")
        }
        frame(state)
        return this
    },
}

export default applet