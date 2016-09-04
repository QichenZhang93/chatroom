var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysqlOperator = require('./Scripts/sql');
var cookieParser = require('cookie-parser');

app.use(cookieParser());

// GET /
app.get('/', function(req, res) {
  console.log("get /");
  res.sendFile(__dirname + '/Views/login.html');
});

// GET login
app.get('/login', function (req, res) {
  console.log('get /login');
  res.sendFile(__dirname + '/Views/login.html');
});

// GET login/username/:username/password/:password
app.get('/login/username/:username/password/:password', function(req, res) {
  console.log("GET login/username/:username/password/:password");
  var username = req.params.username;
  var password = req.params.password;
  if ( (username == "") || (password == "") ) {
    console.log("invalid username or password");
    res.redirect('/login');
  }
  else {
    mysqlOperator.FindUser(username, password, function(err, queryRes) {
      console.log('Result of FindUser is ' + queryRes);
      if (err) {
        console.log(err);
        res.redirect('/login');
      }
      else if (queryRes == -1) {
        res.redirect('/login');
      }
      else {
        console.log('User ' + username + ' logs in. User id is ' + queryRes);
        res.redirect('/chat/userid/' + queryRes);
      }
    });
  }
});

// GET chat/userid/:userid
app.get('/chat/userid/:userid', function(req, res) {
  console.log("GET /chat/userid/:userid");
  var userid = req.params.userid;
  if (userid == null || userid == "") {
    res.redirect('/login');
  }
  else {
    console.log('User ' + userid + ' enters the chatroom.');
    res.cookie('userid', userid);
    res.sendFile(__dirname + '/Views/chat.html');
  }
});

// GET /register
app.get("/register", function(req, res) {
  console.log("GET /register");
  res.sendFile(__dirname + '/Views/register.html');
});

// GET /register/username/:username/password/:password
app.get("/register/username/:username/password/:password", function(req, res) {
  console.log("GET /register/username/:username/password/:password");
  mysqlOperator.RegisterUser(req.params.username, req.params.password, function(err, status) {
    if (err) {
      console.log(err);
      res.redirect('/register');
    }
    else {
      mysqlOperator.FindUser(req.params.username, req.params.password, function(err, id) {
        console.log('User with id ' + id + ' registers succefully');
        res.redirect('/chat/userid/' + id);
      })
    }
  });
});

// GET /view_history/start/:start/num/:num
app.get('/view_history/start/:start/num/:num', function(req, res) {
  console.log('GET /view_history/start/:start/num/:num');
  res.cookie('history_start', req.params.start);
  res.cookie('history_num', req.params.num);
  res.sendFile(__dirname + '/Views/history.html');
});

// GET /view_history/items/start/:start/num/:num
app.get('/view_history/items/start/:start/num/:num', function(req, res) {
  console.log('GET view_history/items/start/:start/num/:num');
  mysqlOperator.RetrieveAllMessages(req.params.start, req.params.num, function(err, msgs) {
    if (err) res.send("Sorry, an error occurs when finding messages.");  
    else {
      mysqlOperator.GetMessagesNumber(function(err, num) {
        if (err) res.send("Sorry, an error occurs when finding messages.");
        else {
          res.cookie('msg_num', num);
          res.send(msgs);
        }
      });
    }
  });
});

// GET /logout
app.get('/logout', function(req, res) {
  console.log('GET /logout');
  res.sendFile(__dirname + '/Views/login.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    console.log('on chat message: ' + msg);
    var userid = msg.userid;
    var content = msg.content;
    var send_time = msg.send_time;
    mysqlOperator.InsertMessage(userid, content, send_time, function(err, flag) {
      mysqlOperator.FindUserName(userid, function(err, username) {
        msg.username = username;
        console.log('New message: ' + msg);
        io.emit('chat message', msg);
      });
    });
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
