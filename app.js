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

//INIT SOCKET & MONGO DB
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');

//INIT DATABASE INSTANCE
var dbUrl = process.env.DB_URL || "localhost";
var dbPort = process.env.DB_PORT || "27017";
mongoose.connect("mongodb://" + dbUrl + ":" + dbPort + "/mean-chat", { useNewUrlParser: true });

//ROUTES INCLUDES
var login = require('./controllers/login-controller')(express, mongoose);
var chat = require('./controllers/chat-controller')(express, mongoose, io);


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
	console.log("Server running and listen by port " + 3000);
});