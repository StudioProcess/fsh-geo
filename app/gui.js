/* globals dat */
import { params, mat_gradient, mesh_wireframe, obj_normals, obj_path, updateUVMatrix} from './main.js';

export function create() {
  let gui = new dat.GUI();
  
  gui.add(params.shading, 'emissiveIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.emissiveIntesity.value = a;
  });
  gui.add(params.shading, 'diffuseIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.diffuseIntesity.value = a;
  });
  gui.add(params.shading, 'lambertStrength', 0, 1, .01).onChange(a => {
    mat_gradient.uniforms.lambertStrength.value = a;
  });
  gui.add(params.shading, 'lambertHarshness', 0, 10, .01).onChange(a => {
    mat_gradient.uniforms.lambertHarshness.value = a;
  });
  gui.add(params.shading, 'flatShading').onChange(a => {
    mat_gradient.uniforms.flatShading.value = a;
  });
  gui.add(params.shading, 'scaleX', 0.01, 1, .01).onChange(() => updateUVMatrix());
  gui.add(params.shading, 'scaleY', 0.01, 1, .01).onChange(() => updateUVMatrix());
  gui.add(params.shading, 'rotate', 0, 180, 1).onChange(() => updateUVMatrix());
  gui.add(params.shading, 'translateX', 0, 2, .01).onChange(() => updateUVMatrix());
  gui.add(params.shading, 'translateY', 0, 2, .01).onChange(() => updateUVMatrix());
  
  gui.add(params, 'show_wireframe').onChange(a => {
    mesh_wireframe.visible = a;
  });
  gui.add(params, 'show_normals').onChange(a => {
    obj_normals.visible = a;
  });
  gui.add(params, 'show_path').onChange(a => {
    obj_path.visible = a;
  });
}
