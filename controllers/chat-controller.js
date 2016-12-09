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
	var globalChatId = "";

	//CALLBACKS
	router.get('/mean/api/get', function(request, response, next) {
		response.json("Hola Mundo");
	});

	router.get('/mean/api/getUser', function(request, response, next) {
		response.json(request.session.userSession);
	});

	// ROOM CHAT - PRIVATE
	router.get('/mean/api/roomChat', function(request, response, next) {
		var currentUser = request.session.userSession.username;
		var selectedUser = 'cronaldo';//request.query.selectedUser;
		async.waterfall([
		    function(callback) {
		    	chatDto.findOne({"owner" : { $in:[currentUser, selectedUser]}}, function(err, chat){
		        	if(err) response.send(err);
		        	globalChatId = chat._id;
		        	callback(null, chat);
		        });
		    },
		    function(chat, callback) {
		    	var result = [];
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ 'username': message.owner }, function(err2, user){
		      			result.push({	order: message.id, 
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

	// MAIN CHAT - PUBLIC
	router.get('/mean/api/mainChat', function(request, response, next) {
		async.waterfall([
		    function(callback) {
		    	chatDto.findOne({"name" : 'global-chat'}, function(err, chat){
		        	if(err) response.send(err);
		        	globalChatId = chat._id;
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

	//SOCKET LISTENERS
	var nicknames = {};
	io.sockets.on('connection', function(socket){
		socket.on('user:typing', function(data){
			io.sockets.emit('user:status', { name: socket.userLogged.name, isTyping: data});
		});

		socket.on('message:send', function(data){
			async.waterfall([
				function(callback) {
					chatDto.aggregate([{$project:{total:{$size:"$messages"}}}], function(err, result){
						var message = {
							id: (result[0].total + 1),
							message: data,
							owner: socket.userLogged.username,
							seen: false,
							datetime: new Date()
						};
						callback(null, message);
					});
				},
				function(message, callback) {
					chatDto.findByIdAndUpdate(globalChatId, { $push: { messages: message }}, { new: true }, function (err, chat) {
			 			if (err) return console.error(err);
			 			callback(null, 'Success');
			 		});
				}
			], function (err, result) {
				if (err) return console.error(err);
			    io.sockets.emit('message:new', {msg: data, name: socket.userLogged.name, date: dateFormat.asString('MM/dd hh:mm:ss', new Date())});
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


function fillTransaction(code, msg, result){
	transaction.code = code;
	transaction.message = msg;
	transaction.result = result;
}
