// main.vert
precision highp float;
precision highp int;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix; // model -> world space
uniform mat4 modelViewMatrix; // model -> eye space
uniform mat4 projectionMatrix; // eye -> clip space
uniform mat3 normalMatrix; // model -> eye space (modelView for normals)

uniform vec3 a;
uniform vec3 b;
uniform vec3 c;
uniform vec3 d;

// varying vec3 v_color;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;

vec3 bilin(vec2 uv) {
  return mix(
    mix(c, d, uv.s),
    mix(a, b, uv.s),
    uv.t
  );
}

void main() {
  // v_color = bilin(uv);
  
  /* uv pass-thru */
  v_uv = uv; 
  
  /* normal in eye space */
  v_normal = normalize(normalMatrix * normal);
  
  /* position in eye space */
  vec4 mv_position = modelViewMatrix * vec4(position, 1.0);
  v_position = -mv_position.xyz;
  
  /* position in clip space */
  gl_Position = projectionMatrix * mv_position;
}
