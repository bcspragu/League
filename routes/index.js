var users = {
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
  res.render('index', { title: 'Express' });
};

exports.login = function(req, res){
  var data = req.body;
  //Valid id
  if(typeof users[data.password] !== 'undefined'){
    //They aren't already logged in
    if(typeof sockets[users[data.password].id] === 'undefined'){
      res.json(users[data.password]);
    }else{
      res.json({message: "You're already logged in, retard."});
    }
  }else{
    res.json({message: 'Invalid password, motherfucker.'});
  }
}
