//INIT login-controller.js
var transaction = {};
module.exports = function(app, mongoose){
	var router = app.Router();

	//CREATE DB SCHEMA FOR LOGIN
	var Schema = mongoose.Schema;
	var userSchema = new Schema({
		name: String,
		username: String,
		password: String,
		email: String,
		lastConnection: Date 
	}, { versionKey: false });
	var userDto = mongoose.model('users', userSchema);

	//CALLBACKS
	router.post('/mean/api/login', function(request, response, next) {
		userDto.findOne({ 'username': request.body.username }, function(err, user){
			if(err) response.send(err);
			if(user != null && user.password === request.body.password){
				fillTransaction(1, 'Login Success', user);
				request.session.userSession = user;
			}else{
				fillTransaction(0, 'Login Failed', null);
			}

			response.json(transaction);
		});
	});

	return router;
}

function fillTransaction(code, msg, result){
	transaction.code = code;
	transaction.message = msg;
	transaction.result = result;
}