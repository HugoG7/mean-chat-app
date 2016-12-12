//INIT login-controller.js
var library = new require('../util/library.js').Library();
var async = require('async');
var util = new library.Util();
var transaction = {};
module.exports = function(app, mongoose, io){
	var router = app.Router();

	//CREATE DB SCHEMA FOR LOGIN
	var Schema = mongoose.Schema;
	var chatSchema = new Schema({
		name: String,
		type: String,
		owner: [String],
		messages: [{ 
					_id: false,
					id: Number,
					message: String,
					owner: String,
					to: [String],
					seen: Boolean,
					datetime: Date,
				  }]
	}, { versionKey: false });
	//MOONGOSE PLURALIZE THE NAMES THATS MEANS chat = chats, so we override the collection add 3rd param 'chat'
	var userDto = mongoose.model('users');
	var chatDto = mongoose.model('chat', chatSchema, 'chat');
	var currentChatId = "";

	//CALLBACKS
	router.get('/mean/api/get/user', function(request, response, next) {
		response.json(request.session.userSession);
	});

	//PRIVATE
	router.get('/mean/api/get/private-chat', function(request, response, next) {
		var currentUser = request.session.userSession.username;
		var selectedUser = request.query.selectedUser;
		async.waterfall([
		    function(callback) {
		    	var wait = true;
		    	chatDto.findOne({"owner" : { $size: 2, $all: [currentUser, selectedUser]}}, function(err, chat){
		        	if(err) response.send(err);
		        	if(chat == null || chat == 'undefained'){
		        		chatDto.create({name: [currentUser, selectedUser].join('-'), type: 'private', owner: [currentUser, selectedUser]}, 
		        			function(err, newChat){
		        			if(err) response.send(err);
		        			chat = newChat;
		        			wait = false;
		        		});
		        	}else{
		        		wait = false;
		        	}
		        	
		        	var waiting = setInterval(function(){
		        		if(!wait){
		        			clearInterval(waiting);
		        			currentChatId = chat._id;
			       			callback(null, chat);
			       		}
		        	}, 250);
		        });
		    },
		    function(chat, callback) {
		    	console.log('8****** NO');
		    	var result = [];
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ username: message.owner }, function(err2, user){
		      			result.push({ order: message.id, 
		      						  name : user.name,
		      						  isOwner: message.owner == currentUser ? true : false,
		      						  msg : message.message, 
		      						  date : util.formatDate('MM/dd hh:mm:ss', message.datetime)
		      						});
		      			return innerCallback(); 
					});
				}, function (err) {
					  if (err) console.error(err);
					  callback(null, result);
				});
		    }
		], function (err, result) {
			result = util.sortListById(result, 'asc');
		    response.json(result);
		});
	});

	//PUBLIC
	router.get('/mean/api/get/main-chat', function(request, response, next) {
		async.waterfall([
		    function(callback) {
		    	chatDto.findOne({"name" : 'global-chat'}, function(err, chat){
		        	if(err) response.send(err);
		        	currentChatId = chat._id;
		        	callback(null, chat);
		        });
		    },
		    function(chat, callback) {
		    	var result = [];
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ 'username': message.owner }, function(err2, user){
						result.push({	order: message.id, 
		      						 	name : user.name, 
		      						 	msg : message.message, 
		      						 	date : util.formatDate('MM/dd hh:mm:ss', message.datetime)
		      						});		      			
						return innerCallback(); 
					});
				}, function (err) {
					  if (err) console.error(err);
					  callback(null, result);
				});
		    }
		], function (err, result) {
			result = util.sortListById(result, 'asc');
		    response.json(result);
		});
	});

	//LISTENERS & EMITERS
	var nicknames = {};
	io.sockets.on('connection', function(socket){

		socket.on('user:typing', function(data){
			io.sockets.emit('user:status', { name: socket.userLogged.name, isTyping: data});
		});

		socket.on('message:send', function(client_message){
			async.waterfall([
				function(callback) {
					var query = [{ $match: { _id: currentChatId} }, { $project:{ total:{ $size: "$messages" }}}];
					chatDto.aggregate(query, function(err, count){
						var message = {
							id: (count[0].total + 1),
							message: client_message.message,
							owner: socket.userLogged.username,
							to: client_message.type == 1 ? [] : [client_message.selectedUser],
							seen: false,
							datetime: new Date()
						};
						callback(null, message);
					});
				},
				function(message, callback) {
					chatDto.findByIdAndUpdate(currentChatId, {$push: { messages: message }}, { new: true }, function (err, chat) {
			 			if (err) return console.error(err);
			 			callback(null, 'Success');
			 		});
				}
			], function (err, result) {
				if (err) return console.error(err);
			    io.sockets.emit('message:new', {msg: client_message.message, name: socket.userLogged.name, date: util.formatDate('MM/dd hh:mm:ss', new Date())});
			});
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
			io.sockets.emit('user:list', nicknames);
		}
	});
	return router;
};