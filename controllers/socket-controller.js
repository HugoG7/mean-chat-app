//SOCKET CHAT CONTROLLER
var dateFormat = require('date-format');
module.exports = function(socketio){
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
};