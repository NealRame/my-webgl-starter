#version 300 es

precision highp float;

uniform vec3 u_ambientLightColor;
uniform vec3 u_directionalLightColor;
uniform vec3 u_lightDirection;
uniform vec3 u_color;
uniform mat3 u_transformNormal;

in vec3 v_normal;

out vec4 out_color;

void main() {
    vec3 transformedNormal = u_transformNormal*v_normal; // Transform normal vector.
    float directional = max(dot(normalize(transformedNormal), u_lightDirection), 0.0);

    vec3 light = u_directionalLightColor*directional + u_ambientLightColor;

    out_color = vec4(u_color, 1.0);
    out_color.rgb *= light;
}
