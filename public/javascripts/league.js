var root3 = Math.sqrt(3);
var hex_width = 25; //Width of the base
var hex_height = hex_width*root3;
var paper;
var x,y;
var hexagons = {};
var board_size = 500;
var directions = [
  {x: 0, y: 1},
  {x: 1, y: 0},
  {x: 1, y: -1},
  {x: 0, y: -1},
  {x: -1, y: 0},
  {x: -1, y: 1}
];

var direction_index = 3;
var player, pointer;
var cur_loc;

for(var x = -5; x <= 5; x++){
  hexagons[x] = {};
  for(var y = -5; y <= 5; y++){
    hexagons[x][y] = 0;
  }
}

x = -6;
y = 5;

$(function(){
  var socket = io.connect('http://localhost');

  $('#submit').click(function(e){
    e.preventDefault();
    var password = $('#login').val();
    $.post('/login',{password: password},function(data){
      if(data.message){
        $('.message').attr('id','alert').find('a').addClass('alert');
        $('#alert').click(function(){
          $('.alert').text('').removeClass('alert');
          $('.message').attr('id','');
        });
        $('.alert').text(data.message);
        $('#login').val('');
      }else{
        socket.emit('logged in', {name: data.name})
        $('#submit').animate({opacity: 0},500);
        $('#login').animate({opacity: 0},500,function(){
          $('#message').text('Welcome, '+data.name).show().animate({opacity: 1},500,function(){
            setTimeout(function(){
              $('#login_container').animate({opacity: 0},500,function(){
                $(this).remove();
                $('body').append('<div id="board"></div>');
                init_map(data.start_loc, data.start_dir);
              })
            },500);
          });
        });
      }
    });
  });
});

function init_map(start_loc, start_dir){
  paper = Raphael("board", board_size, board_size);
  paper.rect(0,0,board_size,board_size,10).attr({stroke: '#000', 'stroke-width':5, fill: '#ddd'});
  for(var i = 1; i < 12; i++){
    y = i > 6 ? (11-i) : 5;
    x++;
    var osc_i = (i > 5) ? (12 - i) : i;
    column_of_hexagons(25+i*hex_width*1.5,(175-hex_height/4)-hex_height*osc_i+osc_i*hex_height/2,osc_i+5);
  }
  cur_loc = start_loc;
  var cur_coor = grid_to_loc(cur_loc);
  player = paper.circle(cur_coor.x, cur_coor.y,5).attr({fill: '#f00'});
  direction_index = get_index(start_dir);
  var off = direction_offset();
  var pointer_coor = grid_to_loc({x: start_loc.x+start_dir.x, y: start_loc.y+start_dir.y});
  pointer = paper.circle((pointer_coor.x+cur_coor.x)/2,(pointer_coor.y+cur_coor.y)/2,3).attr({fill: '#0f0'});
  $('#board').animate({opacity: 1},500);
}

function column_of_hexagons(firstx, firsty, number){
  for(var i = 0; i < number; i++){
    hexagon(firstx,firsty+i*hex_height);
    y--;
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
  //Draws coordinates
  //paper.text(centerx,centery,x+','+y);
  hexagons[x][y] = hexagon;
  hexagon.data('x',x);
  hexagon.data('y',y);
  return hexagon;
}

function grid_to_loc(points){
  var grid_pts = {};
  grid_pts.x = points.x*hex_width*1.5+250;
  grid_pts.y = 250-points.y*hex_height-points.x*hex_height/2;
  return grid_pts
}

//37 - left
//38 - up
//39 - right
//40 - down
$(document).keydown(function(e){
  switch(e.which){
    case 37:
      direction_index = (direction_index+5) % 6;
      move_pointer();
      break;
    case 39:
      direction_index = (direction_index+1) % 6;
      move_pointer();
      break;
    case 38:
      if(inBounds(1)){
        move_piece(1);
      }
      break;
    case 40:
      if(inBounds(-1)){
        move_piece(-1);
      }
      break;
  }
});

function direction_offset(){
  var offset = directions[direction_index];
  return {x: offset.x, y: offset.y};
}

function move_pointer(){
  var off = direction_offset();
  off = grid_to_loc({x: off.x + cur_loc.x, y: off.y + cur_loc.y});
  var cur_coor = grid_to_loc({x: cur_loc.x, y: cur_loc.y});
  pointer.animate({cx: (cur_coor.x + off.x)/2, cy: (cur_coor.y + off.y)/2},100);
}

function move_piece(direction){
  var off = direction_offset();
  cur_loc.x += off.x*direction;
  cur_loc.y += off.y*direction;
  var cur_coor = grid_to_loc({x: cur_loc.x, y: cur_loc.y});
  player.animate({cx: cur_coor.x, cy: cur_coor.y},100);
  move_pointer();
}

function inBounds(direction){
  var off = direction_offset();
  var x = cur_loc.x + off.x*direction;
  var y = cur_loc.y + off.y*direction;
  return Math.abs(x) < 6 && Math.abs(y) < 6 && Math.abs(x+y) < 6;
}

function get_index(dir){
  for(var i  = 0; i < directions.length; i++){
    if(directions[i].x == dir.x && directions[i].y == dir.y){
      return i;
    }
  }
  return -1;
}
