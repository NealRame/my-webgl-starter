#version 300 es

in vec4 a_position;

uniform mat4 u_MVP_matrix; // model-view-projection matrix

void main()
{
    gl_Position = u_MVP_matrix*a_position;
}
