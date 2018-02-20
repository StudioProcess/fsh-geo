import noise from './noise.js';
import * as tilesaver from './tilesaver.js';

console.log(noise);

const W = 1280;
const H = 720;
const seed_geo = 0;
const seed_perf = 1;

let renderer, scene, camera;
let shaders;
let controls; // eslint-disable-line no-unused-vars
let mesh_wireframe, mesh_gradient;


let config = {
  EXPORT_TILES: 2,
};

// Aircraft principal axes:
// yaw/heading (y-axis, normal), pitch (z-axis, transversal), roll (x-axis, longitudinal)
let banner_options = {
  length: 25, // along longitudinal axis
  width: 5, // along transversal axis
  length_segments: 500,
  width_segments: 100,
  noise_heading: {
    seed: 111,
    freq: 0.1,
    amp: 0.1
  },
  noise_pitch: {
    seed: 222,
    freq: 0.2,
    amp: 0.1
  },
  noise_roll: {
    seed: 333,
    freq: 0.2,
    amp: 0.1
  },
};


(async function main() {
  await setup(); // set up scene
  loop(); // start game loop
})();

function loop(time) { // eslint-disable-line no-unused-vars
  requestAnimationFrame( loop );
  renderer.render( scene, camera );
}

 
async function setup() {
  shaders = await loadShaders('app/shaders/', 'test.vert', 'test.frag', 'main.vert', 'main.frag');
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  renderer.setSize( W, H );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild( renderer.domElement );
  
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera( 75, W / H, 0.01, 1000 );
  controls = new THREE.OrbitControls( camera, renderer.domElement );
  camera.position.z = 16;
  tilesaver.init(renderer, scene, camera, config.EXPORT_TILES);
  
  // scene.add( createDistortedCylinderObj() );
  scene.add( createAxesObj(10) );
  
  let gradient_mat = new THREE.RawShaderMaterial({
    uniforms: {
      // a: { value: new THREE.Color(0xff0000) },
      // b: { value: new THREE.Color(0x00ff00) },
      // c: { value: new THREE.Color(0x0000ff) },
      // d: { value: new THREE.Color(0xffff00) },
      a: { value: new THREE.Color(0xed1c24) },
      b: { value: new THREE.Color(0xc83e81) },
      c: { value: new THREE.Color(0x701655) },
      d: { value: new THREE.Color(0x8781bd) },
      // steps: { value: new THREE.Vector2(100, 100) },
      emissiveIntesity: { value: 1.0 },
      diffuseIntesity: { value: 0.5 },
      flatShading: { value: true },
    },
    vertexShader: shaders['main.vert'],
    fragmentShader: shaders['main.frag'],
    side: THREE.DoubleSide,
  });
  

  let banner = createBannerGeo(banner_options);
  // displaceGeo(banner.plane);
  // perforateGeo(banner.plane);
  let plane_mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  mesh_wireframe = new THREE.Mesh(banner.plane, plane_mat);
  mesh_gradient = new THREE.Mesh(banner.plane, gradient_mat);
  let line_mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  let line = new THREE.Line(banner.path, line_mat);
  
  // scene.add(mesh_wireframe);
  scene.add(mesh_gradient);
  scene.add(line);
  
  // scene.add(createNormalsObj(banner.plane)); 
  // scene.add( createFractalNoiseObj({seed: 1, freq: 0.1, amp: 5, octaves: 5, persistence: 0.5}, 20, 400) );
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

function displaceGeo( geo, noiseOptions = {freq:0.66, amp:0.5, octaves:2 } ) {
  let pos = geo.attributes.position.array;
  let nrm = geo.attributes.normal.array;
  noise.seed(seed_geo);
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


function perforateGeo(geo, thresh = 0.3, noiseOptions = {freq:0.25}) {
  let pos = geo.attributes.position.array;
  let idx = geo.index.array.slice(0);
  let idx2 = [];
  noise.seed(seed_perf);
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
  let plane = new THREE.PlaneBufferGeometry(options.length, options.width, options.length_segments, options.width_segments);
  let plane_pos = plane.attributes.position.array;
  let plane_norm = plane.attributes.normal.array;
  // printIndexedVertices(plane);
  console.log(plane);
  
  let path = new THREE.Geometry();
  let aircraft = new THREE.Object3D();
  let speed = options.length / options.length_segments;
  
  // simulate path along longitudinal axis (x)
  for (let x=0; x<=options.length_segments; x++) {
    let apos = aircraft.position;
    let roll = getfractalnoise(options.noise_roll, apos.x, apos.y, apos.z) * Math.PI * 2;
    let heading = getfractalnoise(options.noise_heading, apos.x, apos.y, apos.z) * Math.PI * 2;
    let pitch = getfractalnoise(options.noise_pitch, apos.x, apos.y, apos.z) * Math.PI * 2;
    aircraft.rotation.set( roll, heading, pitch );
    
    path.vertices.push( aircraft.position.clone() );
    // set respective column of plane (along z axis)
    let seg = options.width / options.width_segments; // size of one segment
    let v = new THREE.Vector3(0,0,1).applyEuler(aircraft.rotation); // z-axis unit vector
    let pos = aircraft.position.clone().sub( v.clone().multiplyScalar(options.width/2) );
    let inc = v.multiplyScalar(seg);
    let norm = new THREE.Vector3(0,1,0).applyEuler(aircraft.rotation); // normal vector
    
    for (let y=0; y<=options.width_segments; y++) {
      let idx = (y * (options.length_segments+1) + x) * 3;
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
  return { path, plane };
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
function createFractalNoiseObj(options, width=1, segments=10) {
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
    tilesaver.save().then(f => console.log(`Saved to: ${f}`));
  }
});


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

function timestamp() {
  return new Date().toISOString();
}

function exportOBJ(mesh) {
  console.log('exporting');
  
  let exporter = new THREE.OBJExporter();
  let txt = exporter.parse(mesh);
  console.log(typeof txt);
  
  saveText( txt, `obj_${timestamp()}.obj` );
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
