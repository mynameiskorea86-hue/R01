const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(html, /<link rel="stylesheet" href="styles\.css\?v=/, 'styles.css should use a versioned asset URL');
assert.match(html, /<script src="script\.js\?v=/, 'script.js should use a versioned asset URL');

console.log('cache busting test passed');
