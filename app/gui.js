/* globals dat */
import { params, mat_gradient } from './main.js';

export function create() {
  let gui = new dat.GUI();
  console.log(mat_gradient);
  
  gui.add(params.shading, 'emissiveIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.emissiveIntesity.value = a;
  });
  gui.add(params.shading, 'diffuseIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.diffuseIntesity.value = a;
  });
  gui.add(params.shading, 'flatShading').onChange(a => {
    console.log(mat_gradient);
    mat_gradient.uniforms.flatShading.value = a;
  });
  
}
