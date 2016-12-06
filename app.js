//MAIN NODE SERVER CALL app.js 
//CREATED BY: HUGO GARZA
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');
var dateFormat = require('date-format');

var express = require('express');
var session = require('express-session');
//INIT EXPRESS
var app = express();

var server = require('http').createServer(app);
var socketio = require('socket.io').listen(server);

//ROUTES INCLUDES
var login = require('./controllers/login-controller');
var chat = require('./controllers/chat-controller');


// INIT CONFIGURATION
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'AB-CD-EF'}));

app.use('/', login);
app.use('/chat', chat);

//LOAD INIT VIEW
app.get('/', function(request, response){
	response.sendfile('./public/views/index.html');
});

app.get('/room/home', function(request, response){
	response.sendfile('./public/views/chat.html');
});


//SOCKETS
var nicknames = {};
socketio.sockets.on('connection', function(socket){
	socket.on('message:send', function(data){
		socketio.sockets.emit('message:new', {msg: data, name: socket.userLogged.name, date: dateFormat.asString('MM/dd hh:mm:ss', new Date())});
	});

	socket.on('user:login', function(data, callback){
		if(data.username in nicknames){
			callback(false);
		}else{
			callback(true);
			socket.userLogged = data;
			nicknames[socket.userLogged.username] = 1;
			updateNickNames();
		}
	});

	socket.on('disconnect', function(data){
		if(!socket.userLogged) return;
		delete nicknames[socket.userLogged.username];
		updateNickNames();
	});

	function updateNickNames(){
		socketio.sockets.emit('user:list', nicknames);
	}
});

//RUN SERVER BY PORT 3000
server.listen(3000, function(){
	console.log("Server running and listen by port 3000");
});