var root3 = Math.sqrt(3);
var hex_width = 25; //Width of the base
var hex_height = hex_width*root3;
var paper;
var x,y;
var hexagons = {};
var other_players = [];
var logged_in = false;
var game_on = false;
var power_radius = 1;
var max_bombs = 1;
var current_bombs = 0;

var board_size = 500; //TODO Make everything rely on this, esp hexagon creation
var socket;
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
  socket = io.connect('http://localhost');
  $('#login').focus();

  init_map();
  $('#submit').click(function(e){
    e.preventDefault();
    var password = $('#login').val();
    $.post('/login',{password: password},function(data){
      //Invalid login
      if(data.message){
        $('.message').attr('id','alert').find('a').addClass('alert');
        $('#alert').click(function(){
          $('.alert').text('').removeClass('alert');
          $('.message').attr('id','');
        });
        $('.alert').text(data.message);
        $('#login').val('');
      }else{
        createPlayer(data.start_loc,data.start_dir);
        $('#submit').animate({opacity: 0},500);
        $('#login').animate({opacity: 0},500,function(){
          $('#message').text('Welcome, '+data.name).show().animate({opacity: 1},500,function(){
            setTimeout(function(){
              $('#login_container').animate({opacity: 0},500,function(){
                $(this).remove();
                $('#board').animate({opacity: 1},500);
                logged_in = true;
                socket.emit('logged in', data);
              })
            },500);
          });
        });
      }
    });
  });

  socket.on('move',function(data){
    if(logged_in){
      var cur_coor = grid_to_loc(data.loc);
      if(typeof other_players[data.id] === 'undefined'){
        other_players[data.id] = paper.circle(cur_coor.x, cur_coor.y,5).attr({fill: '#00f', opacity: 0})
        .animate({opacity: 1},250);
      }else{
        other_players[data.id].animate({cx: cur_coor.x, cy: cur_coor.y},50);
      }
    }
  });

  socket.on('kill',function(data){
    if(logged_in){
      if(typeof other_players[data.id] !== 'undefined'){
        other_players[data.id].animate({opacity: 0},250,function(){
          other_players[data.id].remove();
          delete other_players[data.id];
        });
      }
    }
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
  delete_empty_cells();
  draw_walls();
}

function delete_empty_cells(){
  for(var x in hexagons){
    for(var y in hexagons[x]){
      if(hexagons[x][y] === 0){
        delete hexagons[x][y];
      }
    }
  }
}

function draw_walls(){
  var center = {x: 0, y: 0};
  for(var x in hexagons){
    for(var y in hexagons[x]){
      var x = parseInt(x);
      var y = parseInt(y);
      var cent_dist = hex_distance(center,{x: x, y: y});
      if(cent_dist == 4 || cent_dist == 2 || cent_dist == 0){
        hexagons[x][y].attr({fill: '#000'}).data('wall',true);
      }
    }
  }
}

function hex_distance(coor1, coor2){
  return (Math.abs(coor1.x - coor2.x) + Math.abs(coor1.y - coor2.y) + Math.abs(coor1.x + coor1.y - coor2.x - coor2.y)) / 2;
}
  

function createPlayer(start_loc, start_dir){
  cur_loc = start_loc;
  var cur_coor = grid_to_loc(cur_loc);
  player = paper.circle(cur_coor.x, cur_coor.y,5).attr({fill: '#0f0'});
  direction_index = get_index(start_dir);
  var off = direction_offset();
  var pointer_coor = grid_to_loc({x: start_loc.x+start_dir.x, y: start_loc.y+start_dir.y});
  pointer = paper.circle((pointer_coor.x+cur_coor.x)/2,(pointer_coor.y+cur_coor.y)/2,3).attr({fill: '#f0f'});
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
  paper.text(centerx,centery,x+','+y);
  hexagons[x][y] = hexagon;
  hexagon.data('wall',false);
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

//32 - space
//37 - left
//38 - up
//39 - right
//40 - down
$(document).keydown(function(e){
  if(logged_in){
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
        if(isValid(1)){
          move_piece(1);
          socket.emit('move', {loc: cur_loc});
        }
        break;
      case 40:
        if(isValid(-1)){
          move_piece(-1);
          socket.emit('move', {loc: cur_loc});
        }
        break;
      case 32:
        if(current_bombs < max_bombs){
          current_bombs++;
          var cur_coor = grid_to_loc(cur_loc);
          var bomb_x = cur_loc.x;
          var bomb_y = cur_loc.y;
          var bomb = paper.circle(cur_coor.x, cur_coor.y,8).attr({fill: '#ff0'}).animate({fill: '#f00'},3000,function(){
            this.animate({r: hex_width*2*power_radius},100,'<',function(){
              for(var x in hexagons){
                for(var y in hexagons[x]){
                  var x = parseInt(x);
                  var y = parseInt(y);
                  var dist = hex_distance({x: bomb_x, y: bomb_y},{x: x, y: y});
                  if(dist <= power_radius){
                    hexagons[x][y].data('wall',false);
                    hexagons[x][y].attr({fill: ''});
                  }
                }
              }
              this.remove();
              current_bombs--;
            });
          });
        }
        break;
    }
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
  pointer.animate({cx: (cur_coor.x + off.x)/2, cy: (cur_coor.y + off.y)/2},50);
}

function move_piece(direction){
  var off = direction_offset();
  cur_loc.x += off.x*direction;
  cur_loc.y += off.y*direction;
  var cur_coor = grid_to_loc({x: cur_loc.x, y: cur_loc.y});
  player.animate({cx: cur_coor.x, cy: cur_coor.y},50);
  move_pointer();
}

function inBounds(direction){
  var off = direction_offset();
  var x = cur_loc.x + off.x*direction;
  var y = cur_loc.y + off.y*direction;
  return Math.abs(x) < 6 && Math.abs(y) < 6 && Math.abs(x+y) < 6;
}

function isValid(direction){
  var off = direction_offset();
  var x = cur_loc.x + off.x*direction;
  var y = cur_loc.y + off.y*direction;
  return (typeof hexagons[x] !== 'undefined' && typeof hexagons[x][y] !== 'undefined' && !hexagons[x][y].data('wall'));
}

function isWall(loc){
  var x = loc.x;
  var y = loc.y;
  return (typeof hexagons[x] !== 'undefined' && typeof hexagons[x][y] !== 'undefined' && hexagons[x][y].data('wall'));
}

function get_index(dir){
  for(var i  = 0; i < directions.length; i++){
    if(directions[i].x == dir.x && directions[i].y == dir.y){
      return i;
    }
  }
  return -1;
}
