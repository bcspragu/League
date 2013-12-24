var root3 = Math.sqrt(3);
var hex_width = 25; //Width of the base
var hex_height = hex_width*root3;
var paper;
var x,y;
var hexagons = {};

for(var x = -5; x <= 5; x++){
  hexagons[x] = {};
  for(var y = -5; y <= 5; y++){
    hexagons[x][y] = 0;
  }
}

x = 5;
y = -6;

$(function(){
  var socket = io.connect('http://localhost');

  paper =  Raphael("board", 500, 500);
  paper.rect(0,0,500,500).attr({stroke: '#000', 'stroke-width':5});
  for(var i = 1; i < 12; i++){
    x = i > 6 ? (11-i) : 5;
    y++;
    var osc_i = (i > 5) ? (12 - i) : i;
    column_of_hexagons(25+i*hex_width*1.5,(175-hex_height/4)-hex_height*osc_i+osc_i*hex_height/2,osc_i+5);
  }
});

function column_of_hexagons(firstx, firsty, number){
  for(var i = 0; i < number; i++){
    hexagon(firstx,firsty+i*hex_height);
    x--;
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
  var hexagon = paper.path(hex_string).attr({'stroke-width':2});
  hexagons[x][y] = hexagon;
  hexagon.data('x',x);
  hexagon.data('y',y);
  hexagon.mouseover(function(){
    var x = this.data('x');
    var y = this.data('y');
    for(var i = -5; i <= 5; i++){
      if(hexagons[x][i] !== 0){
        hexagons[x][i].attr({'fill':'#f00'});
      }
    }
    for(var i = -5; i <= 5; i++){
      if(hexagons[i][y] !== 0){
        hexagons[i][y].attr({'fill':'#f00'});
      }
    }
  }).mouseout(function(){
    var x = this.data('x');
    var y = this.data('y');
    for(var i = -5; i <= 5; i++){
      if(hexagons[x][i] !== 0){
        hexagons[x][i].attr({'fill':'#fff'});
      }
    }
    for(var i = -5; i <= 5; i++){
      if(hexagons[i][y] !== 0){
        hexagons[i][y].attr({'fill':'#fff'});
      }
    }
  });
  return hexagon;
}
