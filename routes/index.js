var users = {
  "BlackBallz": {
    name: "Evan",
    start_loc: {x: -5, y: 5},
    start_dir: {x: 1, y: -1}
  },
  "$w0L3": {
    name: "PKels",
    start_loc: {x: 0, y: 5},
    start_dir: {x: 0, y: -1}
  },
  "Feeeeet": {
    name: "Squid",
    start_loc: {x: 5, y: 0},
    start_dir: {x: -1, y: 0}
  },
  "JuanKorea": {
    name: "Fat John",
    start_loc: {x: 5, y: -5},
    start_dir: {x: -1, y: 1}
  },
  "Look@TheDonut": {
    name: "PCoffs",
    start_loc: {x: 0, y: -5},
    start_dir: {x: 0, y: 1}
  },
  "SheBiz": {
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
    res.json(users[data.password]);
  }else{
    res.json({message: 'Invalid password'});
  }
}
