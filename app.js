
/**
 * Module dependencies.
 */

//Global list of player_ids paired with locations
sockets = {};
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

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
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
    socket.set('id',data.id,function(){
      sockets[data.id] = {socket: socket, loc: data.start_loc};
      socket.broadcast.emit('move', {id: data.id, loc: data.start_loc});
      for(var p_id in sockets){
        if(data.id != p_id){
          socket.emit('move', {id: parseInt(p_id), loc: sockets[p_id].loc});
        }
      }
    });
  });

  socket.on('bomb',function(data){
    socket.get('id',function(err, id){
      var current_bomb_id = bomb_id;
      io.sockets.emit('bomb',{x: data.x, y: data.y, id: current_bomb_id, player_id: id});
      setTimeout(function(){
        io.sockets.emit('explode', {id: current_bomb_id, player_id: id});
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
    });
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
