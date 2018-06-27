const SOURCE = 'app/main.bundle.js';
const TARGET = 'index.html';

const fs = require('fs');
const crypto = require('crypto');

let input = fs.readFileSync(SOURCE, 'utf8');
let hash = crypto.createHash('sha256').update(input).digest('hex').substr(0, 7);
// console.log(hash);

let file = fs.readFileSync('index.html', 'utf8');
let res = file.replace(/(?<=BUNDLE_VERSION)[^']+'([^']*')/, " = '" + hash + "'");
fs.writeFileSync(TARGET, res);

console.log('Updated BUNDLE_VERSION: ' + hash);
