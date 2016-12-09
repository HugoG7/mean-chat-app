var dateFormat = require('date-format');
var Library = (function (){
	var Util = function(){};
	Util.prototype = {
			formatDate: function(date, format){
				return dateFormat.asString(format, date);
			},
			sortListById: function(array, order){
				array.sort(function(a, b){
					if(order === 'asc')
						return a.order - b.order; 
					else
						return b.order - a.order; 
				});
				return array;
			}
	};

	return {
		Util : Util
	};
});

module.exports = { Library : Library };