import {
    ShaderProgramSource,
} from "./types"

function createShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
) {
    const shader = gl.createShader(type)

    if (shader == null) {
        throw new Error("Failed to create shader.")
    }

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS)
    if (success) {
        return shader
    }

    const err = new Error(gl.getShaderInfoLog(shader) ?? "")
    gl.deleteShader(shader)
    throw err
}

export function createProgram(
    gl: WebGL2RenderingContext,
    {
        vertex: vertexShaderSource,
        fragment: fragmentShaderSource,
    }: ShaderProgramSource,
) {
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    const program = gl.createProgram()

    if (program == null) {
        throw new Error("Failed to create program.")
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    const success = gl.getProgramParameter(program, gl.LINK_STATUS)
    if (!success) {
        const reason = gl.getProgramInfoLog(program) ?? ""
        gl.deleteProgram(program)
        throw new Error(reason)
    }

    return program
}

export * from "./types"
