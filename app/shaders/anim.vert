// https://github.com/ashima/webgl-noise/blob/master/src/noise3D.glsl
// Exposes: float snoise(vec3)
vec3 mod289(vec3 x){return x-floor(x*.00346)*289.;}vec4 mod289(vec4 x){return x-floor(x*.00346)*289.;}vec4 permute(vec4 x){return mod289((x*34.+1.)*x);}vec4 taylorInvSqrt(vec4 r){return 1.792843-.853735*r;}float snoise(vec3 v){const vec2 C=vec2(.166667,.333333);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy)),x0=v-i+dot(i,C.xxx),g=step(x0.yzx,x0.xyz),l=1.-g,i1=min(g.xyz,l.zxy),i2=max(g.xyz,l.zxy),x1=x0-i1+C.xxx,x2=x0-i2+C.yyy,x3=x0-D.yyy;i=mod289(i);vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z),x_=floor(j*ns.z),y_=floor(j-7.*x_),x=x_*ns.x+ns.yyyy,y=y_*ns.x+ns.yyyy,h=1.-abs(x)-abs(y),b0=vec4(x.xy,y.xy),b1=vec4(x.zw,y.zw),s0=floor(b0)*2.+1.,s1=floor(b1)*2.+1.,sh=-step(h,vec4(0.)),a0=b0.xzyw+s0.xzyw*sh.xxyy,a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x),p1=vec3(a0.zw,h.y),p2=vec3(a1.xy,h.z),p3=vec3(a1.zw,h.w);vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x,p1*=norm.y,p2*=norm.z,p3*=norm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}

#define SEED 1.0

// Unsigned noise [0..1]
float noise(vec3 p) {
  return snoise(p) / 2.0 + 0.5; 
}
float noise(vec3 p, float freq, float amp) {
  vec3 seed = vec3(1013.0 * SEED); // offset noise, since there are creases/glitches at vec3(0.0)
  return noise( (p+seed) * freq ) * amp;
}

// Fractal noise (up to 4 octaves)
float fractalnoise(vec3 p, float freq, float amp, int octaves, float persistence) {
  float total = 0.0, max_amp = 0.0, current_amp = amp, current_freq = freq;
  if (octaves >= 1) { total += noise(p, current_freq, current_amp); max_amp += current_amp; current_freq *= 2.0; current_amp *= persistence; }
  if (octaves >= 2) { total += noise(p, current_freq, current_amp); max_amp += current_amp; current_freq *= 2.0; current_amp *= persistence; }
  if (octaves >= 3) { total += noise(p, current_freq, current_amp); max_amp += current_amp; current_freq *= 2.0; current_amp *= persistence; }
  if (octaves >= 4) { total += noise(p, current_freq, current_amp); max_amp += current_amp; current_freq *= 2.0; current_amp *= persistence; }
  return total / max_amp * amp;
}


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

uniform sampler2D pathData;
uniform float bannerHeight;
uniform float time;
uniform float center;

// Surface displacement
uniform float dispFreq;
uniform float dispAmp;
uniform int   dispOctaves;
uniform float dispPersistence;

// varying vec3 v_color;
varying vec2 v_uv;
varying vec3 v_normal;
varying vec3 v_position;


vec3 calcPosition(vec2 uv) {
  vec3 path_pos = texture2D( pathData, vec2(uv.s, 0.0) ).xyz;
  vec3 wing_dir = texture2D( pathData, vec2(uv.s, 1.0) ).xyz;
  return path_pos + wing_dir * (uv.t-0.5) * bannerHeight;
}

#define DELTA 0.001
vec3 calcNormal(vec2 uv) {
  vec3 p = calcPosition( uv );
  vec3 px = calcPosition( vec2(uv.s - DELTA, uv.t) );
  vec3 py = calcPosition( vec2(uv.s, uv.t - DELTA) );
  return normalize( cross(px - p, py - p) );
}

void main() {
  // Process position
  float speed = 0.05; // delta-s per second
  float s = uv.s * 0.5 + mod(speed*time, 0.5);
  float center_s = center * 0.5 + mod(speed*time, 0.5);
  
  vec3 center_pos = texture2D( pathData, vec2(center_s, 0.0) ).xyz;
  vec3 path_pos = texture2D( pathData, vec2(s, 0.0) ).xyz;
  vec3 wing_dir = texture2D( pathData, vec2(s, 1.0) ).xyz;
  
  vec3 pos = path_pos - center_pos + (wing_dir * (uv.t-0.5) * bannerHeight);
  
  // vec3 disp = calcNormal(vec2(s, uv.t)) * noise(vec3(uv * 10.0, 0.0), dispFreq, dispAmp); // displace according to surface location
  // vec3 disp = calcNormal(vec2(s, uv.t)) * noise(pos, dispFreq, dispAmp); // displace according to space position
  vec3 disp = calcNormal(vec2(s, uv.t)) * fractalnoise(pos, dispFreq, dispAmp, dispOctaves, dispPersistence); // displace according to space position

  pos += disp; // Add displacement

  
  /* uv pass-thru */
  v_uv = uv;
  // v_uv = vec2(s, uv.t); // This uses actual UVs, so colors move with the part of the geometry that's shown
  
  /* normal in eye space */
  v_normal = normalize(normalMatrix * normal);
  
  /* position in eye space */
  vec4 mv_position = modelViewMatrix * vec4(pos, 1.0);
  v_position = -mv_position.xyz;
  
  /* position in clip space */
  gl_Position = projectionMatrix * mv_position;
}
