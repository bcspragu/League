$(function(){

  var socket = io.connect('http://localhost');

  var id;
  socket.on('id', function (data) {
    id = data.id
  });

  socket.on('move', function (data){
    var block = $('#block'+data.id);
    if(block.length == 0){
      $('body').append('<div class="block" id="block'+data.id+'"></div>')
      block = $('#block'+data.id);
    }
    block.css({
      x: data.x+' px',
      y: data.y+' px'
    });
  });

  $('body').on('click','.block',function(){
    var pos = $(this).position;
    socket.emit('move',{id: id, x: pos.left, y: pos.top});
  })
});
