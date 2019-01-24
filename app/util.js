import * as main from './main.js';
// import { config, params } from './main.js';


export function makeTranslationMatrix3(x, y) {
  return new THREE.Matrix3().set(
    1, 0, x,
    0, 1, y,
    0, 0, 1
  );
}

export function makeRotationMatrix3(t) {
  return new THREE.Matrix3().set(
    Math.cos(t), -Math.sin(t), 0,
    Math.sin(t),  Math.cos(t), 0,
    0,            0,           1
  );
}

export function makeScalingMatrix3(x, y) {
  return new THREE.Matrix3().set(
    x, 0, 0,
    0, y, 0,
    0, 0, 1
  );
}

// Transformation order: Translate to origin, Scale, Rotate, Back and Translate
export function makeSRTMatrix3(sx, sy, r, tx, ty) {
  let Tcenter = makeTranslationMatrix3( -0.5, -0.5 );
  let Tback = makeTranslationMatrix3( 0.5 + tx, 0.5 + ty);
  // let T = makeTranslationMatrix3(tx, ty);
  let R = makeRotationMatrix3(r);
  let S = makeScalingMatrix3(sx, sy);
  
  // In matrix notation:  Tback * R * S * Tcenter
  // return Tcenter.premultiply(R).premultiply(S).premultiply(T).premultiply(TandBack);
  // return T.premultiply(Tcenter).premultiply(S).premultiply(R).premultiply(Tback);
  // return T.premultiply(Tcenter).premultiply(S).premultiply(R).premultiply(Tback);
  return Tcenter.premultiply(S).premultiply(R).premultiply(Tback);
}



export function getCameraState() {
  let camera = main.camera;
  return {
    position: camera.position,
    rotation: camera.rotation,
    fov: camera.fov,
    zoom: camera.zoom,
    near: camera.near,
    far: camera.far
  };
}


export function setCameraState(state) {
  if (!state) return;
  let cam = main.camera;
  let view = state.camera ? state.camera : state; // settings object or camera settings object
  cam.position.set(view.position.x, view.position.y, view.position.z);
  cam.rotation.set(view.rotation._x, view.rotation._y, view.rotation._z, view.rotation._order);
  
  // Set orbit target
  let dist = 5; // Assume a default distance from camera to orbit target
  let dir = new THREE.Vector3(0, 0, -dist).applyEuler(cam.rotation); // view direction
  main.controls.target = cam.position.clone().add(dir);
  
  cam.fov = view.fov;
  cam.zoom = view.zoom;
  cam.near = view.near;
  cam.far = view.far;
}

export function timestamp() {
  return new Date().toISOString();
}

export function saveSettings(_timestamp) {
  if (!_timestamp) { _timestamp = timestamp(); }
  let filename = _timestamp + '.json';
  let state = {
    version: 5,
    timestamp: _timestamp,
    camera: getCameraState(),
    config: main.config,
    params: main.params,
  };
  let link = document.createElement('a');
  link.download = filename;
  let data = JSON.stringify(state, null, 2);
  let file = new File([data], {type:"text/plain"});
  link.href = URL.createObjectURL(file);
  link.click();
  return { filename, timestamp:_timestamp, data };
}
