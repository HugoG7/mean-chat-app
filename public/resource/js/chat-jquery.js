$(function(){
	var socket = io.connect();
	var chat = $('#chat');
	var form = $('#formMessage');
	var message = $('#message');
	var users = $('#lsUsers');

	$.ajax({
			type: 'GET',
			url: '/chat/mean/api/getUser',
			error: function(err){
				console.log(err);
			},
			success: function(data){
				loadUser(data);
			}
	});

	socket.on('message:new', function(data){
		chat.append('<strong>' + data.name  + '|' + data.date + '</strong> -' + data.msg + '<br />');
	});

	socket.on('user:list', function(data){
		var usernamesString = "";
		for(var username in data){
			usernamesString += "<li>" + username + "</li>";
		}
		users.empty();
		users.append(usernamesString);
	});


	form.submit(function(request){
		request.preventDefault();
		if(message.val() != '')
			socket.emit('message:send', message.val());
		message.val('');
	});


	function loadUser(data){
		socket.emit('user:login', data, function(data){
			//do somenthing
		});
	}
});	