var root3 = Math.sqrt(3);
var hex_size = 10;
var paper;
$(function(){
  var socket = io.connect('http://localhost');

  paper =  Raphael("board", 500, 500);
  paper.rect(0,0,500,500).attr({stroke: '#000', 'stroke-width':5});
  for(var i = 0; i < 25; i++){
    hexagon(250,250);
    hex_size += 10;
  }
});

function hexagon(centerx, centery){
  //Move to top left coordinate
  var hex_string = 'M'+(centerx-hex_size/4)+','+(centery-hex_size*root3/4);
  //Line to top right
  hex_string += 'L'+(centerx+hex_size/4)+','+(centery-hex_size*root3/4);
  //Line to right edge
  hex_string += 'L'+(centerx+hex_size/2)+','+centery;
  //Line to bottom right
  hex_string += 'L'+(centerx+hex_size/4)+','+(centery+hex_size*root3/4);
  //Line to bottom left
  hex_string += 'L'+(centerx-hex_size/4+',')+(centery+hex_size*root3/4);
  //Line to right edge
  hex_string += 'L'+(centerx-hex_size/2+',')+centery;
  //Line to top left
  hex_string += 'L'+(centerx-hex_size/4+',')+(centery-hex_size*root3/4);
  return paper.path(hex_string);
}
