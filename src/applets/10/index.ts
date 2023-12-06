import {
    mat3,
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

    colorUniformLocation: WebGLUniformLocation
    ambientLightUniformLocation: WebGLUniformLocation
    directionalLightUniformLocation: WebGLUniformLocation
    lightDirectionUniformLocation: WebGLUniformLocation
    tranformUniformLocation: WebGLUniformLocation
    transformNormalUniformLocation: WebGLUniformLocation

    positionAttributeLocation: number
    normalAttributeLocation: number

    noiseSettings: Required<noise.TNoise2DGeneratorOptions>
    getNoise: noise.TNoise2DGenerator

    gridResolution: number

    vertices: Float32Array
    normals: Float32Array

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

    const gridResolution = UI.widgets.createNumberInput(state.settings, {
        label: "Smoothness",
        min: 32,
        max: 256,
        step: 1,
        get value() {
            return state.gridResolution
        },
        set value(value) {
            state.gridResolution = value
        },
    })

    const amplitude = UI.widgets.createNumberInput(state.settings, {
        label: "Amplitude",
        min: 0,
        max: 1,
        step: 0.1,
        get value() {
            return state.noiseSettings.amplitude
        },
        set value(value) {
            state.noiseSettings.amplitude = value
        },
    })

    const frequency = UI.widgets.createNumberInput(state.settings, {
        label: "Frequency",
        min: 0,
        max: 10,
        step: 0.1,
        get value() {
            return state.noiseSettings.frequency
        },
        set value(value) {
            state.noiseSettings.frequency = value
        },
    })

    const octaves = UI.widgets.createNumberInput(state.settings, {
        label: "Octaves",
        min: 1,
        max: 8,
        step: 1,
        get value() {
            return state.noiseSettings.octaves
        },
        set value(value) {
            state.noiseSettings.octaves = value
        },
    })

    const persistence = UI.widgets.createNumberInput(state.settings, {
        label: "Persistence",
        min: 0,
        max: 1,
        step: 0.1,
        get value() {
            return state.noiseSettings.persistence
        },
        set value(value) {
            state.noiseSettings.persistence = value
        },
    })

    const scale = UI.widgets.createNumberInput(state.settings, {
        label: "Scale",
        min: 0.1,
        max: 10,
        step: 0.1,
        get value() {
            return state.noiseSettings.scale
        },
        set value(value) {
            state.noiseSettings.scale = value
        },
    })

    const updateNoiseSettings = () => {
        state.getNoise = noise.createNoise2DGenerator(state.noiseSettings)
        state.vertices = createSurface(state.gridResolution, state.getNoise)
        state.normals = geometry.normals(state.vertices)
        frame(state)
    }

    const seed = UI.widgets.createButton(state.settings, {
        label: "Update seed",
        update: () => {
            state.noiseSettings.seed = Date.now()
            updateNoiseSettings()
        },
    })

    state.settings.addEventListener("input", updateNoiseSettings)

    Object.defineProperty(state, "viewMatrix", {
        get() {
            return mouseController.viewMatrix
        },
    })

    Object.defineProperty(state, "discardUI", {
        value() {
            mouseController.discard()
            gridResolution.discard()
            amplitude.discard()
            frequency.discard()
            octaves.discard()
            persistence.discard()
            scale.discard()
            seed.discard()
            state.settings.removeEventListener("input", updateNoiseSettings)
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

    const gridResolution = 64
    const noiseSettings = {
        ...noise.noise2DGeneratorConfigDefaults,
        seed: Date.now(),
    }
    const getNoise = noise.createNoise2DGenerator({
        seed: Date.now(),
    })

    const vertices = createSurface(gridResolution, getNoise)
    const normals = geometry.normals(vertices)

    const tranformUniformLocation = gl.getUniformLocation(program, "u_MVP_matrix")
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

    const ambientLightUniformLocation = gl.getUniformLocation(program, "u_ambientLightColor")
    if (ambientLightUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_ambientLight.")
    }

    const directionalLightUniformLocation = gl.getUniformLocation(program, "u_directionalLightColor")
    if (directionalLightUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_ambientLight.")
    }

    const lightDirectionUniformLocation = gl.getUniformLocation(program, "u_lightDirection")
    if (lightDirectionUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_lightDirection.")
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

    return {
        settings,
        gl,
        program,

        noiseSettings,
        getNoise,
        gridResolution,

        vertices,
        normals,

        ambientLightUniformLocation,
        colorUniformLocation,
        directionalLightUniformLocation,
        lightDirectionUniformLocation,
        tranformUniformLocation,
        transformNormalUniformLocation,

        positionAttributeLocation,
        normalAttributeLocation,
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

    const normalBuffer = gl.createBuffer()
    if (normalBuffer == null) {
        throw new Error("Unable to create buffer.")
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, state.normals, gl.STATIC_DRAW)
    gl.vertexAttribPointer(state.normalAttributeLocation, 3, gl.FLOAT, false, 0, 0)

    const projection = mat4.create()
    mat4.perspective(projection, Math.PI/5, width/height, 1, Infinity)

    const view = mat4.copy(mat4.create(), state.viewMatrix ?? mat4.create())
    const model = mat4.create()

    const tranformNormal = mat3.create()
    mat3.normalFromMat4(tranformNormal, model)

    const transform = mat4.create()
    mat4.multiply(transform, transform, projection)
    mat4.multiply(transform, transform, view)
    mat4.multiply(transform, transform, model)
    
    gl.uniform3fv(state.colorUniformLocation, [1.0, 1.0, 1.0])
    gl.uniform3fv(state.ambientLightUniformLocation, [0.2, 0.2, 0.2])
    gl.uniform3fv(state.directionalLightUniformLocation, [0.6, 0.6, 0.6])
    gl.uniform3fv(state.lightDirectionUniformLocation, [0.5, 0.4, 1.0])
    gl.uniformMatrix4fv(state.tranformUniformLocation, false, transform)
    gl.uniformMatrix3fv(state.transformNormalUniformLocation, false, tranformNormal)

    gl.drawArrays(gl.TRIANGLES, 0, state.vertices.length/3)
}

let state: TState | null

let applet: IApplet = {
    get name() {
        return "Exercice 10"
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