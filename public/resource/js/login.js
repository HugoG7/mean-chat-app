//INIT ANGULAR MODULE
angular.module('meanChat-Login', []);

function loginController($scope, $http, $window){
	$scope.login = {};

	$scope.doLogin = function(){
		$http.post('/mean/api/login', $scope.login)
		.success(function(data){
			$scope.result = data;
			console.log(data);
		}).error(function(data){
			console.log('Error: ' + data);
		});
	}

	$scope.goToHome = function(){
		$window.location = '/room/home';
	}
}