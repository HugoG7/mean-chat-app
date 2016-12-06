//INIT ANGULAR CONTROLLER
var myapp = angular.module('meanChat-Chat', ['ngSanitize']);

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

myapp.controller('chatController', ['$scope', '$http', 'socket', function($scope, $http, socket) {
  	$scope.chat = { message: '', input: ''};

  	$http.get('/chat/mean/api/getUser')
	.success(function(data){
		console.log(data);
		socket.emit('user:login', data, function(data){
			//do somenthing
		});
	}).error(function(data){
		console.log('Error: ' + data);
	});

	socket.on('message:new', function(data){
		$scope.chat.message += '<strong>' + data.name  + '|' + data.date + '</strong> -' + data.msg + '<br />';
	});

	socket.on('user:list', function(data){
		$scope.chat.userList = [];
		for(var username in data){
			$scope.chat.userList.push(username);
		}
	});


	$scope.sendMessage = function(){
		$scope.chat.message += 'Se envia mensaje <br />';
		if($scope.chat.input != '')
			socket.emit('message:send', $scope.chat.input);
		$scope.chat.input = '';
	}
}]);