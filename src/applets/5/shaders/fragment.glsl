#version 300 es

precision highp float;

out vec4 o_color;

void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    if (d > 0.5) discard;
    o_color = vec4(1.0);
}
