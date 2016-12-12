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
  	$scope.chat = { input: '', messages: '', type: 1, selectedUser: '', currentUser: ''};

  	/** LOAD USER IN SESSION **/
  	$http.get('/chat/mean/api/get/user')
	.success(function(user){
		//$cookies.put('currentSession', JSON.stringify(data)); - Save variables in cookies (for json use stringify)
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
		buildChatByType(chat);
	})
	.error(function(error){
		console.log('Error: ' + error);
	});


	/** SEND MESSAGE TO THE CHAT  **/
	$scope.sendMessage = function(){
		if($scope.chat.input != ''){
			socket.emit('message:send', { message: $scope.chat.input,
										  type: $scope.chat.type,
										  selectedUser: $scope.chat.selectedUser });
		}
		$scope.chat.input = '';
	}

	socket.on('message:new', function(data){
		$scope.chat.messages += '<strong>' + data.name  + '|' + data.date + '</strong> -' + data.msg + '<br />';
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
				buildChatByType(chat);
			})
			.error(function(error){
				console.log('Error: ' + error);
			});
		}else{
			$scope.chat.selectedUser = selectedUser;
			$http.get('/chat/mean/api/get/private-chat', { params:{ selectedUser: $scope.chat.selectedUser }} )
			.success(function(chat){
				$scope.chat.type = 2;
				buildChatByType(chat);
			})
			.error(function(error){
				console.log('Error: ' + error);
			});
		}

		var element = angular.element('#lsUsers > li');
		element.removeClass('active');
		$(event.target).addClass('active');
	}

	function buildChatByType(messages){
		var logMessage = '';
		angular.forEach(messages, function(value, key) {
		  	logMessage += '<strong>' + value.name  + '|' + value.date + '</strong> -' + value.msg + '<br />';
		}, null);

		$scope.chat.messages = logMessage;
	}
}]);