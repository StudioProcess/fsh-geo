// test.frag
precision highp float;
precision highp int;

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

vec3 bilin2(vec2 uv) {
  vec2 ca = vec2(c1.s, 1.0-c1.t);
  vec2 cd = vec2(1.0-c2.s, c2.t);
  vec2 uvx = vec2( (uv.s-ca.s)/(cd.s-ca.s), (uv.t-cd.t)/(ca.t-cd.t) );
  return mix(
    mix(c, d, uvx.s),
    mix(a, b, uvx.s),
    uvx.t
  );
}

vec2 resample(vec2 val, vec2 steps) {
  return floor(val * steps) / steps;
}

void main() {
  // gl_FragColor = vec4(v_color, 1.0);
  
  vec2 uv = resample( v_uv, steps );
  
  // vec4 col = vec4( bilin(uv), 1.0 );
  
  vec4 col = vec4( bilin2(uv), 1.0 );
  gl_FragColor = col;
}
