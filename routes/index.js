exports.users = {
  "BlackBallz": {
    id: 0,
    name: "Evan",
    start_loc: {x: -5, y: 5},
    start_dir: {x: 1, y: -1}
  },
  "$w0L3": {
    id: 1,
    name: "PKels",
    start_loc: {x: 0, y: 5},
    start_dir: {x: 0, y: -1}
  },
  "Feeeeet": {
    id: 2,
    name: "Squid",
    start_loc: {x: 5, y: 0},
    start_dir: {x: -1, y: 0}
  },
  "KoreaJuan": {
    id: 3,
    name: "Fat John",
    start_loc: {x: 5, y: -5},
    start_dir: {x: -1, y: 1}
  },
  "Look@TheDonut": {
    id: 4,
    name: "PCoffs",
    start_loc: {x: 0, y: -5},
    start_dir: {x: 0, y: 1}
  },
  //"SheBiz": {
  "a": {
    id: 5,
    name: "BShizz",
    start_loc: {x: -5, y: 0},
    start_dir: {x: 1, y: 0}
  }
}
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'To The Death.'});
};

exports.login = function(req, res){
  var data = req.body;
  //Valid id
  if(typeof exports.users[data.password] !== 'undefined'){
    var user = sockets[exports.users[data.password].id];
    //They aren't already logged in
    if(typeof user === 'undefined'){
      res.json({user_info: exports.users[data.password], map: hexagons, alive: true});
    }else{
      if(user.logged_in){
        res.json({message: "You're already logged in, retard."});
      }else{
        var killed_by;
        for(var password in exports.users){
          if(exports.users[password].id == user.killed_by){
            killed_by = exports.users[password].name;
          }
        }
        //If they aren't already logged in, give them the current situation
        var u_data = exports.users[data.password];
        var user_info = {id: u_data.id, name: u_data.name, start_dir: u_data.start_dir, start_loc: user.loc};
        res.json({user_info: user_info, map: hexagons, alive: user.alive, killed_by: killed_by});
      }
    };
  }else{
    res.json({message: 'Invalid password, motherfucker.'});
  }
};
