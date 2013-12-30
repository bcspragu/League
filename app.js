
/**
 * Module dependencies.
 */

//Global list of player_ids paired with locations
sockets = {};
hexagons = {};
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var connections = 0;
var bombs = {};
var bomb_id = 0;

var x = -5;
var y = 5;

function init_map(){
  for(var i = 1; i < 12; i++){
    y = i > 6 ? (11-i) : 5;
    hexagons[x] = {};
    var column_height = ((i > 5) ? (12 - i) : i) + 5;
    for(var j = 0; j < column_height; j++){
      hexagons[x][y] = {type: 'open'};
      y--;
    }
    x++;
  }
  draw_walls();
}

function draw_walls(){
  var center = {x: 0, y: 0};
  for(var x in hexagons){
    for(var y in hexagons[x]){
      var x = parseInt(x);
      var y = parseInt(y);
      var cent_dist = hex_distance(center,{x: x, y: y});
      if(cent_dist == 4 || cent_dist == 2 || cent_dist == 0){
        hexagons[x][y].type = 'wall';
      }
    }
  }
}

function hex_distance(coor1, coor2){
  return (Math.abs(coor1.x - coor2.x) + Math.abs(coor1.y - coor2.y) + Math.abs(coor1.x + coor1.y - coor2.x - coor2.y)) / 2;
}

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon(path.join(__dirname, 'public/images/favicon.ico')));
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.post('/login', routes.login);

io.sockets.on('connection', function (socket) {

  socket.on('logged in',function(data){
    connections++;
    socket.set('id',data.id,function(){
      sockets[data.id] = {socket: socket, loc: data.start_loc};
      socket.broadcast.emit('move', {id: data.id, loc: data.start_loc});
      for(var p_id in sockets){
        if(data.id != p_id){
          socket.emit('move', {id: parseInt(p_id), loc: sockets[p_id].loc});
        }
      }
      //Gangs all here guys
      if(connections == 6){
        io.sockets.emit('start');
      }
    });
  });

  socket.on('bomb',function(data){
    socket.get('id',function(err, id){
      var current_bomb_id = bomb_id;
      io.sockets.emit('bomb',{x: data.x, y: data.y, id: current_bomb_id, player_id: id});
      setTimeout(function(){
        io.sockets.emit('explode', {id: current_bomb_id, player_id: id});
        var bomb_loc = {x: data.x, y: data.y};
        for(var x in hexagons){
          for(var y in hexagons[x]){
            var x = parseInt(x);
            var y = parseInt(y);
            var dist = hex_distance(bomb_loc,{x: x, y: y});
            if(dist <= data.power_radius){
              hexagons[x][y].type = 'open';
            }
          }
        }
      },3000);
      bomb_id++;
    });
  });

  socket.on('move',function(data){
    socket.get('id',function(err, id){
      socket.broadcast.emit('move', {id: id, loc: data.loc});
      sockets[id].loc = data.loc;
    })
  });

  socket.on('disconnect',function(){
    socket.get('id',function(err, id){
      socket.broadcast.emit('kill',{id: id});
      delete sockets[id];
      connections--;
    });
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

init_map();
