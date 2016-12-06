//MAIN NODE SERVER CALL app.js 
//CREATED BY: HUGO GARZA
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var path = require('path');

var express = require('express');
var session = require('express-session');
//INIT EXPRESS
var app = express();

var server = require('http').createServer(app);
var socketio = require('socket.io').listen(server);

//ROUTES INCLUDES
var login = require('./controllers/login-controller');
var chat = require('./controllers/chat-controller');
var io = require('./controllers/socket-controller')(socketio);


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


//RUN SERVER BY PORT 3000
server.listen(3000, function(){
	console.log("Server running and listen by port 3000");
});