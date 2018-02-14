import noise from './noise.js';

console.log(noise);

const W = 1280;
const H = 720;
const seed_geo = 0;
const seed_perf = 1;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let geo;


// Aircraft principal axes:
// yaw/heading (y-axis, normal), pitch (z-axis, transversal), roll (x-axis, longitudinal)
let banner_options = {
  length: 200, // along longitudinal axis
  width: 2.5, // along transversal axis
  length_segments: 2000,
  width_segments: 25,
  noise_heading: {
    seed: 111,
    freq: 0.2,
    amp: 1
  },
  noise_pitch: {
    seed: 222,
    freq: 0.2,
    amp: 1
  },
  noise_roll: {
    seed: 333,
    freq: 0.2,
    amp: 1
  },
};


main();


function main() {
  setup(); // set up scene
  loop(); // start game loop
}

function loop(time) { // eslint-disable-line no-unused-vars
  requestAnimationFrame( loop );
  renderer.render( scene, camera );
}

function setup() {
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
  camera.position.z = 25;
  
  // scene.add( createDistortedCylinderObj() );
  scene.add( createAxesObj(10) );
  
  // printIndexedVertices(geo);
  let banner = createBanner(banner_options);
  
  let plane_mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  let mesh = new THREE.Mesh(banner.plane, plane_mat);
  
  let line_mat = new THREE.LineBasicMaterial({ color: 0xffffff });
  let line = new THREE.Line(banner.path, line_mat);
  
  scene.add(mesh);
  scene.add(line);
}

function createDistortedCylinderObj() {
  let geo = new THREE.CylinderBufferGeometry( 100, 100, 100, 200, 100, true );
  console.log(geo);
  displaceGeo(geo);
  perforateGeo(geo);
  let mat = new THREE.MeshBasicMaterial({ color: 0x1e90ff, wireframe: true });
  let mesh = new THREE.Mesh( geo, mat );
  return mesh;
}


function displaceGeo(geo, iscale = 0.5, oscale = 0.2, ) {
  let pos = geo.attributes.position.array;
  let nrm = geo.attributes.normal.array;
  noise.seed(seed_geo);
  for (let i = 0; i<pos.length/3; i++) {
    let p = new THREE.Vector3(pos[i*3+0], pos[i*3+1], pos[i*3+2]); // vertex position
    let n = new THREE.Vector3(nrm[i*3+0], nrm[i*3+1], nrm[i*3+2]); // vertex normal
    let d = noise.simplex3(p.x*iscale, p.y*iscale, p.z*iscale); // displacement value (from 3d simplex noise)
    p.add(n.normalize().multiplyScalar(d*oscale));
    pos[i*3+0] = p.x;
    pos[i*3+1] = p.y;
    pos[i*3+2] = p.z;
  }
}


function perforateGeo(geo, thresh = 0.33, iscale = 0.08) {
  let pos = geo.attributes.position.array;
  let idx = geo.index.array.slice(0);
  let idx2 = [];
  noise.seed(seed_perf);
  for (let i = 0; i<pos.length/3; i++) {
    let p = new THREE.Vector3(pos[i*3+0], pos[i*3+1], pos[i*3+2]); // vertex position
    let n = noise.simplex3(p.x*iscale, p.y*iscale, p.z*iscale);
    n = (n+1) / 2;
    if (n > 1) n=1; else if (n < 0) n=0;
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
  geo = new THREE.Geometry();
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


// Aircraft principal axes:
// yaw/heading (y-axis, normal), pitch (z-axis, transversal), roll (x-axis, longitudinal)
function createBanner(options) {
  let plane = new THREE.PlaneBufferGeometry(options.length, options.width, options.length_segments, options.width_segments);
  // printIndexedVertices(plane);
  console.log(plane);
  
  let path = new THREE.Geometry();
  let aircraft = new THREE.Object3D();
  let speed = options.length / options.length_segments;
  
  // simulate path along longitudinal axis (x)
  for (let x=0; x<=options.length_segments; x++) {
    path.vertices.push( aircraft.position.clone() );
    // set respective column of plane (along z axis)
    let seg = options.width / options.width_segments; // size of one segment
    let v = new THREE.Vector3(0,0,1).applyEuler(aircraft.rotation); // z-axis unit vector
    let pos = aircraft.position.clone().sub( v.clone().multiplyScalar(options.width/2) );
    let inc = v.multiplyScalar(seg);
    for (let y=0; y<=options.width_segments; y++) {
      let idx = (y * (options.length_segments+1) + x) * 3;
      plane.attributes.position.array[idx+0] = pos.x;
      plane.attributes.position.array[idx+1] = pos.y;
      plane.attributes.position.array[idx+2] = pos.z;
      pos.add(inc);
    }
    pos = aircraft.position;
    let roll = getnoise(options.noise_roll, pos.x, pos.y, pos.z) * Math.PI * 2;
    let heading = getnoise(options.noise_heading, pos.x, pos.y, pos.z) * Math.PI * 2;
    let pitch = getnoise(options.noise_pitch, pos.x, pos.y, pos.z) * Math.PI * 2;
    aircraft.rotation.set( roll, heading, pitch );
    aircraft.translateX(speed);
  }
  return { path, plane };
}

function getnoise(options, x=0, y=0, z=0) {
  noise.seed(options.seed);
  let n = noise.simplex3(x*options.freq, y*options.freq, z*options.freq);
  n = (n + 1) / 2;
  if (n > 1) { n = 1; } else if (n < 0) { n = 0; }
  return n * options.amp;
}

document.addEventListener("keydown", e => {
  // console.log(e.key, e.keyCode, e);
  
  if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }
  
});
