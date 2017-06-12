// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
// for the file stuff
var fs = require('fs');
var readable = require('stream').Readable;
var random = require('random-js');
var patterns = require('svg-patterns');
const stringify = require('virtual-dom-stringify');
const scale = require('d3-scale');


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/leaf", function (request, response) {
  // grab a leaf from a random file and convert it to svg
  
  var txt = _get_file();
  var svg = _to_svg(txt);
  
  var rable = new readable();
  rable.push(svg);
  rable.push(null);
  
  response.set('Content-type', "image/svg+xml");
  rable.pipe(response);
});

// putting it here for now to avoid the cache wonk
var engine = random.engines.mt19937().autoSeed();

function _get_file() {
  var files = [];
  fs.readdirSync(__dirname+'/public/leaves/').forEach(function(f) {
    files.push(__dirname+'/public/leaves/' + f);
  });
  var file = files[Math.floor(Math.random() * files.length)];
  return fs.readFileSync(file, "utf8");
}

function _to_svg(txt) {
  // replace newlines,
  // viewbox calc (might not be necessary since the input's scaled)
  // template  
  
  // this is also ridiculous given a polygon can just be, you know, styled
  // i don't care i live for the absurd.
  var fxns = [_to_polygon, _to_polyline];
  
  var geom = fxns[Math.floor(Math.random() * fxns.length)](txt);
  
  var distribution = random.real(1,18);
  var size = distribution(engine);
  
  var p = _def();
  var geom = fxns[Math.floor(Math.random() * fxns.length)](txt, p != undefined ? p.id : undefined);
  
  console.log(p);
  
  // var svg = p != undefined ? `<svg width="${size}em" height="${size}em" viewBox="-2 -2 4 4"
  //   xmlns="http://www.w3.org/2000/svg"><defs>${p.pattern}</defs>${geom}</svg>` : `<svg width="${size}em" height="${size}em" viewBox="-2 -2 4 4"
  //   xmlns="http://www.w3.org/2000/svg">${geom}</svg>`;
  
  var svg = p != undefined ? `<svg width="${size}em" height="${size}em" viewBox="-10 -8 20 20"
    xmlns="http://www.w3.org/2000/svg"><defs>${p.pattern}</defs>${geom}</svg>` : `<svg width="${size}em" height="${size}em" viewBox="-2 -2 4 4"
    xmlns="http://www.w3.org/2000/svg">${geom}</svg>`;
  
  return svg;
}

function _to_polygon(txt, def_id=undefined) {
  var newtxt = _normalize(txt);
  // random rotation degree, now with more overkill 🎉
  var distribution = random.integer(-180, 180);
  var deg = distribution(engine);
  return def_id != undefined ? `<polygon style="fill: ${def_id}" transform="rotate(${deg})" points="${newtxt}"/>` : `<polygon transform="rotate(${deg})" points="${newtxt}"/>`; 
}

function _to_polyline(txt, def_id=undefined) {
  var newtxt = _normalize(txt);
  var distribution = random.integer(-180, 180);
  var deg = distribution(engine);
  return def_id != undefined ? `<polyline transform="rotate(${deg})" style="fill: ${def_id}" points="${newtxt}" stroke="orange" stroke-width="0.05px"/>` : `<polyline transform="rotate(${deg})" points="${newtxt}" fill="none" stroke="black" stroke-width="0.05px"/>`; 
}

function _clean(txt) {
  return txt.replace(/\n/g, " ");
}

function _normalize(txt) {
  // resize from -2 to 2 to something larger for better fills
  // start from the raw, \n delims
  var txt_pairs = txt.split(/\n/g);
  var pairs = txt_pairs.map((a) => a.split(',').map(Number));
  
  //max, mins
  var mn = -2;
  var mx = 2;
  
  var rng = scale.scaleLinear().domain([mn, mx]).range([-10, 10]);
  
  // rescale the arrays & rebuild the string
  return pairs.map(subarr => subarr.map(a => rng(a)).join(',')).join(' '); 
}

function _def() {
  // return a random pattern
  
  var svgPatterns = [patterns.lines, patterns.caps, patterns.circles, patterns.crosses, patterns.hexagons, patterns.rhombic, patterns.nylon, patterns.rhombic3d, patterns.squares, patterns.waves, patterns.woven, undefined];
  
  var pattern = random.pick(engine, svgPatterns);
  
  if (pattern === undefined) {
    return undefined;
  }
  
  const defaults = {
    size: 2,
    stroke: '#3F7FBF',
    strokeWidth: 1,
    background: null // || ''
  }
  
  // can add fill, orientation, circle bits

  
  // so the leaves are very smol and the scaling does not 
  // handle the fill pattern in a great way.
  const generated = patterns.lines({
    size: 0.5,
    stroke: 'orange',
    strokeWidth: 0.1,
    // background: '#C14242',
    background: '#fff',
    orientations: [45]
});
  
  // this virtual dom lib is deprecated but the suggested replacement does not
  // handle the path of the pattern (at all, empty elem)
  return {pattern: stringify(generated), id: generated.url()};
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
