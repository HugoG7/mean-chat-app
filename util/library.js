var Library = (function (){
	var Util = function(){};
	Util.prototype = {
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