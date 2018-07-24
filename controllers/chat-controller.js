//INIT login-controller.js
var library = new require('../util/library.js').Library();
var async = require('async');
var util = new library.Util();
var transaction = {};

/**** MODULE ****/
module.exports = function(app, mongoose, io){
	var router = app.Router();

	//CREATE DB SCHEMA FOR LOGIN
	var Schema = mongoose.Schema;
	var chatSchema = new Schema({
		name: String,
		type: String,
		owners: [String],
		messages: [{ 
					_id: false,
					id: Number,
					message: String,
					owner: String,
					recipients: [{ _id: false, to: String, seen: Boolean, seenDate: Date }],
					created: Date,
				  }]
	}, { versionKey: false });

	//MOONGOSE PLURALIZE THE NAMES THATS MEANS chat = chats, so we override the collection add 3rd param 'chat'
	var userDto = mongoose.model('users');
	var chatDto = mongoose.model('chat', chatSchema, 'chat');
	var nicknames = [ /* { username: username, name: name, online: true, lastConnection: date } */ ];

	if(nicknames.length <= 0){
		userDto.find({/*username:{ $not: userSession.username },*/enabled : true }, 'name username email lastConnection', function(error, users){
			if (error) console.error(error);
			for(var i = 0; i < users.length; i++){
				nicknames.push({
					name : users[i].name,
					username : users[i].username,
					online : false,
					lastConnection : users[i].lastConnection
				});
			}
		});
	}

	/***** CALLBACKS *****/
	//GET USER LOGGED
	router.get('/mean/api/get/session', function(request, response, next) {
		response.json(request.session.userSession);
	});

	//PUBLIC CHAT
	router.get('/mean/api/get/public-chat', function(request, response, next) {
		async.waterfall([
		    function(callback) {
		    	chatDto.findOne({"name" : 'global-chat'}, function(err, chat){
		        	if(err) response.send(err);
		        	callback(null, chat);
		        });
		    },
		    function(chat, callback) {
		    	var result = { name: chat.name, chat: []};
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ 'username': message.owner }, function(err2, user){
						result.chat.push({	order: message.id, 
		      						 		name : user.name, 
		      						 		msg : message.message, 
		      						 		date : util.formatDate('MM/dd hh:mm:ss', message.created)
		      						});		      			
						return innerCallback(); 
					});
				}, function (err) {
					  if (err) console.error(err);
					  callback(null, result);
				});
		    }
		], function (err, result) {
			result.chat = util.sortListById(result.chat, 'asc');
		    response.json(result);
		});
	});

	//PRIVATE CHAT
	router.get('/mean/api/get/private-chat', function(request, response, next) {
		var currentChatId = "";
		var currentUser = request.session.userSession.username;
		var selectedUser = request.query.selectedUser;
		async.waterfall([
		    function(callback) {
		    	var wait = true;
		    	chatDto.findOne({ owners : { $size: 2, $all: [currentUser, selectedUser]}}, function(err, chat){
		        	if(err) response.send(err);
		        	if(chat == null || chat == 'undefained'){
		        		chatDto.create({name: [currentUser, selectedUser].join('-'), type: 'private', owners: [currentUser, selectedUser]}, 
		        			function(err, newChat){
		        			if(err) response.send(err);
		        			chat = newChat;
		        			wait = false;
		        		});
		        	}else{
		        		wait = false;
		        	}
		        	// WORKAROUND TO NOT USE ASYNC
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
		    	var result = { name: chat.name, chat: []};
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ username: message.owner }, function(err2, user){
		      			result.chat.push({ 
		      							order: message.id, 
		      						  	name : user.name,
		      						  	isOwner: message.owner == currentUser ? true : false,
		      						  	msg : message.message, 
		      						  	date : util.formatDate('MM/dd hh:mm:ss', message.created)
		      						});
		      			return innerCallback(); 
					});
				}, function (err) {
					  if (err) console.error(err);
					  callback(null, result);
				});
		    }
		], function (err, result) {
			result.chat = util.sortListById(result.chat, 'asc');
		    response.json(result);
		});
	});

	//SOCKET [LISTENERS, EMITERS]
	io.sockets.on('connection', function(socket){

		socket.on('disconnect', function(data){
			if(!socket.sessionUser) return;
			util.updateByProperty(nicknames, { property: 'username', value: socket.sessionUser.username }, 
								 [{ property: 'online', value: false }, { property: 'lastConnection', value: new Date() }]);
			updateLastConnection(socket.sessionUser.username);
			updateNickNames();
		});

		socket.on('message:send', function(client_message){
			var currentChatId = "";
			async.waterfall([
				function(callback) {
					var message = {
							message: client_message.message,
							owner: socket.sessionUser.username,
							created: new Date(),
							recipients: []
					};

					var query = [{ $match: { name: client_message.chatName } }, { $project: { total: { $size: "$messages" }, owners: 1}}];
					chatDto.aggregate(query, function(err, result){
						currentChatId = result[0]._id;
						message.id =  result[0].total + 1;
						for(var i = 0; i < result[0].owners.length; i++){
							if(result[0].owners[i] != null && result[0].owners[i] !== socket.sessionUser.username){
								message.recipients.push({to: result[0].owners[i], seen: false});
							}
						}
						callback(null, message);
					});
				},
				function(message, callback) {
					chatDto.findByIdAndUpdate(currentChatId, { $push: { messages: message }}, { new: true }, function (err, chat) {
			 			if (err) return console.error(err);
			 			callback(null, 'Success');
			 		});
				}
			], function (err, result) {
				if (err) return console.error(err);
				var response = { name: client_message.chatName, chat: []};
				response.chat.push({ msg: client_message.message, 
			    					 name: socket.sessionUser.name,
			    					 date: util.formatDate('MM/dd hh:mm:ss', new Date())});
			    io.sockets.emit('message:new', response);
			});
		});

		socket.on('user:login', function(user){
			socket.sessionUser = user;
			util.updateByProperty(nicknames, { property: 'username', value: user.username }, 
								 [{ property: 'online', value: true }, { property: 'lastConnection', value: new Date() }]);
			//updateLastConnection(user.username); // QUITAR NO NECESARIO
			updateNickNames();
		});

		socket.on('user:typing', function(chat){
			io.sockets.emit('user:status', { name: socket.sessionUser.name, isTyping: chat.isTyping, chatName: chat.chatName });
		});

		function updateNickNames(){
			io.sockets.emit('user:list', nicknames);
		}

		function updateLastConnection(username){
			userDto.update({username: username}, { $set: { lastConnection: new Date()}}, function(err){
				if(err) console.error(err);
			});
		}
	});
	return router;
};