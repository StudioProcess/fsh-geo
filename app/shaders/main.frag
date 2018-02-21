// main.frag
#extension GL_OES_standard_derivatives : enable
precision highp float;
precision highp int;

uniform mat4 viewMatrix; // world -> eye space
uniform vec3 cameraPosition;
uniform float toneMappingExposure;

uniform vec3 colors[8];
uniform bool flatShading;
uniform float emissiveIntesity;
uniform float diffuseIntesity;
uniform float lambertStrength;
uniform float lambertHarshness;
uniform mat3 uvTransform;

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


/* Bilinear interpolation between four colors */
vec3 bilerp(vec3 c[4], vec2 uv) {
  return mix(
    mix(c[0], c[1], uv.s),
    mix(c[2], c[3], uv.s),
    uv.t
  );
}
vec3 bilerp(vec3 c[8], vec2 uv) {
  return mix(
    mix(c[0], c[1], uv.s),
    mix(c[2], c[3], uv.s),
    uv.t
  );
}
vec3 bilerp(vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec2 uv) {
  return mix(
    mix(c0, c1, uv.s),
    mix(c2, c3, uv.s),
    uv.t
  );
}

vec2 resample(vec2 val, vec2 steps) {
  return floor(val * steps) / steps;
}

vec2 repeat(vec2 uv) {
  return fract(uv);
}

vec2 mirrored_repeat(vec2 uv) {
  return 1.0 - abs(abs(mod(uv, 2.0)) - 1.0);
}


void pick_colors(inout vec3 c[4], inout vec2 uv) {
  #define W 4
  // 4 5 6 7
  // 0 1 2 3
  float s = uv.s * float(W-1);
  for (int i=0; i<W-1; i++) {
    if ( s >= float(i) && s <= float(i+1) ) {
      c[0] = colors[i];
      c[1] = colors[i+1];
      c[2] = colors[i+W];
      c[3] = colors[i+W+1];
      uv.s = fract(s);
      break;
    }
  }
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
  vec2 transformed_uv = ( uvTransform * vec3(v_uv, 1.0) ).st;
  transformed_uv = mirrored_repeat(transformed_uv);
  
  // vec3 col = bilerp(colors, transformed_uv);
  vec3 c[4];
  pick_colors(c, transformed_uv);
  vec3 col = bilerp( c, transformed_uv );
  
  /* Emissive Light */
  vec3 emissive = col * emissiveIntesity;
  
  /* Diffuse Reflection (Lambertian) */
  vec3 toCamera = vec3(0.0, 0.0, 1.0); // ... direction to camera (pos. z-axis)
  // float dotNL = clamp( dot( normal, toCamera ), 0.0, 1.0 );
  
  float dotNL = dot( normal, toCamera );
  float dotHL = dotNL * 0.5 + 0.5; // https://developer.valvesoftware.com/wiki/Half_Lambert
  // dotNL = mix(dotHL, pow(dotNL, 4.0), lambertMix);
  
  float cut = lambertHarshness;
  float dotCut = dotHL * (cut+1.0) - cut;
  dotNL = mix(dotHL, pow(dotCut, 4.0), lambertStrength);
  

  
  vec3 diffuse = col * dotNL * diffuseIntesity;
  
  /* Total outgoing light */
  vec3 outgoingLight =  emissive + diffuse;
  gl_FragColor = vec4(outgoingLight, 1.0);
  
}
