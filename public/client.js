// client-side js
// run by the browser each time your view template is loaded

// by default, you've got jQuery,
// add other scripts at the bottom of index.html

// import { interpolate } from "flubber";
// var flubber = require("flubber");

$(function() {
  console.log('hello world :o');
  
  // get two svg responses
  // load into flim and flam
  // try a transition with flubber
  _replace_svg('flim');
  _replace_svg('flam');
  $('#blender svg path').attr('d', '');
  
  $('#reload').on('click', function(e) {
    // if you don't like the leaves
    _replace_svg('flim');
    _replace_svg('flam');
    $('#blender svg path').attr('d', '');
  });
  
  $('#transmogrify').on('click', function(e) {
    e.preventDefault();
    
    // do the thing if we can do the thing.
    // and make it more complicated because
    // of the polygon/polyline thing
    // hooray me
    var flim = $('#flim svg polygon, #flim svg polyline')[0].points;
    var flam = $('#flam svg polygon, #flam svg polyline')[0].points;
    
    // convert to [[point], [point]]
    var flims = Array.from({length: flim.length}, (v,i) => [flim[i].x, flim[i].y]);
    var flams = Array.from({length: flam.length}, (v,i) => [flam[i].x, flam[i].y]);
    
    var interpolator = flubber.interpolate(flims, flams);
    
    // this is the most ridiculous thing
    d3.select("#blender svg path")
      .transition()
      .delay(600)
      .duration(2000)
      .attrTween("d", function(){ return interpolator; });
  });
  
});

function _replace_svg(id) {
  $.get('/leaf', function(data) {
    var svg = $(data).find('svg');
    $('#'+id+' svg').replaceWith(svg);
  });
}
