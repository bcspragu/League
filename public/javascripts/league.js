var root3 = Math.sqrt(3);
var hex_width = 25; //Width of the base
var hex_height = hex_width*root3;
var paper;
var hexagons;
var other_players = [];
var logged_in = false;
var game_on = false;
var alive = true;
var power_radius = 2;
var max_bombs = 1;
var current_bombs = 0;
var bombs = {};
var player_id;
var powerups = {};
var speed = 250;
var can_move = true;
var hud;
var player_list;
var users = ["Evan","PKels","Squid","Fat John","PCoffs","BShizz"];

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

$(function(){
  socket = io.connect('http://'+window.location.hostname);
  $('#login').focus();

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
        var user_info = data.user_info;
        socket.emit('log in', user_info);
        hexagons = data.map;
        player_id = user_info.id;
        init_map();
        createPlayer(user_info.start_loc,user_info.start_dir);
        if(!data.alive){
          dead(data.killed_by);
        }
        $('#submit').animate({opacity: 0},500);
        $('#login').animate({opacity: 0},500,function(){
          $('#message').text('Welcome, '+user_info.name).show().animate({opacity: 1},500,function(){
            setTimeout(function(){
              $('#login_container').animate({opacity: 0},500,function(){
                $(this).remove();
                $('#board').animate({opacity: 1},500);
                logged_in = true;
                socket.emit('logged in',user_info);
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
        other_players[data.id] = paper.image('/images/'+data.id+'.png',cur_coor.x-hex_width/2, cur_coor.y-hex_height/4, hex_width, hex_width)
        .animate({opacity: 1},250);
        update_player_display();
      }else{
        other_players[data.id].animate({x: cur_coor.x-hex_width/2, y: cur_coor.y-hex_height/4},data.speed);
      }
    }
  });

  socket.on('bomb',function(data){
    if(logged_in){
      var bomb_loc = grid_to_loc({x: data.x, y: data.y});
      bombs[data.id] = paper.circle(bomb_loc.x, bomb_loc.y,8).attr({fill: '#ff0'}).animate({fill: '#f00'},3000)
      .data('loc',{x: data.x, y: data.y});
    }
  });

  socket.on('explode',function(data){
    if(logged_in){
      var bomb_loc = bombs[data.id].data('loc');
      bombs[data.id].animate({r: hex_width*data.power_radius/2},100,'<',function(){
        for(var x in hexagons){
          for(var y in hexagons[x]){
            var x = parseInt(x);
            var y = parseInt(y);
            var dist = hex_distance(bomb_loc,{x: x, y: y});
            if(dist <= data.power_radius/2){
              hexagons[x][y].type = 'open';
              hexagons[x][y].piece.attr({'fill-opacity': 1}).animate({fill: '#f00'},100,function(){
                this.animate({'fill-opacity': 0, fill: ''},500);
              });
            }
          }
        }
        this.remove();
        if(data.player_id == player_id){
          current_bombs--;
          update_powerup_display();
        }
      });
    }
  })

  socket.on('kill',function(data){
    if(logged_in){
      //You died
      if(data.id == player_id){
        dead(data.killed_by);
      }
      else if(typeof other_players[data.id] !== 'undefined'){
        other_players[data.id].animate({opacity: 0},250,function(){
          other_players[data.id].remove();
          delete other_players[data.id];
        });
      }
    }
  });

  socket.on('powerup',function(data){
    if(logged_in){
      draw_powerup(data.type,{x: data.x, y: data.y});
    }
  });

  socket.on('retrieved',function(data){
    if(logged_in){
      if(data.player_id == player_id){
        switch(data.type){
          case 'speed':
            speed = Math.max(50, speed-50);
            break;
          case 'radius':
            power_radius = Math.min(6,power_radius+1);
            break;
          case 'capacity':
            max_bombs++;
            break;
        }
      }
      //Destroy the powerup
      powerups[data.x+','+data.y].remove();
      delete powerups[data.x+','+data.y];
      update_powerup_display();
    }
  });

  socket.on('start',function(){
    game_on = true;
  });
});

function update_powerup_display(){
  var disp_speed = (300-speed)/50;
  var disp_power = Math.floor(power_radius/2);
  var disp_bombs = max_bombs - current_bombs;
  var text = 'Speed: ';
  text += ((disp_speed == 5) ? '5 (Max)' : disp_speed)+"\n";
  text += 'Radius: ';
  text += ((disp_power == 3) ? '3 (Max)' : disp_power)+"\n";
  text += 'Bombs: '+disp_bombs;
  hud.attr('text', text);
}

function update_player_display(){
  var no_names = true;
  var player_text = "Waiting for:\n";
  for(var i = 0; i < users.length; i++){
    if(typeof other_players[i] === 'undefined' && i != player_id){
      player_text += users[i]+"\n";
      no_names = false;
    }
  }
  //Leave it blank if there aren't any names
  if(no_names){
    player_text = '';
  }
  player_list.attr('text', player_text);
}

function draw_powerup(powerup, loc){
  var fader = function(color){
    return Raphael.animation({fill: color},1000).repeat(Infinity);
  }

  var coor = grid_to_loc(loc);
  switch(powerup){
    case 'speed':
      powerups[loc.x+','+loc.y] = paper.circle(coor.x,coor.y,10).attr({fill: 'green'}).animate(fader('yellow'));
      break;
    case 'radius':
      powerups[loc.x+','+loc.y] = paper.circle(coor.x,coor.y,10).attr({fill: 'black'}).animate(fader('red'));
      break;
    case 'capacity':
      powerups[loc.x+','+loc.y] = paper.circle(coor.x,coor.y,10).attr({fill: 'blue'}).animate(fader('white'));
      break;
  }
  
}

function init_map(start_loc, start_dir){
  paper = Raphael("board", board_size, board_size);
  paper.rect(0,0,board_size,board_size,10).attr({stroke: '#000', 'stroke-width':5, fill: '#ddd'});
  for(var x in hexagons){
    for(var y in hexagons[x]){
      var x = parseInt(x);
      var y = parseInt(y);
      hexagon({x: x, y: y});
    }
  }
  hud = paper.text(10,board_size*0.95,'').attr('text-anchor','start');
  player_list = paper.text(board_size-10,board_size*0.90,'').attr('text-anchor','end');
  update_powerup_display();
  update_player_display();
}

function dead(killed_by){
  var dead_text = 'Dead.';
  if(typeof killed_by !== 'undefined'){
    dead_text = "Killed by\n"+killed_by;
  }
  paper.text(board_size/2,board_size/2,dead_text).attr({'text-anchor': 'middle', 'font-size': 100, 'font-weight': 'bold', fill: '#fff','stroke-width': 5, stroke: '#000', opacity: 0}).animate({opacity: 0.8},1000);
  alive = false;
  player.animate({opacity: 0},250,function(){
    player.remove();
    pointer.remove();
  });
}

function hex_distance(coor1, coor2){
  return (Math.abs(coor1.x - coor2.x) + Math.abs(coor1.y - coor2.y) + Math.abs(coor1.x + coor1.y - coor2.x - coor2.y)) / 2;
}
  

function createPlayer(start_loc, start_dir){
  cur_loc = start_loc;
  var cur_coor = grid_to_loc(cur_loc);
  player = paper.image('/images/'+player_id+'.png',cur_coor.x-hex_width/2, cur_coor.y-hex_height/4,hex_width,hex_width);
  direction_index = get_index(start_dir);
  var off = direction_offset();
  var pointer_coor = grid_to_loc({x: start_loc.x+start_dir.x, y: start_loc.y+start_dir.y});
  pointer = paper.circle((pointer_coor.x+cur_coor.x)/2,(pointer_coor.y+cur_coor.y)/2,3).attr({fill: '#f0f'});
}

function hexagon(pt){
  var center = grid_to_loc(pt);
  //Move to top left coordinate
  var hex_string = 'M'+(center.x-hex_width/2)+','+(center.y-hex_height/2);
  //Line to top right
  hex_string += 'L'+(center.x+hex_width/2)+','+(center.y-hex_height/2);
  //Line to right edge
  hex_string += 'L'+(center.x+hex_width)+','+center.y;
  //Line to bottom right
  hex_string += 'L'+(center.x+hex_width/2)+','+(center.y+hex_height/2);
  //Line to bottom left
  hex_string += 'L'+(center.x-hex_width/2+',')+(center.y+hex_height/2);
  //Line to left edge
  hex_string += 'L'+(center.x-hex_width+',')+center.y;
  //Line to top left
  hex_string += 'L'+(center.x-hex_width/2+',')+(center.y-hex_height/2);
  var hexagon = paper.path(hex_string).attr({'stroke-width':2});
  //Draws coordinates
  //paper.text(center.x,center.y,x+','+y);
  switch(hexagons[pt.x][pt.y].type){
    case 'wall':
      hexagon.attr({fill: '#000'});
      break;
    case 'open':
      break;
    default:
      draw_powerup(hexagons[pt.x][pt.y].type,pt);
  }
  hexagons[pt.x][pt.y].piece = hexagon;
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
  if(logged_in && alive && game_on){
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
        if(isValid(1) && can_move){
          can_move = false;
          move_piece(1);
          socket.emit('move', {loc: cur_loc, speed: speed});
        }
        break;
      case 40:
        if(isValid(-1) && can_move){
          can_move = false;
          move_piece(-1);
          socket.emit('move', {loc: cur_loc, speed: speed});
        }
        break;
      case 32:
        if(current_bombs < max_bombs){
          current_bombs++;
          var cur_coor = grid_to_loc(cur_loc);
          var bomb_x = cur_loc.x;
          var bomb_y = cur_loc.y;
          socket.emit('bomb',{x: bomb_x, y: bomb_y, power_radius: power_radius});
        }
        break;
    }
    update_powerup_display();
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
  pointer.animate({cx: (cur_coor.x + off.x)/2, cy: (cur_coor.y + off.y)/2},speed);
}

function move_piece(direction){
  var off = direction_offset();
  cur_loc.x += off.x*direction;
  cur_loc.y += off.y*direction;
  var cur_coor = grid_to_loc({x: cur_loc.x, y: cur_loc.y});
  player.animate({x: cur_coor.x-hex_width/2, y: cur_coor.y-hex_height/4},speed,function(){
    can_move = true;
  });
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
  return (typeof hexagons[x] !== 'undefined' && typeof hexagons[x][y] !== 'undefined' && hexagons[x][y].type != 'wall');
}

function isWall(loc){
  var x = loc.x;
  var y = loc.y;
  return (typeof hexagons[x] !== 'undefined' && typeof hexagons[x][y] !== 'undefined' && hexagons[x][y].type == 'wall');
}

function get_index(dir){
  for(var i  = 0; i < directions.length; i++){
    if(directions[i].x == dir.x && directions[i].y == dir.y){
      return i;
    }
  }
  return -1;
}
