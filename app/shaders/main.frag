// main.frag
#extension GL_OES_standard_derivatives : enable
precision highp float;
precision highp int;

uniform mat4 viewMatrix; // world -> eye space
uniform vec3 cameraPosition;
uniform float toneMappingExposure;

uniform vec3 a;
uniform vec3 b;
uniform vec3 c;
uniform vec3 d;
uniform bool flatShading;
uniform float emissiveIntesity;
uniform float diffuseIntesity;

varying vec3 v_color;
varying vec2 v_uv;
varying vec3 v_normal; // normal in eye space
varying vec3 v_position; // position in eye space

#define PI 3.14159265359
#define PI2 6.28318530718
#define PI_HALF 1.5707963267949
#define RECIPROCAL_PI 0.31830988618
#define RECIPROCAL_PI2 0.15915494
#define LOG2 1.442695
#define EPSILON 1e-6

vec3 bilin(vec2 uv) {
  return mix(
    mix(c, d, uv.s),
    mix(a, b, uv.s),
    uv.t
  );
}

vec2 resample(vec2 val, vec2 steps) {
  return floor(val * steps) / steps;
}

void main() {
  /* Process normal for flat shading */
  vec3 normal;
  if (flatShading) {
    normal = normalize( cross( dFdx(v_position), dFdy(v_position) ) );
  } else {
    normal = normalize(v_normal);
    // double sided lighting: flip normal if not front facing
    normal *= float(gl_FrontFacing) * 2.0 - 1.0;
  }
  
  /* Surface color */
  vec3 col = bilin(v_uv);
  
  /* Emissive Light */
  vec3 emissive = col * emissiveIntesity;
  
  /* Diffuse Reflection Lambertian */
  // float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
  // geometry.position = - vViewPosition;
  // geometry.normal = normal;
  // geometry.viewDir = normalize( vViewPosition );
  vec3 toCamera = vec3(0.0, 0.0, 1.0); // ... direction to camera (pos. z-axis)
  float dotNL = clamp( dot( normal, toCamera ), 0.0, 1.0 );
  vec3 diffuse = col * dotNL * diffuseIntesity;
  
  // Diffuse Reflection (Lambertian)
  // vec3 diff = col * dot(v_normal, toCamera) * lightIntensity;
  // diff = clamp(diff, vec3(0.0), vec3(1.0));
  
  /* Total outgoing light */
  vec3 outgoingLight =  emissive + diffuse;
  gl_FragColor = vec4(outgoingLight, 1.0);
}
