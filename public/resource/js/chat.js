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
  	$scope.chat = { message: '', input: '', room: '', enabledMainChat: true};

  	$http.get('/chat/mean/api/getUser')
	.success(function(data){
		//$cookies.put('currentSession', JSON.stringify(data));
		socket.emit('user:login', data, function(data){
			//do somenthing
		});
	}).error(function(data){
		console.log('Error: ' + data);
	});

	$http.get('/chat/mean/api/mainChat')
	.success(function(data){
		loadChatOnPanel(data);
	}).error(function(data){
		console.log('Error: ' + data);
	});

	socket.on('message:new', function(data){
		$scope.chat.message += '<strong>' + data.name  + '|' + data.date + '</strong> -' + data.msg + '<br />';
	});

	$scope.sendMessage = function(){
		if($scope.chat.input != '')
			socket.emit('message:send', $scope.chat.input);
		$scope.chat.input = '';
	}

	socket.on('user:list', function(data){
		$scope.chat.userList = [];
		for(var username in data){
			$scope.chat.userList.push(username);
		}
	});

	socket.on('user:status', function(data){
		if(data.isTyping)
			$scope.chat.typing = '<strong>' + data.name  + ':</strong> is typing...';
		else
			$scope.chat.typing = '';
	});

	$scope.onTyping = function(event){
		socket.emit('user:typing', true);
	}

	$scope.onTypingOut = function(event){
		socket.emit('user:typing', false);
	}

	$scope.onSelectUser = function(event, selectedUser){
		//var currentUser = JSON.parse($cookies.get('currentSession'));
		$http.get('/chat/mean/api/roomChat',  {params:{selectedUser: selectedUser}})
		.success(function(data){
			$scope.chat.enabledMainChat = false;
			loadChatOnPanel(data);
		}).error(function(data){
			console.log('Error: ' + data);
		});
	}


	function loadChatOnPanel(messages){
		var logMessage = '';
		angular.forEach(messages, function(value, key) {
		  	logMessage += '<strong>' + value.name  + '|' + value.date + '</strong> -' + value.msg + '<br />';
		}, null);

		if($scope.chat.enabledMainChat)
			$scope.chat.message = logMessage;
		else
			$scope.chat.room = logMessage;
	}
}]);

