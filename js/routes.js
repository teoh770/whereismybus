var wheresMyBus = wheresMyBus || {};

wheresMyBus.Routes = {
		
	    /* routes
		 * - start
		 * 		- placeName
		 * 		- placeCode
		 * 		- lat
		 * 		- lng
		 * - end
		 * 		- placeName
		 * 		- placeCode
		 * 		- lat
		 * 		- lng
		 * - options
		 * 		- busStopCode
		 * 		- busStopName
		 * 		- distance
		 * 		- directions
		 * 			- from
		 * 			- instructions
		 * 			- distance
		 * 			- mode
		 * 		- buses
		 * 			- busNumber
		 * 			- eta
		 * 			- lastDestination
		 * 			- lat
		 * 			- lng
		 * 		- interchanges
		 * 			- lat
		 * 			- lng
		 * */
		
		init: function(){
			this.start = new Object();
			this.start.officialId = "";
		    this.start.placeName = "";
		    this.start.placeCode = "";
		    this.start.lat = "";
		    this.start.lng = "";
		    
		    this.end = new Object();
		    this.end.officialId = "";
		    this.end.placeName = "";
		    this.end.placeCode = "";
		    this.end.lat = "";
		    this.end.lng = "";		    		   
		    
		    this.options = new Array(); // array of Option		    
	    },
	    
	    Option: function(){
	    	this.startBusStopCode = "";
	    	this.startBusStopName = "";
	    	this.distance = 0;
	    	this.measurement = "km";
	    	this.duration = "";
	    	
	    	this.directions = new Array(); // array of Directions
	    	this.buses = new Array(); // array of Bus
	    	this.interchanges = new Array(); // array of Interchange
	    },
	    
	    Direction: function(){
	    	this.fromName = "";
	    	this.from = "";
	    	this.fromLat = "";
	    	this.fromLng = "";
	    	this.toLat = "";
	    	this.toLng = "";
	    	this.toName = "";
	    	this.instructions = "";
	    	this.distance = "";
	    	this.measurement = "km";
	    	this.mode = "";
	    	this.duration = "";
	    	this.towards = "";
	    },
	    
	    Bus: function(){
	    	this.busNumber = "";
	    	this.eta = "";
	    	this.lastDestination = "";
	    	this.lat = "";
	    	this.lng = "";
	    	
	    	this.feature = "";
	    	this.load = "";
	    	this.operator = "";
	    	this.status = "";
	    	this.headingToDirection = "";
	    	this.currBusDirection = "";
	    	this.directionMode = "";
	    },
	    
	    Interchange: function(){
	    	this.placeCode = "";
	    	this.placeName = "";
	    	this.lat = "";
	    	this.lng = "";
	    	
	    	this.arrival_stop_lat = "";
	    	this.arrival_stop_lng = "";
	    	this.arrival_stop_name = "";
            this.arrival_time = "";
	    	
	    	this.departure_stop_lat = "";
	    	this.departure_stop_lng = "";
	    	this.departure_stop_name = "";
	    	this.departure_time = "";
	    	
	    	this.headsign = "";
            this.headway = "";
            this.line = "";
            this.vehicle = "";
            this.num_stops = "";
	    }	    
}
