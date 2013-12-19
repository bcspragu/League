var root3 = Math.sqrt(3);
var hex_width = 25; //Width of the base
var hex_height = hex_width*root3;
var paper;
$(function(){
  var socket = io.connect('http://localhost');

  paper =  Raphael("board", 500, 500);
  paper.rect(0,0,500,500).attr({stroke: '#000', 'stroke-width':5});
  for(var i = 1; i < 12; i++){
    var osc_i = (i > 5) ? (12 - i) : i;
    line_of_hexagons(25+i*hex_width*1.5,(175-hex_height/4)-hex_height*osc_i+osc_i*hex_height/2,osc_i+5);
      //hexagon(j*hex_height+(i%2)*hex_height/2,i*hex_width*1.5);
  }
});

function line_of_hexagons(firstx, firsty, number){
  for(var i = 0; i < number; i++){
    hexagon(firstx,firsty+i*hex_height);
  }
}

function hexagon(centerx, centery){
  //Move to top left coordinate
  var hex_string = 'M'+(centerx-hex_width/2)+','+(centery-hex_height/2);
  //Line to top right
  hex_string += 'L'+(centerx+hex_width/2)+','+(centery-hex_height/2);
  //Line to right edge
  hex_string += 'L'+(centerx+hex_width)+','+centery;
  //Line to bottom right
  hex_string += 'L'+(centerx+hex_width/2)+','+(centery+hex_height/2);
  //Line to bottom left
  hex_string += 'L'+(centerx-hex_width/2+',')+(centery+hex_height/2);
  //Line to left edge
  hex_string += 'L'+(centerx-hex_width+',')+centery;
  //Line to top left
  hex_string += 'L'+(centerx-hex_width/2+',')+(centery-hex_height/2);
  return paper.path(hex_string).attr({'stroke-width':2});
}
