#version 300 es

precision highp float;

uniform vec3 u_reverseLightDirection;
uniform vec3 u_directionalLightColor;
uniform vec3 u_ambientLightColor;
uniform vec4 u_color;
uniform mat3 u_transformNormal;

in vec3 v_normal;

out vec4 fragColor;

void main() {
    vec3 transformedNormal = u_transformNormal*v_normal; // Transform normal vector.

    float directional = max(dot(normalize(transformedNormal), u_reverseLightDirection), 0.0);
    vec3 light = u_directionalLightColor*directional + u_ambientLightColor;

    fragColor = u_color;
    fragColor.rgb *= light;
}
