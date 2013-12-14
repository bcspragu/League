$(function(){
  var socket = io.connect('http://localhost');

  var id;
  socket.on('id', function (data) {
    id = data.id
    $('.my_block').attr('id','block'+id).draggable({
      drag: function(event, ui){
        socket.emit('move',{id: id, x: ui.position.left, y: ui.position.top});
      }
    });
  });

  socket.on('move', function (data){
    var block = $('#block'+data.id);
    if(block.length == 0){
      $('body').append('<div class="block" id="block'+data.id+'"></div>')
      block = $('#block'+data.id);
    }
    block.css({
      top: data.y,
      left: data.x
    });
  });

  socket.on('kill',function(data){
    $('#block'+data.id).remove();
  });

  $('body').on('click','.block',function(e){
    e.preventDefault();
  })
});
