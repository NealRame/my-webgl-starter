#version 300 es

// An attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

uniform vec2 u_size;

// All shaders have a main function
void main() {
    // convert the position to clip space
    gl_Position = vec4(a_position/u_size*2.0 - 1.0, 0, 1);
}
