import noise from './noise.js';
import * as tilesaver from './tilesaver.js';
import * as gui from './gui.js';
import * as rec from './recorder.js';
import * as util from './util.js';
import { settings } from './settings.js';

export let renderer, scene, camera;
let shaders;
export let controls; // eslint-disable-line no-unused-vars
export let mesh_gradient, mesh_wireframe, mesh_anim;
export let mat_gradient, mat_wireframe, mat_anim;
export let obj_normals, obj_path;
export let obj_axes, obj_marker, obj_camtarget;
export let banner;

export let config = {
  W: 1280,
  H: 800,
  EXPORT_TILES: 4,
};

// Aircraft principal axes:
// yaw/heading (y-axis, normal), pitch (z-axis, transversal), roll (x-axis, longitudinal)
let banner_options = {
  length: 25, // along longitudinal axis
  height: 5, // along transversal axis
  segment_detail: 10,
  segment_proportion: 2,
  noise_heading: { seed: 111, freq: 0.1, amp: 0.1, octaves: 1, persistence: 0.5 },
  noise_pitch: { seed: 222, freq: 0.2, amp: 0.1, octaves: 1, persistence: 0.5 },
  noise_roll: { seed: 333, freq: 0.2, amp: 0.1, octaves: 1, persistence: 0.5 },
  noise_displacement: { seed: 0, freq: 0.37, amp: 0.5, octaves: 4, persistence: 0.3 },
};

export let params = {
  bgColor: '#606060',
  banner_options,
  shading: {
    colors: ['#ed1c24', '#c83e81', '#701655', '#8781bd'],
    emissiveIntesity: 0.0,
    diffuseIntesity: 1.0,
    lambertStrength: 0.0,
    lambertHarshness: 0.0,
    flatShading: true,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    translateX: 0,
    translateY: 0,
  },
  show_plane: false,
  show_wireframe: false,
  show_anim: true,
  show_normals: false,
  show_path: true,
  show_axes: true,
  generate: generateBanner,
  autoGenerate: false,
  animation: {
    time: 0,
    fraction: 1,
    center: 0,
    speed: 1.0,
    pathAnimSpeed: 0,
    pathDispSpeed: 0.1,
    pathDispAmp: 0.1,
    pathDispFreq: 0.1,
    camPos: 0.5,
    camLock: false,
    camDist: 2,
    distLock: false,
  }
};


(async function main() {
  await setup(); // set up scene
  loop(); // start game loop
})();

// Keeping track of time when playing/pausing
let animating = false, lastTime = 0, timeOffset = 0;
function processTime(time = 0) { // the first undefined screws up timeOffset so make it valid
  if (!animating) {
    timeOffset += time-lastTime;
  }
  lastTime = time;
  return (time - timeOffset) / 1000;
}

function loop(time) { // eslint-disable-line no-unused-vars
  time = processTime(time);
  params.animation.time = time;
  mat_anim.uniforms.time.value = time;
  
  updateCamLock();
  
  requestAnimationFrame( loop );
  renderer.render( scene, camera );
  rec.update( renderer );
  
  updateAxesVisibility();
}


async function setup() {
  Object.assign(config, settings.config);
  Object.assign(params, settings.params);
  banner_options = params.banner_options; // also set this object as well, since it is accessed directly

  shaders = await loadShaders('app/shaders/', 'test.vert', 'test.frag', 'main.vert', 'main.frag', 'anim.vert');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize( config.W, config.H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );
  setBackgroundColor(params.bgColor);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, config.W / config.H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 16;
  controls.screenSpacePanning = true;
  // controls.zoomSpeed = 2.0;
  util.setCameraState(settings.camera);
  tilesaver.init(renderer, scene, camera, config.EXPORT_TILES);

  // scene.add( createDistortedCylinderObj() );
  obj_axes = createAxesObj(10);
  obj_axes.visible = params.show_axes;
  scene.add( obj_axes );
  
  obj_camtarget = createCrossObj(5);
  obj_camtarget.visible = params.show_axes;
  scene.add(obj_camtarget);
  const setCamtargetObj = () => { obj_camtarget.position.set(controls.target.x, controls.target.y, controls.target.z); };
  controls.addEventListener('change', setCamtargetObj);
  setCamtargetObj();

  mat_gradient = new THREE.RawShaderMaterial({
    uniforms: {
      colors: { value: getColorsUniform(params.shading.colors) },
      emissiveIntesity: { value: params.shading.emissiveIntesity },
      diffuseIntesity: { value: params.shading.diffuseIntesity },
      lambertStrength: { value: params.shading.lambertStrength },
      lambertHarshness: { value: params.shading.lambertHarshness },
      flatShading: { value: params.shading.flatShading },
      uvTransform: { value: getUVMatrix() }
    },
    vertexShader: shaders['main.vert'],
    fragmentShader: shaders['main.frag'],
    side: THREE.DoubleSide,
  });


  banner = createBannerGeo(banner_options);
  displaceGeo(banner.plane, banner_options.noise_displacement);
  // perforateGeo(banner.plane);
  banner.plane.computeVertexNormals();

  mat_wireframe = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  mesh_wireframe = new THREE.Mesh(banner.plane, mat_wireframe);
  mesh_wireframe.visible = params.show_wireframe;
  scene.add(mesh_wireframe);

  mesh_gradient = new THREE.Mesh(banner.plane, mat_gradient);
  mesh_gradient.visible = params.show_plane;
  scene.add(mesh_gradient);

  let mat_path = new THREE.LineBasicMaterial({ color: 0xffffff });
  obj_path = new THREE.Line(banner.path, mat_path);
  obj_path.visible = params.show_path;
  scene.add(obj_path);

  obj_normals = createNormalsObj(banner.plane, 0.33);
  obj_normals.visible = params.show_normals;
  scene.add(obj_normals);

  // scene.add( createFractalNoiseObj({seed: 1, freq: 0.1, amp: 5, octaves: 5, persistence: 0.5}, 20, 400) );

  // add cylinder for testing normals
  // let cylinder = new THREE.CylinderBufferGeometry( 1, 1, 1, 20, 20 );
  // let mesh_cylinder = new THREE.Mesh(cylinder, wireframe_mat);
  // scene.add( mesh_cylinder );
  // scene.add( createNormalsObj(cylinder) );

  // add sphere for testing shading
  // let sphere = new THREE.SphereBufferGeometry( 2 );
  // let mesh_sphere = new THREE.Mesh(sphere, mat_gradient);
  // scene.add( mesh_sphere );
  // scene.add( createNormalsObj(sphere, 0.5) );

  gui.create();

  let pathDataTex = pathDataTexture(banner);
  console.log(banner);
  console.log(pathDataTex);

  mat_anim = new THREE.RawShaderMaterial({
    uniforms: {
      colors: { value: getColorsUniform(params.shading.colors) },
      emissiveIntesity: { value: params.shading.emissiveIntesity },
      diffuseIntesity: { value: params.shading.diffuseIntesity },
      lambertStrength: { value: params.shading.lambertStrength },
      lambertHarshness: { value: params.shading.lambertHarshness },
      flatShading: { value: params.shading.flatShading },
      uvTransform: { value: getUVMatrix() },
      pathData: { value: pathDataTex },
      bannerHeight: {value: params.banner_options.height },
      time: { value: 0 },
      fraction: { value: params.animation.fraction },
      center: { value: params.animation.center },
      speed: { value: params.animation.speed },
      pathAnimSpeed: { value: params.animation.pathAnimSpeed },
      dispFreq: { value: banner_options.noise_displacement.freq },
      dispAmp: { value: banner_options.noise_displacement.amp },
      dispOctaves: { value: banner_options.noise_displacement.octaves },
      dispPersistence: { value: banner_options.noise_displacement.persistence },
      pathDispFreq: { value: params.animation.pathDispFreq },
      pathDispAmp: { value: params.animation.pathDispAmp },
      pathDispSpeed: { value: params.animation.pathDispSpeed },
    },
    vertexShader: shaders['anim.vert'],
    fragmentShader: shaders['main.frag'],
    side: THREE.DoubleSide,
  });
  mesh_anim = new THREE.Mesh(banner.flat_plane, mat_anim);
  mesh_anim.visible = params.show_anim;
  scene.add(mesh_anim);
  
  obj_marker = createAxesObj(2);
  obj_marker.visible = params.show_axes;
  scene.add(obj_marker);
}


export function getColorsUniform(inputColors) {
  let seq = [0, 1, 2, 3, 2, 3, 0, 1];
  return seq.map( idx => new THREE.Color(inputColors[idx]) );
}

function generateBanner() {
  banner = createBannerGeo(banner_options);
  displaceGeo(banner.plane, banner_options.noise_displacement);
  // perforateGeo(banner.plane);
  banner.plane.computeVertexNormals();
  if (mesh_gradient) mesh_gradient.geometry = banner.plane;
  if (mesh_wireframe) mesh_wireframe.geometry = banner.plane;
  if (obj_path) obj_path.geometry = banner.path;
}

function createDistortedCylinderObj() { // eslint-disable-line
  let geo = new THREE.CylinderBufferGeometry( 100, 100, 100, 200, 100, true );
  console.log(geo);
  displaceGeo(geo);
  perforateGeo(geo);
  let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  let mesh = new THREE.Mesh( geo, mat );
  return mesh;
}

function displaceGeo( geo, noiseOptions = { seed:0, freq:0.66, amp:0.5, octaves:2 } ) {
  let pos = geo.attributes.position.array;
  let nrm = geo.attributes.normal.array;
  for (let i = 0; i<pos.length/3; i++) {
    let p = new THREE.Vector3(pos[i*3+0], pos[i*3+1], pos[i*3+2]); // vertex position
    let n = new THREE.Vector3(nrm[i*3+0], nrm[i*3+1], nrm[i*3+2]); // vertex normal
    let d = getfractalnoise(noiseOptions, p.x, p.y, p.z); // displacement value (from 3d simplex noise)
    p.add(n.normalize().multiplyScalar(d));
    pos[i*3+0] = p.x;
    pos[i*3+1] = p.y;
    pos[i*3+2] = p.z;
  }
  return geo;
}


function perforateGeo(geo, thresh = 0.3, noiseOptions = {seed:1, freq:0.25}) {
  let pos = geo.attributes.position.array;
  let idx = geo.index.array.slice(0);
  let idx2 = [];
  for (let i = 0; i<pos.length/3; i++) {
    let p = new THREE.Vector3(pos[i*3+0], pos[i*3+1], pos[i*3+2]); // vertex position
    let n = getfractalnoise(noiseOptions, p.x, p.y, p.z);
    if (n < thresh) {
      // delete all faces including index = i
      for (let j=0; j<idx.length; j+=3) {
        if (idx[j]!=i && idx[j+1]!=i && idx[j+2]!=i) {
          idx2.push(idx[j], idx[j+1], idx[j+2]);
        }
      }
      idx = idx2; idx2 = [];
    }
  }
  geo.index.array = idx;
}


function printIndexedVertices(geo) { // eslint-disable-line no-unused-vars
  let pos = geo.attributes.position.array;
  let idx = geo.index.array;
  for (let i of idx) {
    console.log({ [i]: [ pos[i*3+0], pos[i*3+1], pos[i*3+2] ] });
  }
}


function createAxesObj(scale = 1) {
  let geo = new THREE.Geometry();
  geo.vertices.push(
    new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 1, 0, 0 ), // x-axis (red)
    new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 1, 0 ), // y-axis (green)
    new THREE.Vector3( 0, 0, 0 ), new THREE.Vector3( 0, 0, 1 ), // z-axis (blue)
  );

  let r = new THREE.Color(0xff0000), g = new THREE.Color(0x00ff00), b = new THREE.Color(0x0000ff);
  geo.colors.push(r, r, g, g, b, b);

  let mat = new THREE.LineBasicMaterial({vertexColors:THREE.VertexColors});
  let obj = new THREE.LineSegments(geo, mat);
  obj.scale.set(scale, scale, scale);
  return obj;
}

function createCrossObj(scale = 1) {
  let geo = new THREE.Geometry();
  geo.vertices.push(
    new THREE.Vector3( -.5, 0, 0 ), new THREE.Vector3( .5, 0, 0 ), // x-axis (red)
    new THREE.Vector3( 0, -.5, 0 ), new THREE.Vector3( 0, .5, 0 ), // y-axis (green)
    new THREE.Vector3( 0, 0, -.5 ), new THREE.Vector3( 0, 0, .5 ), // z-axis (blue)
  );
  let color = new THREE.Color('#646464');
  let mat = new THREE.LineBasicMaterial({color});
  let obj = new THREE.LineSegments(geo, mat);
  obj.scale.set(scale, scale, scale);
  return obj;
}

// For testing normals of a BufferGeometry
function createNormalsObj(inputGeo, length = 0.1) { // eslint-disable-line no-unused-vars
  // console.log(inputGeo);
  let p = inputGeo.attributes.position.array;
  let n = inputGeo.attributes.normal.array;
  let geo = new THREE.Geometry();
  for (let i=0; i<n.length; i+=3) {
    let pos = new THREE.Vector3(p[i+0], p[i+1], p[i+2]);
    geo.vertices.push(pos,
      new THREE.Vector3(n[i+0], n[i+1], n[i+2]).setLength(length).add(pos),
    );
  }
  let mat = new THREE.LineBasicMaterial({color:0xffffff});
  return new THREE.LineSegments(geo, mat);
}


// Aircraft principal axes:
// yaw/heading (y-axis, normal), pitch (z-axis, transversal), roll (x-axis, longitudinal)
function createBannerGeo(options) {
  let length_segments = Math.floor(options.length * options.segment_detail);
  let height_segments = Math.floor(options.height * options.segment_detail * options.segment_proportion);
  console.log('banner segments: ' + length_segments + 'x' + height_segments);
  let plane = new THREE.PlaneBufferGeometry(options.length, options.height, length_segments, height_segments);
  let flat_plane = plane.clone();
  let plane_pos = plane.attributes.position.array;
  let plane_norm = plane.attributes.normal.array;
  // printIndexedVertices(plane);
  // console.log(plane);

  let path = new THREE.Geometry();
  let wing = new THREE.Geometry(); // wing direction vector
  let aircraft = new THREE.Object3D();
  let speed = options.length / length_segments;

  // simulate path along longitudinal axis (x)
  for (let x=0; x<=length_segments; x++) {
    let apos = aircraft.position;
    let roll = getfractalnoise(options.noise_roll, apos.x, apos.y, apos.z) * Math.PI * 2;
    let heading = getfractalnoise(options.noise_heading, apos.x, apos.y, apos.z) * Math.PI * 2;
    let pitch = getfractalnoise(options.noise_pitch, apos.x, apos.y, apos.z) * Math.PI * 2;
    aircraft.rotation.set( roll, heading, pitch );

    path.vertices.push( aircraft.position.clone() );
    // set respective column of plane (along z axis)
    let seg = options.height / height_segments; // size of one segment
    let v = new THREE.Vector3(0,0,1).applyEuler(aircraft.rotation); // z-axis unit vector
    wing.vertices.push( v.clone() );
    let pos = aircraft.position.clone().sub( v.clone().multiplyScalar(options.height/2) );
    let inc = v.multiplyScalar(seg);
    let norm = new THREE.Vector3(0,1,0).applyEuler(aircraft.rotation); // normal vector

    for (let y=0; y<=height_segments; y++) {
      let idx = (y * (length_segments+1) + x) * 3;
      plane_pos[idx+0] = pos.x;
      plane_pos[idx+1] = pos.y;
      plane_pos[idx+2] = pos.z;
      pos.add(inc);
      // set normals
      plane_norm[idx+0] = norm.x;
      plane_norm[idx+1] = norm.y;
      plane_norm[idx+2] = norm.z;
    }
    pos = aircraft.position; // reset position
    aircraft.translateX(speed);
  }
  return { plane, flat_plane, path, wing };
}


// Pack path and wing vectors into a two line data texture
function pathDataTexture({ path, wing }) {
  let width = path.vertices.length;
  let height = 2;
  let data = new Float32Array( width * height * 3 );
  for (let i=0; i<width; i++) {
    data[ i * 3 + 0 ] = path.vertices[i].x;
    data[ i * 3 + 1 ] = path.vertices[i].y;
    data[ i * 3 + 2 ] = path.vertices[i].z;
    data[ (i + width) * 3 + 0 ] = wing.vertices[i].x;
    data[ (i + width) * 3 + 1 ] = wing.vertices[i].y;
    data[ (i + width) * 3 + 2 ] = wing.vertices[i].z;
  }
  let tex = new THREE.DataTexture( data, width, height, THREE.RGBFormat, THREE.FloatType );
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true; // NOTE: Don't forget this, or data won't be uploaded to GPU
  return tex;
}


// Returns simplex noise of range [0, 1] * amp
// Options: seed, freq, amp
function getnoise(options, x=0, y=0, z=0) {
  let defaults = { seed: 0, freq: 1, amp: 1 };
  options = Object.assign(defaults, options);
  // console.log(options);
  noise.seed(options.seed);
  let n = noise.simplex3(x*options.freq, y*options.freq, z*options.freq);
  n = (n + 1) / 2;
  if (n > 1) { n = 1; } else if (n < 0) { n = 0; }
  return n * options.amp;
}

// Options: seed, freq, amp, octaves, persistence
function getfractalnoise(options, x=0, y=0, z=0) {
  if (options.amp === 0) return 0;
  let defaults = { seed: 0, freq: 1, amp: 1, octaves: 1, persistence: 0.5 };
  options = Object.assign(defaults, options);
  let freq = options.freq;
  let amp = options.amp;
  let total = 0;
  let max_amp = 0; // Track max amplitude; used for normalizing the result
  for (let i=0; i<options.octaves; i++) {
    total += getnoise({seed:options.seed, freq, amp}, x, y, z);
    max_amp += amp;
    freq *= 2;
    amp *= options.persistence;
  }
  return total / max_amp * options.amp;
}

function array(length = 0) {
  let a = [];
  for (let i=0; i<length; i++) {
    a.push(i);
  }
  return a;
}


// For testing getfractalnoise()
function createFractalNoiseObj(options, width=1, segments=10) { // eslint-disable-line no-unused-vars
  let x = array(segments+1).map(i => width/segments * i);
  let y = x.map(x => getfractalnoise(options, x));

  let geo = new THREE.Geometry();
  for (let i=0; i<x.length; i++) {
    geo.vertices.push(new THREE.Vector3(x[i], y[i], 0));
  }
  let mat = new THREE.LineBasicMaterial({color:0xffffff});
  return new THREE.Line(geo, mat);
}


document.addEventListener("keydown", e => {
  // console.log(e.key, e.keyCode, e);

  if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }

  else if (e.key == 'o') {
    exportOBJ(mesh_wireframe);
  }
  else if (e.key == 'e') {
    exportHires();
  }
  else if (e.key == 'c') {
    rec.startstop(); // start/stop recording
  }
  else if (e.key == 'v') {
    rec.startstop( { start:0 } ); // record from sec 0
  }
  else if (e.key == 'b') {
    rec.startstop( { start:0, duration:15 } ); // record 15 secs
  }
  else if (e.keyCode == 8) { resetView(); } // BACKSPACE
  else if (e.keyCode == 32) { animating = !animating; } // SPACE
});


function exportHires() {
  if (params.show_axes) { obj_axes.visible = false; obj_marker.visible = false; obj_camtarget.visible = false; }
  let saved = util.saveSettings();
  console.log(saved);
  tilesaver.save( {timestamp:saved.timestamp} ).then(f => {
    if (params.show_axes) { obj_axes.visible = true; obj_marker.visible = true; obj_camtarget.visible = false; }
    console.log(`Saved to: ${f}`);
  });
}

function saveURL(url, filename) {
  let link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
}

function saveBlob(blob, filename) {
  let url = URL.createObjectURL(blob);
  saveURL(url, filename);
  URL.revokeObjectURL(url);
}

function saveText(string, filename) {
  let blob = new Blob( [string], {type: 'text/plain'} );
  saveBlob(blob, filename);
}


function exportOBJ(mesh) {
  console.log('exporting');

  let exporter = new THREE.OBJExporter();
  let txt = exporter.parse(mesh);
  console.log(typeof txt);

  saveText( txt, `obj_${util.timestamp()}.obj` );
}


async function loadShaders(folder, ...urls) {
  let promises = urls.map( url => fetch(folder + '/' + url) );
  return Promise.all(promises).then(responses => {
    return Promise.all(responses.map(res => {
      let name = res.url.slice( res.url.lastIndexOf('/') + 1 );
      return res.text().then(text => { return {name, text}; });
    }));
  }).then(shaders => {
    return shaders.reduce((acc, shader) => {
      acc[shader.name] = shader.text;
      return acc;
    }, {});
  });
}


function getUVMatrix() {
  return util.makeSRTMatrix3(
    1/params.shading.scaleX, 1/params.shading.scaleY,
    params.shading.rotate/360*Math.PI*2,
    -params.shading.translateX, -params.shading.translateY
  );
}

export function updateUVMatrix() {
  mat_gradient.uniforms.uvTransform.value = getUVMatrix();
  mat_anim.uniforms.uvTransform.value = getUVMatrix();
}


export function setBackgroundColor(col) {
  document.querySelector('canvas').style.backgroundColor = col;
}


function resetView() {
  let z = 25;
  camera.position.set(0, 0, z);
  camera.rotation.set(0, 0, 0);
  controls.target.set(0, 0, 0);
}


// linear filtered path sample
function samplePath(s) {
  s = ( s + Math.abs(Math.trunc(s)) ) % 1;
  let idx = (banner.path.vertices.length-1) * s;
  let idx0 = Math.floor(idx);
  let idx1 = Math.ceil(idx);
  if (s == 1) { idx0 = idx1 = banner.path.vertices.length-1; }
  let a = idx - idx0;
  let p0 = banner.path.vertices[idx0].clone();
  let p1 = banner.path.vertices[idx1].clone();
  return p0.multiplyScalar(1-a).addScaledVector(p1, a);
}

function getCurrentPathPos(s = 0) {
  let speed = params.animation.pathAnimSpeed * params.animation.speed;
  let time_mod = (speed * params.animation.time) % (1 - params.animation.fraction);
  if (Number.isNaN(time_mod)) time_mod = 0; // happens when param.animation.fraction becomes 1
  s = s * params.animation.fraction + time_mod;
  let center_s = params.animation.center * params.animation.fraction + time_mod;
  let path_pos = samplePath(s);
  let center_pos = samplePath(center_s);
  return path_pos.sub(center_pos);
}

function updateCamLock() {
  let t = getCurrentPathPos(params.animation.camPos); // target position
  obj_marker.position.set(t.x, t.y, t.z);
  if (params.animation.camLock) {
    if (params.animation.distLock) {
      let p = camera.position;// camera position
      p.sub(t).setLength(params.animation.camDist).add(t);
    }
    controls.target = t;
    controls.update();
  }
}

function updateAxesVisibility() {
  if (rec.recording()) {
    obj_axes.visible = false;
    obj_marker.visible = false;
    obj_camtarget.visible = false;
  } else {
    obj_axes.visible = params.show_axes;
    obj_marker.visible = params.show_axes;
    obj_camtarget.visible = params.show_axes;
  }
}
