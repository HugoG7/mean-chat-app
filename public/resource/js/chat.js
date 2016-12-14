//INIT ANGULAR CONTROLLER
var myapp = angular.module('meanChat-Chat', ['ngSanitize','ngCookies']);

myapp.factory('socket', ['$rootScope', function($rootScope){
	var socket = io.connect();

	return {
		on: function(eventName, callback){
			socket.on(eventName, function(){
				var args = arguments;
				$rootScope.$apply(function(){
					callback.apply(socket, args);
				});
			});
		},
		emit: function(eventName, data, callback){
			socket.emit(eventName, data, function(){
				var args = arguments;
				$rootScope.$apply(function(){
					if(callback){
						callback.apply(socket, args);
					}
				});
			});
		}
	};
}]);

myapp.controller('chatController', ['$scope', '$http', '$cookies', 'socket', function($scope, $http, $cookies, socket) {
  	$scope.chat = { currentUser: '', input: '', chats: [ /*{ name: '', messages: '', enabled: false }*/ ]};

  	/** LOAD USER IN SESSION **/
  	$http.get('/chat/mean/api/get/user')
	.success(function(user){
		$scope.chat.currentUser = user.username;
		socket.emit('user:login', user);
	})
	.error(function(error){ 
		console.log('Error: ' + error);
	});

	socket.on('user:list', function(users){
		$scope.chat.userList = [];
		for(var username in users){
			$scope.chat.userList.push(username);
		}
	});

	/** LOAD MAIN CHAT **/
	$http.get('/chat/mean/api/get/main-chat')
	.success(function(chat){
		buildChat(chat);
	})
	.error(function(error){
		console.log('Error: ' + error);
	});


	/** SEND MESSAGE TO THE CHAT  **/
	$scope.sendMessage = function(){
		if($scope.chat.input != ''){
			socket.emit('message:send', { message: $scope.chat.input,
										  chatName:	$scope.chat.chats[getCurrentChat($scope.chat.chats)].name
										});
		}
		
		$scope.chat.input = '';
	}

	socket.on('message:new', function(message){
		AddMessageToChat(message);
	});

	/** HANDLE OF TYPING STATUS  **/
	$scope.onTyping = function(event){
		socket.emit('user:typing', true);
	}

	$scope.onTypingOut = function(event){
		socket.emit('user:typing', false);
	}

	socket.on('user:status', function(data){
		if(data.isTyping)
			$scope.chat.typing = '<strong>' + data.name  + ':</strong> is typing...';
		else
			$scope.chat.typing = '';
	});

	/** EVENT TO SELECTED A USER  **/
	$scope.onSelectChat = function(event, selectedUser, isMain){
		//var currentUser = JSON.parse($cookies.get('currentSession')); - Get cookie object value (for json use parse)
		if($(event.target).hasClass('disabled'))
			return false;

		if(isMain){
			$http.get('/chat/mean/api/get/main-chat')
			.success(function(chat){
				buildChat(chat);
			})
			.error(function(error){
				console.log('Error: ' + error);
			});
		}else{
			$http.get('/chat/mean/api/get/private-chat', { params:{ selectedUser: selectedUser }} )
			.success(function(chat){
				buildChat(chat);
			})
			.error(function(error){
				console.log('Error: ' + error);
			});
		}

		var element = angular.element('#lsUsers > li');
		element.removeClass('active');
		$(event.target).addClass('active');
	}

	function buildChat(newChat){
		var statusChat = existChat(newChat.name, $scope.chat.chats);
		if(!statusChat.exist){
			statusChat.index = ($scope.chat.chats.push({ name: newChat.name })) - 1;
		}

		var logMessage = '';
		angular.forEach(newChat.chat, function(value, key) {
		  	logMessage += '<strong>' + value.name  + '|' + value.date + '</strong> -' + value.msg + '<br />';
		}, null);

		turnOffAllChats($scope.chat.chats);
		$scope.chat.chats[statusChat.index].enabled = true;
		$scope.chat.chats[statusChat.index].messages = logMessage;
	}

	function AddMessageToChat(newMessage){
		var statusChat = existChat(newMessage.name, $scope.chat.chats);
		if(!statusChat.exist){
			//NO HACER NADA YA O UNA BANDERA DE ALERTA 
			alert('Tienes un nuevo mensaje');
			return false;
		}

		if(!$scope.chat.chats[statusChat.index].enabled){
			//NO HACER NADA YA O UNA BANDERA DE ALERTA 
			alert('Tienes un nuevo mensaje');
			return false;
		}

		var logMessage = $scope.chat.chats[statusChat.index].messages;
		angular.forEach(newMessage.chat, function(value, key) {
		  	logMessage += '<strong>' + value.name  + '|' + value.date + '</strong> -' + value.msg + '<br />';
		}, null);

		$scope.chat.chats[statusChat.index].messages = logMessage;
	}
}]);

var global;

function existChat(name, chats){
	var status = { exist: false, index: -1};
	for(var i = 0; i < chats.length; i++){
		if(chats[i].name == name){
			status.exist = true;
			status.index = i;
			break;
		}
	}
	return status;
}

function turnOffAllChats(chats){
	for(var i = 0; i < chats.length; i++){
		chats[i].enabled = false;
	}
}

function getCurrentChat(chats){
	var index = -1;
	for(var i = 0; i <= chats.length; i++){
		if(chats[i].enabled){
			index = i;
			break;
		}
	}
	return index;
}