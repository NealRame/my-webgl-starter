import {
    createProgram,
} from "../../shaders"

import * as UI from "../../ui"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TLayer = {
    color: [number, number, number, number]
    size: [number, number]
    position: [number, number]

    colorAttributeLocation: number
    positionAttributeLocation: number
    positionBuffer: WebGLBuffer

    vao: WebGLVertexArrayObject
}

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext
    program: WebGLProgram
    sizeUniformLocation: WebGLUniformLocation
    layers: TLayer[]
    discardUI?: () => void
}

let state: TState | null = null

function setupUI(
    state: TState,
    update: () => void,
) {
    const widgets: Array<UI.TWidget> = []

    ;["Layer 1", "Layer 2"].forEach((layer, layerIndex) => {
        ;UI.createHeader(state.settings, layer)
        ;["Red", "Green", "Blue", "Alpha"].forEach((label, colorIndex) => {
            widgets.push(UI.createNumberInput(state.settings, {
                label,
                min: 0,
                max: 1,
                step: 0.01,
                get value() {
                    return state.layers[layerIndex]?.color[colorIndex] ?? 0
                },
                set value(value: number) {
                    const layer = state.layers[layerIndex]
                    if (layer != null) {
                        layer.color[colorIndex] = value
                    }
                },
            }))
        })
        ;["X", "Y"].forEach((label, index) => {
            widgets.push(UI.createNumberInput(state.settings, {
                label,
                unit: "px",
                min: 0,
                max: 1024,
                step: 1,
                get value() {
                    return state.layers[layerIndex]?.position[index] ?? 0
                },
                set value(value: number) {
                    const layer = state.layers[layerIndex]
                    if (layer != null) {
                        layer.position[index] = value
                    }
                },
            }))
        })
        ;["Width", "Height"].forEach((label, index) => {
            widgets.push(UI.createNumberInput(state.settings, {
                label,
                unit: "px",
                min: 0,
                max: 1024,
                step: 1,
                get value() {
                    return state.layers[layerIndex]?.size[index] ?? 0
                },
                set value(value: number) {
                    const layer = state.layers[layerIndex]
                    if (layer != null) {
                        layer.size[index] = value
                    }
                },
            }))
        })
    })

    state.settings.addEventListener("input", update)
    state.discardUI = () => {
        state.settings.removeEventListener("input", update)
        widgets.forEach(w => w.discard())
        state.settings.innerHTML = ""
    }
}

function init(
    canvas: HTMLCanvasElement,
    settings: HTMLFormElement,
): TState {
    const gl = canvas.getContext("webgl2", {
        alpha: false,
    }) as WebGL2RenderingContext
    if (!gl) {
        throw new Error("Unable to initialize WebGL. Your browser or machine may not support it.")
    }

    const program = createProgram(gl, shaderSource)

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(program)

    const sizeUniformLocation = gl.getUniformLocation(program, "u_size")
    if (!sizeUniformLocation) {
        throw new Error("Unable to get uniform location for u_size.")
    }
    const layers = [{
        color: [1, 0, 0, 1],
        size: [400, 400],
        position: [100, 100],
    }, {
        color: [0, 0, 1, .5],
        size: [400, 400],
        position: [120, 120]
    }].map(layer => {
        const colorAttributeLocation = gl.getAttribLocation(program, `a_color`)
        if (colorAttributeLocation < 0) {
            throw new Error(`Unable to get attribute location for a_color.`)
        }

        const positionAttributeLocation = gl.getAttribLocation(program, `a_position`)
        if (positionAttributeLocation < 0) {
            throw new Error(`Unable to get attribute location for a_position.`)
        }

        const positionBuffer = gl.createBuffer() as WebGLBuffer
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

        const vao = gl.createVertexArray() as WebGLVertexArrayObject
        gl.bindVertexArray(vao)
        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

        return {
            ...layer,
            colorAttributeLocation,
            positionAttributeLocation,
            positionBuffer,
            vao,
        } as TLayer
    })

    return {
        settings,
        gl,
        program,
        sizeUniformLocation,
        layers,
    }
}

const applet: IApplet = {
    get name() {
        return "Exercise 3"
    },
    cleanup() {
        if (state != null) {
            state.discardUI?.()
            state = null
        }
        return this
    },
    setup({ canvas, appletSettings }) {
        if (state == null) {
            state = init(canvas, appletSettings)
            setupUI(state, this.render)
        }
        return this
    },
    render() {
        if (!state) {
            throw new Error("State not initialized. Call setup() first.")
        }

        const { gl } = state

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.uniform2f(state.sizeUniformLocation, gl.canvas.width, gl.canvas.height)

        for (const layer of state.layers) {
            gl.bindVertexArray(layer.vao)

            gl.vertexAttrib4f(layer.colorAttributeLocation, ...layer.color)
            gl.bindBuffer(gl.ARRAY_BUFFER, layer.positionBuffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
                // triangle 1
                layer.position[0],                 // x
                layer.position[1],                 // y
                layer.position[0] + layer.size[0], // x + width
                layer.position[1],                 // y
                layer.position[0],                 // x
                layer.position[1] + layer.size[1], // y + height

                // triangle 2
                layer.position[0] + layer.size[0], // x + width
                layer.position[1],                 // y
                layer.position[0] + layer.size[0], // x + width
                layer.position[1] + layer.size[1], // y + height
                layer.position[0],                 // x
                layer.position[1] + layer.size[1], // y + height
            ]), gl.STATIC_DRAW)

            gl.drawArrays(gl.TRIANGLES, 0, 6)
        }

        return this
    }
}

export default applet