/* globals dat */
import { params, mat_gradient, mat_wireframe, mesh_gradient, mesh_wireframe, obj_normals, obj_path, obj_axes, updateUVMatrix, setBackgroundColor, getColorsUniform } from './main.js';

export function create() {
  let gui = new dat.GUI();
  
  gui.addColor(params, 'bgColor').onChange(a => {
    setBackgroundColor(a);
  });
  gui.addColor(params, 'wireframeColor').onChange(a => {
    mat_wireframe.color = new THREE.Color(a);
  });
  gui.add(params, 'show_plane').onChange(a => {
    mesh_gradient.visible = a;
  });
  gui.add(params, 'show_wireframe').onChange(a => {
    mesh_wireframe.visible = a;
  });
  gui.add(params, 'show_normals').onChange(a => {
    obj_normals.visible = a;
  });
  gui.add(params, 'show_path').onChange(a => {
    obj_path.visible = a;
  });
  gui.add(params, 'show_axes').onChange(a => {
    obj_axes.visible = a;
  });
  
  
  let shading = gui.addFolder('Shading');
  shading.addColor(params.shading.colors, 0).name('color_0').onChange(setColors);
  shading.addColor(params.shading.colors, 1).name('color_1').onChange(setColors);
  shading.addColor(params.shading.colors, 2).name('color_2').onChange(setColors);
  shading.addColor(params.shading.colors, 3).name('color_3').onChange(setColors);
  
  shading.add(params.shading, 'emissiveIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.emissiveIntesity.value = a;
  });
  shading.add(params.shading, 'diffuseIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.diffuseIntesity.value = a;
  });
  shading.add(params.shading, 'lambertStrength', 0, 1, .01).onChange(a => {
    mat_gradient.uniforms.lambertStrength.value = a;
  });
  shading.add(params.shading, 'lambertHarshness', 0, 10, .01).onChange(a => {
    mat_gradient.uniforms.lambertHarshness.value = a;
  });
  shading.add(params.shading, 'flatShading').onChange(a => {
    mat_gradient.uniforms.flatShading.value = a;
  });
  shading.add(params.shading, 'scaleX', 0.01, 1, .01).onChange(() => updateUVMatrix());
  shading.add(params.shading, 'scaleY', 0.01, 1, .01).onChange(() => updateUVMatrix());
  shading.add(params.shading, 'rotate', 0, 180, 1).onChange(() => updateUVMatrix());
  shading.add(params.shading, 'translateX', 0, 2, .01).onChange(() => updateUVMatrix());
  shading.add(params.shading, 'translateY', 0, 2, .01).onChange(() => updateUVMatrix());
  
  
  let size = gui.addFolder('Size');
  size.add(params.banner_options, 'length', 1, 100, .1).onFinishChange(autoGenerate);
  size.add(params.banner_options, 'height', 1, 25, .1).onFinishChange(autoGenerate);
  size.add(params.banner_options, 'segment_detail', 1, 20, .1).onFinishChange(autoGenerate);
  size.add(params.banner_options, 'segment_proportion', 0.2, 5, .01).onFinishChange(autoGenerate);
  
  addNoiseFolder(gui, params.banner_options, 'noise_heading', 'Heading');
  addNoiseFolder(gui, params.banner_options, 'noise_pitch', 'Pitch');
  addNoiseFolder(gui, params.banner_options, 'noise_roll', 'Roll');
  addNoiseFolder(gui, params.banner_options, 'noise_displacement', 'Displacement', 4, 4);
  
  gui.add(params, 'autoGenerate');
  gui.add(params, 'generate');
}

function autoGenerate() {
  if (params.autoGenerate) params.generate();
}

function addNoiseFolder(guiOrFolder, obj, noiseObjName, folderName = noiseObjName, maxAmp = 2, maxFreq = 0.2) {
  let folder = guiOrFolder.addFolder(folderName);
  let noiseObj = obj[noiseObjName];
  folder.add(noiseObj, 'seed', 0, 99, 1).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'freq', 0.01, maxFreq, 0.01).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'amp', 0.01, maxAmp, 0.01).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'octaves', 1, 4, 1).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'persistence', 0, 1, 0.01).onFinishChange(autoGenerate);
}

function setColors() {
  mat_gradient.uniforms.colors.value = getColorsUniform(params.shading.colors);
}
