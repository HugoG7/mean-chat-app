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
  	$scope.chat = { message: '', input: ''};

  	$http.get('/chat/mean/api/getUser')
	.success(function(data){
		$cookies.put('currentSession', JSON.stringify(data));
		socket.emit('user:login', data, function(data){
			//do somenthing
		});
	}).error(function(data){
		console.log('Error: ' + data);
	});

	$http.get('/chat/mean/api/mainChat')
	.success(function(data){
		loadMainChat(data);
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
		var currentUser = JSON.parse($cookies.get('currentSession'));
		console.log(currentUser);
		$http.get('/chat/mean/api/roomChat',  {params:{ currentUser: currentUser.username, selectedUser: selectedUser}})
		.success(function(data){
			console.log(data);
		}).error(function(data){
			console.log('Error: ' + data);
		});
	}


	function loadMainChat(messages){
		angular.forEach(messages, function(value, key) {
		  $scope.chat.message += '<strong>' + value.name  + '|' + value.date + '</strong> -' + value.msg + '<br />';
		}, null);
	}
}]);

