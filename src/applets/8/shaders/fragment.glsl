#version 300 es

precision highp float;

uniform vec3 u_reverseLightDirection;
uniform vec4 u_color;
uniform mat3 u_transformNormal;

in vec3 v_normal;

out vec4 fragColor;

void main() {
    vec3 transformedNormal = u_transformNormal*v_normal; // Transform normal vector.

    float light = dot(normalize(transformedNormal), u_reverseLightDirection);
    fragColor = u_color;
    fragColor.rgb *= light;
}
