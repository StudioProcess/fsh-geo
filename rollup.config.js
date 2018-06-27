import multiEntry from 'rollup-plugin-multi-entry';

export default {
  input: [
    'node_modules/three/build/three.js',
    'node_modules/three/examples/js/controls/OrbitControls.js',
    'node_modules/three/examples/js/exporters/OBJExporter.js',
    'node_modules/dat.gui/build/dat.gui.js',
    'app/main.js'
  ],
  context: 'window', // Replace global `this` with `window` instead of `undefined`
  output: {
    file: 'app/main.bundle.js',
    format: 'iife',
    name: 'app'
  },
  plugins: [ multiEntry() ],
};
