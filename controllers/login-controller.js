//INIT login-controller.js
var express = require('express');
var mongoose = require('mongoose');
var async = require('async');
var router = express.Router();

var transaction = {};

//INIT DATABASE INSTANCE
mongoose.connect("mongodb://localhost:27017/mean-chat");

//CREATE DB SCHEMA FOR LOGIN
var Schema = mongoose.Schema;
var userSchema = new Schema({
	name: String,
	username: String,
	password: String,
	email: String,
}, { versionKey: false });
var userDto = mongoose.model('users', userSchema);

//CALLBACKS
router.post('/mean/api/login', function(request, response, next) {
	userDto.findOne({ 'name': request.body.username }, function(err, user){
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


function fillTransaction(code, msg, result){
	transaction.code = code;
	transaction.message = msg;
	transaction.result = result;
}

module.exports = router;
