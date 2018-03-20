/* globals dat */
import { params, mat_gradient, mat_anim, mesh_gradient, mesh_wireframe, mesh_anim, obj_normals, obj_path, obj_axes, obj_marker, updateUVMatrix, setBackgroundColor, getColorsUniform } from './main.js';

export function create() {
  let gui = new dat.GUI();
  
  gui.addColor(params, 'bgColor').onChange(a => {
    setBackgroundColor(a);
  });
  
  let el = gui.addFolder('Elements');
  el.add(params, 'show_plane').onChange(a => {
    mesh_gradient.visible = a;
  });
  el.add(params, 'show_wireframe').onChange(a => {
    mesh_wireframe.visible = a;
  });
  el.add(params, 'show_normals').onChange(a => {
    obj_normals.visible = a;
  });
  el.add(params, 'show_path').onChange(a => {
    obj_path.visible = a;
  });
  el.add(params, 'show_anim').onChange(a => {
    mesh_anim.visible = a;
  });
  // gui.add(params, 'show_anim_wireframe').onChange(a => {
  //   mesh_anim_wireframe.visible = a;
  // });
  el.add(params, 'show_axes').onChange(a => {
    obj_axes.visible = a;
    obj_marker.visible = a;
  });
  
  let anim = gui.addFolder('Animation');
  anim.open();
  anim.add(params.animation, 'fraction', 0, 0.5, 0.001).onChange(a => { mat_anim.uniforms.fraction.value = a; });
  anim.add(params.animation, 'center', 0, 1, 0.01).onChange(a => { mat_anim.uniforms.center.value = a; });
  anim.add(params.animation, 'speed', 0, 2).onChange(a => { mat_anim.uniforms.speed.value = a; });
  anim.add(params.animation, 'pathAnimSpeed', 0, 0.05).onChange(a => { mat_anim.uniforms.pathAnimSpeed.value = a; });
  anim.add(params.animation, 'pathDispSpeed', 0, 0.5).onChange(a => { mat_anim.uniforms.pathDispSpeed.value = a; });
  anim.add(params.animation, 'pathDispFreq', 0, 0.3).onChange(a => { mat_anim.uniforms.pathDispFreq.value = a; });
  anim.add(params.animation, 'pathDispAmp', 0, 2, 0.001).onChange(a => { mat_anim.uniforms.pathDispAmp.value = a; });
  anim.add(params.animation, 'camPos', 0, 1, 0.001);
  anim.add(params.animation, 'camLock');
  anim.add(params.animation, 'distLock');
  anim.add(params.animation, 'camDist', 0, 10, 0.001);
  
  let shading = gui.addFolder('Shading');
  shading.addColor(params.shading.colors, 0).name('color_0').onChange(setColors);
  shading.addColor(params.shading.colors, 1).name('color_1').onChange(setColors);
  shading.addColor(params.shading.colors, 2).name('color_2').onChange(setColors);
  shading.addColor(params.shading.colors, 3).name('color_3').onChange(setColors);
  
  shading.add(params.shading, 'emissiveIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.emissiveIntesity.value = a;
    mat_anim.uniforms.emissiveIntesity.value = a;
  });
  shading.add(params.shading, 'diffuseIntesity', 0, 2, .01).onChange(a => {
    mat_gradient.uniforms.diffuseIntesity.value = a;
    mat_anim.uniforms.diffuseIntesity.value = a;
  });
  shading.add(params.shading, 'lambertStrength', 0, 1, .01).onChange(a => {
    mat_gradient.uniforms.lambertStrength.value = a;
    mat_anim.uniforms.lambertStrength.value = a;
  });
  shading.add(params.shading, 'lambertHarshness', 0, 10, .01).onChange(a => {
    mat_gradient.uniforms.lambertHarshness.value = a;
    mat_anim.uniforms.lambertHarshness.value = a;
  });
  shading.add(params.shading, 'flatShading').onChange(a => {
    mat_gradient.uniforms.flatShading.value = a;
    mat_anim.uniforms.flatShading.value = a;
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
  let disp = addNoiseFolder(gui, params.banner_options, 'noise_displacement', 'Displacement');
  disp.open();
  getController(disp, 'freq').max(1.0);
  getController(disp, 'freq').onChange(a => { mat_anim.uniforms.dispFreq.value = a; });
  getController(disp, 'amp').onChange(a => { mat_anim.uniforms.dispAmp.value = a; });
  getController(disp, 'octaves').onChange(a => { mat_anim.uniforms.dispOctaves.value = a; });
  getController(disp, 'persistence').onChange(a => { mat_anim.uniforms.dispPersistence.value = a; });
  
  gui.add(params, 'autoGenerate');
  gui.add(params, 'generate');
}

function autoGenerate() {
  if (params.autoGenerate) params.generate();
}

function addNoiseFolder(guiOrFolder, obj, noiseObjName, folderName = noiseObjName) {
  let folder = guiOrFolder.addFolder(folderName);
  let noiseObj = obj[noiseObjName];
  folder.add(noiseObj, 'seed', 0, 99, 1).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'freq', 0.01, 2, 0.01).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'amp', 0, 2, 0.01).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'octaves', 1, 4, 1).onFinishChange(autoGenerate);
  folder.add(noiseObj, 'persistence', 0, 1, 0.01).onFinishChange(autoGenerate);
  return folder;
}

function setColors() {
  mat_gradient.uniforms.colors.value = getColorsUniform(params.shading.colors);
  mat_anim.uniforms.colors.value = getColorsUniform(params.shading.colors);
}

function getController(gui, name) {
  return gui.__controllers.filter(c => c.property === name)[0];
}
