#version 300 es

in vec2 a_position;
in vec4 a_color;

out vec4 v_color;

void main() {
    v_color = a_color;
    gl_Position = vec4(a_position.xy, 0, 1);
}
