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



export function getCameraSettings() {
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


export function setCameraSettings(state) {
  let cam = main.camera;
  let view = state;
  cam.position.set(view.position.x, view.position.y, view.position.z);
  cam.rotation.set(view.rotation._x, view.rotation._y, view.rotation._z, view.rotation._order);
  main.controls.target.set(view.position.x, view.position.y, 0);
  cam.fov = state.fov;
  cam.zoom = state.zoom;
  cam.near = state.near;
  cam.far = state.far;
}

export function timestamp() {
  return new Date().toISOString();
}

export function saveSettings(_timestamp) {
  if (!_timestamp) { _timestamp = timestamp(); }
  let filename = _timestamp + '.json';
  let state = {
    version: 3,
    timestamp: _timestamp,
    camera: getCameraSettings(),
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

export function loadSettings(state) {
  if (!state) return;
  if (state.config) { Object.assign(main.config, state.config); }
  if (state.params) { Object.assign(main.params, state.params); }
}

export function loadCameraSettings(state) {
  if (!state || !state.camera) return;
  setCameraSettings(state.camera);
}
