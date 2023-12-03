import {
    mat3,
    mat4,
    vec3,
} from "gl-matrix"

import {
    createProgram,
} from "../../shaders"

import { geometry } from "../../maths"
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
    transformNormalUniformLocation: WebGLUniformLocation

    colorUniformLocation: WebGLUniformLocation

    reverseLightDirectionUniformLocation: WebGLUniformLocation
    ambientLightUniformLocation: WebGLUniformLocation
    directionalLightUniformLocation: WebGLUniformLocation

    positionAttributeLocation: number
    normalAttributeLocation: number

    projection: "orthographic" | "perspective"

    vertices: Float32Array
    normals: Float32Array

    animated: boolean

    angleY: number

    readonly viewMatrix?: mat4
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

    const normalBuffer = gl.createBuffer()
    if (normalBuffer == null) {
        throw new Error("Unable to create buffer.")
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, state.normals, gl.STATIC_DRAW)
    gl.vertexAttribPointer(state.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    const projection = mat4.create()
    if (state.projection === "perspective") {
        mat4.perspective(projection, Math.PI/5, width/height, 1, Infinity)
    } else {
        mat4.ortho(projection, -2, 2, -2, 2, 4, 8)
    }
    const view = mat4.copy(mat4.create(), state.viewMatrix ?? mat4.create())

    const model = mat4.create()
    mat4.rotateY(model, model, state.angleY)
    mat4.translate(model, model, [-0.5, -0.5, -0.5])

    const tranformNormal = mat3.create()
    mat3.normalFromMat4(tranformNormal, model)

    const transform = mat4.clone(projection)
    mat4.multiply(transform, transform, view)
    mat4.multiply(transform, transform, model)

    const lightDirection = vec3.create()
    vec3.normalize(lightDirection, [0.5, 0.4, 1])

    const ambientLightColor = [0, 0.1, 0]
    const directionalLightColor = [.5, .3, .6]

    gl.uniform4fv(state.colorUniformLocation, [1, 1, 1, 1])
    gl.uniform3fv(state.ambientLightUniformLocation, ambientLightColor)
    gl.uniform3fv(state.directionalLightUniformLocation, directionalLightColor)
    gl.uniform3fv(state.reverseLightDirectionUniformLocation, lightDirection)
    gl.uniformMatrix4fv(state.tranformUniformLocation, false, transform)
    gl.uniformMatrix3fv(state.transformNormalUniformLocation, false, tranformNormal)
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

    const transformNormalUniformLocation = gl.getUniformLocation(program, "u_transformNormal")
    if (transformNormalUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_transformNormal.")
    }

    const colorUniformLocation = gl.getUniformLocation(program, "u_color")
    if (colorUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_color.")
    }

    const reverseLightDirectionUniformLocation = gl.getUniformLocation(program, "u_reverseLightDirection")
    if (reverseLightDirectionUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_reverseLightDirection.")
    }

    const ambientLightUniformLocation = gl.getUniformLocation(program, "u_ambientLightColor")
    if (ambientLightUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_ambientLight.")
    }

    const directionalLightUniformLocation = gl.getUniformLocation(program, "u_directionalLightColor")
    if (directionalLightUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_ambientLight.")
    }

    const positionAttributeLocation = gl.getAttribLocation(program, "a_position")
    if (positionAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_position.`)
    }
    gl.enableVertexAttribArray(positionAttributeLocation)

    const normalAttributeLocation = gl.getAttribLocation(program, "a_normal")
    if (normalAttributeLocation < 0) {
        throw new Error(`Unable to get attribute location for a_normal.`)
    }
    gl.enableVertexAttribArray(normalAttributeLocation)

    const vertices = geometry.cube()
    const normals = geometry.normals(vertices)

    return {
        settings,
        gl,
        program,

        projection: "perspective",

        colorUniformLocation,

        reverseLightDirectionUniformLocation,
        ambientLightUniformLocation,
        directionalLightUniformLocation,

        positionAttributeLocation,
        tranformUniformLocation,
        vertices,

        normalAttributeLocation,
        transformNormalUniformLocation,
        normals,

        angleY: 0,
        animated: false,
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

    const eye = [6, 2, 6] as geometry.TPoint3D
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
            projectionSelect.discard()
            mouseController.discard()
        },
    })

    return state
}


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
        if (state == null) {
            throw new Error("Applet not initialized.")
        }

        frame(state)

        return this
    },
    set animate(value: boolean) {
        if (state != null) {
            if (value && !state.animated) {
                state.animated = true
                const animate = () => {
                    if (state?.animated) {
                        frame(state)
                        state.angleY += 0.01
                        requestAnimationFrame(animate)
                    }
                }
                requestAnimationFrame(animate)
            } else {
                state.animated = false
            }
        }
    },
    get animate() {
        return state?.animated ?? false
    },
}

export default applet