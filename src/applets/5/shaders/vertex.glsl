#version 300 es

in vec2 a_position;

uniform vec2 u_size;

void main() {
    vec2 pos = a_position;

    pos = pos/u_size;
    pos = pos*2.0 - 1.0;

    gl_PointSize = 10.0;
    gl_Position = vec4(pos.x, -pos.y, 0, 1);
}
