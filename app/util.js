

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
