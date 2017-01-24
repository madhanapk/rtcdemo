var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var _ = require('lodash-node');

var users = [];

var request = require('request'), 
    fs      = require('fs'),
    url     = 'http://upload.wikimedia.org/wikipedia/commons/8/8c/JPEG_example_JPG_RIP_025.jpg';

request(url, {encoding: 'binary'}, function(error, response, body) {
  fs.writeFile('downloaded.jpg', body, 'binary', function (err) {});
});

app.get('/', function (req, res){
  res.sendfile('index.html');
});

app.get('/image', function (req, res){
  request(url, {encoding: 'binary'}, function(error, response, body) {
    fs.writeFile('downloaded.jpg', body, 'binary', function (err) {});
  });
});

io.on('connection', function (socket) {
  socket.on('login', function (name) {
    // if this socket is already connected,
    // send a failed login message
    if (_.findIndex(users, { socket: socket.id }) !== -1) {
      socket.emit('login_error', 'You are already connected.');
    }

    // if this name is already registered,
    // send a failed login message
    if (_.findIndex(users, { name: name }) !== -1) {
      socket.emit('login_error', 'This name already exists.');
      return; 
    }

    users.push({ 
      name: name,
      socket: socket.id
    });

    socket.emit('login_successful', _.pluck(users, 'name'));
    socket.broadcast.emit('online', name);

    console.log(name + ' logged in');
  });

  socket.on('sendMessage', function (name, message) {
    var currentUser = _.find(users, { socket: socket.id });
    if (!currentUser) { return; }

    var contact = _.find(users, { name: name });
    if (!contact) { return; }
    
    io.to(contact.socket)
      .emit('messageReceived', currentUser.name, message);
  });

  socket.on('disconnect', function () {
    var index = _.findIndex(users, { socket: socket.id });
    if (index !== -1) {
      socket.broadcast.emit('offline', users[index].name);
      console.log(users[index].name + ' disconnected');

      users.splice(index, 1);
    }
  });
});
var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('listening on'+port);
});
