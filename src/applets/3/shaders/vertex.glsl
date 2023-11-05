#version 300 es

in vec2 a_position;
in vec4 a_color;

uniform vec2 u_size;

out vec4 v_color;

void main() {
    v_color = a_color;
    gl_Position = vec4((a_position/u_size*2.0 - 1.0)*vec2(1, -1), 0, 1);
}
