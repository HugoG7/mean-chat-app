var dateFormat = require('date-format');
var Library = (function (){
	var Util = function(){};
	Util.prototype = {
			updateByProperty: function(array, condition, newValue){
				if(array != null && array.length > 0){
					for(var i = 0; i < array.length; i++){
						if(array[i][condition.property] == condition.value){
							for(var j = 0; j < newValue.length; j++){
								array[i][newValue[j].property] = newValue[j].value;
							}
							return true;
						}
					}
				}
				return false;
			},
			findByProperty: function(array, property, value){
				if(array != null && array.length > 0){
					for(var i = 0; i < array.length; i++){
						if(array[i][property] == value)
							return array[i];
					}
				}

				return null;
			},
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