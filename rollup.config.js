import multiEntry from 'rollup-plugin-multi-entry';
import buble from 'rollup-plugin-buble';
import { terser } from "rollup-plugin-terser";

const bubleConfig = {
  transforms: { forOf: false } // See: https://buble.surge.sh/guide/#unsupported-features
};

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
  plugins: [ multiEntry(), buble(bubleConfig), terser() ]
};
