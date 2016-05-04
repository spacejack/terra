"use strict"

// Builds an index.html file from dev.html that uses minified js files.

const fs = require('fs')
let str = fs.readFileSync('dev.html', {encoding:'utf8'})
str = str.replace('/three.js', '/three.min.js')
str = str.replace('/almond.js', '/almond.min.js')
str = str.replace('/terrain.js', '/terrain.min.js')
fs.writeFileSync('index.html', str)
