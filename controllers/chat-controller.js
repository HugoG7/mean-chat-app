//INIT login-controller.js
var async = require('async');
var dateFormat = require('date-format');
var transaction = {};
module.exports = function(app, mongoose, io){
	var router = app.Router();

	//CREATE DB SCHEMA FOR LOGIN
	var Schema = mongoose.Schema;
	var chatSchema = new Schema({
		name: String,
		type: String,
		owner: String,
		messages: [{ 
					id: Number,
					message: String,
					owner: String,
					to: [String],
					seen: Boolean,
					datetime: Date,
				  }]
	}, { versionKey: false });
	//MOONGOSE PLURALIZE THE NAMES THATS MEANS chat = chats, so we override the collection add 3rd param 'chat'
	var chatDto = mongoose.model('chat', chatSchema, 'chat');
	var userDto = mongoose.model('users');

	//CALLBACKS
	router.get('/mean/api/getUser', function(request, response, next) {
		response.json(request.session.userSession);
	});

	router.get('/mean/api/mainChat', function(request, response, next) {
		async.waterfall([
		    function(callback) {
		    	chatDto.findOne({"name" : 'global-chat'}, function(err, chat){
		        	if(err) response.send(err);
		        	callback(null, chat);
		        });
		    },
		    function(chat, callback) {
		    	var result = [];
		      	async.forEachOf(chat.messages, function (message, index, innerCallback) {
		      		userDto.findOne({ 'username': message.owner }, function(err2, user){
		      			result.push({name : user.name, msg : message.message, date : dateFormat.asString('MM/dd hh:mm:ss', message.datetime)});
		      			return innerCallback(); 
					});
				}, function (err) {
					  if (err) console.error(err);
					  callback(null, result);
				});
		    }
		], function (err, result) {
		    response.json(result);
		});
	});

	//SOCKET LISTENERS
	var nicknames = {};
	io.sockets.on('connection', function(socket){
		socket.on('message:send', function(data){
			io.sockets.emit('message:new', {msg: data, name: socket.userLogged.name, date: dateFormat.asString('MM/dd hh:mm:ss', new Date())});
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
