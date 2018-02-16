// test.vert
precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

uniform vec3 a;
uniform vec3 b;
uniform vec3 c;
uniform vec3 d;
uniform vec2 c1;
uniform vec2 c2;
uniform vec2 steps;

varying vec3 v_color;
varying vec2 v_uv;

vec3 bilin(vec2 uv) {
  return mix(
    mix(c, d, uv.s),
    mix(a, b, uv.s),
    uv.t
  );
}

void main() {
  // v_color = bilin(uv);
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
