//INIT login-controller.js
var express = require('express');
var mongoose = require('mongoose');
var router = express.Router();

var transaction = {};

//INIT DATABASE INSTANCE

//CREATE DB SCHEMA FOR LOGIN
var Schema = mongoose.Schema;

console.log('entro');

//CALLBACKS
router.get('/mean/api/getUser', function(request, response, next) {
	response.json(request.session.userSession);
});


function fillTransaction(code, msg, result){
	transaction.code = code;
	transaction.message = msg;
	transaction.result = result;
}

module.exports = router;
