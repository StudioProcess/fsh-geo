import noise from './noise.js';

console.log(noise);

const W = 1280;
const H = 720;
const seed_geo = 0;
const seed_perf = 1;

let renderer, scene, camera;
let controls; // eslint-disable-line no-unused-vars
let geo;

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
  
  scene.add( createDistortedCylinderObj() );
  scene.add( createAxesObj(10) );

  // printIndexedVertices(geo);
  
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





document.addEventListener("keydown", e => {
  // console.log(e.key, e.keyCode, e);
  
  if (e.key == 'f') { // f .. fullscreen
    if (!document.webkitFullscreenElement) {
      document.querySelector('body').webkitRequestFullscreen();
    } else { document.webkitExitFullscreen(); }
  }
  
});
