import {
    createProgram,
} from "../../shaders"

import * as UI from "../../ui"

import {
    IApplet,
} from "../types"

import * as shaderSource from "./shaders"

type TColor = [number, number, number, number]
type TPoint = [number, number]

type TShape = {
    vao: WebGLVertexArrayObject
    verticesCount: number
    primitiveType: number
}

type TShapeEvent = {
    color: TColor
    position: TPoint
    shape: string
}

type TState = {
    settings: HTMLFormElement
    gl: WebGL2RenderingContext

    program: WebGLProgram

    colorUniformLocation: WebGLUniformLocation
    positionUniformLocation: WebGLUniformLocation
    sizeUniformLocation: WebGLUniformLocation

    shapes: Record<string, TShape>
    shapeEvents: TShapeEvent[]
    currentShape: string

    discardUI?: () => void
}

export function circle2d(
    centerX: number,
    centerY: number,
    radius: number,
    segments: number,
) {
    const vertices = []
    vertices.push([centerX, centerY])
    for (let i = 0; i <= segments; i++) {
        const angle = 2*i*Math.PI/segments
        vertices.push([
            centerX + radius*Math.cos(angle),
            centerY + radius*Math.sin(angle),
        ])
    }
    return vertices
}

function getMousePosition(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
): [number, number] {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    return [x, y]
}

function setupUI(
    state: TState,
    update: () => void,
): TState {
    const onClick = (event: Event) => {
        if (!state) {
            throw new Error("State not initialized. Call setup() first.")
        }

        const { gl } = state
        const [x, y] = getMousePosition(
            event as MouseEvent,
            gl.canvas as HTMLCanvasElement,
        )

        state.shapeEvents.push({
            position: [x, y],
            color: [Math.random(), Math.random(), Math.random(), Math.random()],
            shape: state.currentShape,
        })

        update()
    }

    const discardShapeSelector = UI.createSelect(state.settings, {
        label: "Shape",
        values: Object.keys(state.shapes),
        get value() {
            return state.currentShape
        },
        set value(value: string) {
            state.currentShape = value
        },
    })

    state.gl.canvas.addEventListener("click", onClick)
    state.discardUI = () => {
        discardShapeSelector()
        state.gl.canvas.removeEventListener("click", onClick)
    }

    return state
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

    const colorUniformLocation = gl.getUniformLocation(program, "u_color")
    if (colorUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_color.")
    }

    const positionUniformLocation = gl.getUniformLocation(program, "u_position")
    if (positionUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_translation.")
    }

    const sizeUniformLocation = gl.getUniformLocation(program, "u_size")
    if (sizeUniformLocation == null) {
        throw new Error("Unable to get uniform location for u_size.")
    }

    const shapes = [{
        name: "circle",
        vertices: circle2d(0, 0, 200, 64),
    }, {
        name: "triangle",
        vertices: circle2d(0, 0, 200, 3),
    }, {
        name: "square",
        vertices: circle2d(0, 0, 200, 4),
    }].map(({name, vertices}) => {
        const positionAttributeLocation = gl.getAttribLocation(program, `a_position`)
        if (positionAttributeLocation < 0) {
            throw new Error(`Unable to get attribute location for a_position.`)
        }

        const vao = gl.createVertexArray()
        if (vao == null) {
            throw new Error("Unable to create vertex array.")
        }
        gl.bindVertexArray(vao)

        const buffer = gl.createBuffer() as WebGLBuffer
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices.flat()), gl.STATIC_DRAW)

        gl.enableVertexAttribArray(positionAttributeLocation)
        gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0)

        return {
            [name]: {
                vao,
                verticesCount: vertices.length,
            } as TShape,
        }
    })

    return {
        settings,
        gl,
        program,

        colorUniformLocation,
        positionUniformLocation,
        sizeUniformLocation,

        shapes: Object.assign({}, ...shapes),
        currentShape: "circle",
        shapeEvents: [],
    }
}

let state: TState | null = null

const applet: IApplet = {
    get name() {
        return "Exercice 4"
    },
    setup({
        canvas,
        appletSettings,
    }) {
        if (state == null) {
            state = setupUI(init(canvas, appletSettings), this.render)
        }
        return this
    },
    cleanup() {
        if (state != null) {
            state.discardUI?.()
            state = null
        }
        return this
    },
    render() {
        if (!state) {
            throw new Error("State not initialized. Call setup() first.")
        }

        const { gl } = state

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
        gl.clearColor(0, 0, 0, 1)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        for (const { color, position, shape } of state.shapeEvents) {
            const shapeInfo = state.shapes[shape]

            if (!shapeInfo) {
                throw new Error(`Shape ${shape} not found.`)
            }

            gl.uniform4f(state.colorUniformLocation, ...color)
            gl.uniform2f(state.positionUniformLocation, ...position)
            gl.uniform2f(state.sizeUniformLocation, gl.canvas.width, gl.canvas.height)
            gl.bindVertexArray(shapeInfo.vao)
            gl.drawArrays(gl.TRIANGLE_FAN, 0, shapeInfo.verticesCount)
        }

        return this
    },
}

export default applet
