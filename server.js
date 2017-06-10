// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
// for the file stuff
var fs = require('fs');
var readable = require('stream').Readable;
var random = require('random-js');


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
  var newtxt = txt.replace(/\n/g, " ");
  
  // random rotation degree, now with more overkill 🎉
  var engine = random.engines.mt19937().autoSeed();
  var distribution = random.integer(-180, 180);
  var deg = distribution(engine);
  
  var size_distro = random.real(1,18);
  var size = size_distro(engine);
  
  var svg = `<svg width="${size}em" height="${size}em" viewBox="-2 -2 4 4"
    xmlns="http://www.w3.org/2000/svg">
  <polygon transform="rotate(${deg})" points="${newtxt}"/>
</svg>`;
  
  return svg;
}


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
