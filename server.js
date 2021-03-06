// server.js
// where your node app starts

// init project
var express = require('express'),
    app = express();
// for the file stuff
var fs = require('fs'),
    readable = require('stream').Readable,
    random = require('random-js'),
    patterns = require('svg-patterns'),
    stringify = require('virtual-dom-stringify'),
    scale = require('d3-scale'),
    hexcolor = require('random-hex-color');


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
  var file = random.pick(engine, files);
  return fs.readFileSync(file, "utf8");
}

function _to_svg(txt) {
  // replace newlines,
  // viewbox calc (might not be necessary since the input's scaled)
  // template  
  
  // this is also ridiculous given a polygon can just be, you know, styled
  // i don't care i live for the absurd.
  var fxns = [_to_polygon, _to_polyline];
  
  var distribution = random.real(5,28);
  var size = distribution(engine);
  
  var fxn = random.pick(engine, fxns);
  var p = _def(fxn.name);
  var geom = fxn(txt, p.id);
  
  if (p.pattern === undefined) {
      return `<svg width="${size}em" height="${size}em" viewBox="-2 -2 4 4"
    xmlns="http://www.w3.org/2000/svg">${geom}</svg>`;
  } else {
    // it's a pattern (this is not great)
    return `<svg width="${size}em" height="${size}em" viewBox="-10 -8 20 20"
    xmlns="http://www.w3.org/2000/svg"><defs>${p.pattern}</defs>${geom}</svg>`;
  }
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
  
  //stroke="orange" stroke-width="0.05px"
  return def_id != undefined ? `<polyline transform="rotate(${deg})" style="fill: ${def_id}" points="${newtxt}"/>` : `<polyline transform="rotate(${deg})" points="${newtxt}"/>`; 
}

function _clean(txt) {
  return txt.replace(/\n/g, " ");
}

function _normalize(txt) {
  // resize from -2 to 2 to something larger for better fills
  // start from the raw, \n delims
  var txt_pairs = txt.split(/\n/g);
  var pairs = txt_pairs.map((a) => a.split(',').map(Number));
    
  var rng = scale.scaleLinear().domain([-2, 2]).range([-10, 10]);
  
  // rescale the arrays & rebuild the string
  return pairs.map(subarr => subarr.map(a => rng(a).toPrecision(5)).join(',')).join(' '); 
}

function _def(fxn_name=undefined) {
  // return a random pattern
  
  var svgPatterns = [patterns.lines, patterns.caps, patterns.circles, patterns.crosses, patterns.hexagons, patterns.rhombic, patterns.nylon, patterns.rhombic3d, patterns.squares, patterns.waves, patterns.woven, undefined];
  
  var pattern = random.pick(engine, svgPatterns);
  
  // <defs>
  //   <style type="text/css">
  //   rect    { fill: #95a8b1; stroke: #333; stroke-width: 6px; }
  // </style>
  // </defs>
  if (pattern === undefined) {
    if (fxn_name === undefined) {
      return {pattern: undefined, id: undefined};
    }
    
    var stylename = fxn_name.replace('_to_', '');
    var stroke = hexcolor();
    var fill = hexcolor();
    var strokewidth = 0.2;
    
    var style = `<style type="text/css">${stylename} {fill: ${fill}; stroke: ${stroke}; stroke-width: ${strokewidth}px;}</style>`;
    // console.log('STYLE', style);
    return {pattern: style, id: undefined};
  }
  
  const defaults = {
    size: 0.5,
    stroke: hexcolor(),
    strokeWidth: 0.1,
    background: hexcolor(),
    fill: hexcolor()
  }
  
  if (random.bool()(engine)) {
    // let's make it more macpainty.
    // macpaintery.
    // desaturated.
    defaults.background = undefined,
    defaults.fill = undefined
  }
  
  // can add fill, orientation, circle bits
  if (pattern.name == 'circles') {
    defaults.radius = random.integer(1,15)(engine);
    defaults.complement = true;
  } else if (pattern.name == 'lines') {
    defaults.orientations = [random.pick(engine, [0, 45, -45, 90])]; 
  }
  
  // so the leaves are very smol and the scaling does not 
  // handle the fill pattern in a great way.
  const generated = pattern(defaults);
  
  // this virtual dom lib is deprecated but the suggested replacement does not
  // handle the path of the pattern (at all, empty elem)
  return {pattern: stringify(generated), id: generated.url()};
}

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
