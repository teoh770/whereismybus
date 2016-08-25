var wheresMyBus = wheresMyBus || {};

wheresMyBus.Api = {
		
		ping: function(auditData){
			var self = this;
			var deferred = $.Deferred();
			
			var jsonObj = new Object();
			jsonObj.auditData = auditData;
			jsonObj.device = wheresMyBus.Util.getDeviceDetails();
			var jsonData = JSON.stringify(jsonObj);
			$.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "ping",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                	var results = jQuery.parseJSON(response);                 	
                	if(results.errorCode){
                		wheresMyBus.Util.errorHandler(results);
                	}
                	else{
                    	deferred.resolve(results);
                	}
                },
                error: function(jqXHR, textStatus, errorThrown){
                	deferred.resolve(null);	                	
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		},
		
		getPlaces: function(city, country, auditData){
			var self = this;
			var deferred = $.Deferred();
			
			var jsonObj = new Object();
			jsonObj.city = city;
			jsonObj.country = country;
			jsonObj.auditData = auditData;
			jsonObj.device = wheresMyBus.Util.getDeviceDetails();
			var jsonData = JSON.stringify(jsonObj);
			$.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "getPlaces",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                	var results = jQuery.parseJSON(response);                 	
                	if(results.errorCode){
                		wheresMyBus.Util.errorHandler(results);
                	}
                	else{
                    	deferred.resolve(results);
                	}
                },
                error: function(jqXHR, textStatus, errorThrown){
                	deferred.resolve(null);	                	
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		},
		
		getNearestPlaces: function(lat, lng, auditData, suppressError){
			var self = this;
			var deferred = $.Deferred();
			
			var jsonObj = new Object();
			jsonObj.lat = lat;
			jsonObj.lng = lng;
			jsonObj.auditData = auditData;
			jsonObj.device = wheresMyBus.Util.getDeviceDetails();			
			var jsonData = JSON.stringify(jsonObj);			
            $.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "getNearestPlaces",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                	var results = jQuery.parseJSON(response);                 	
                	if(results.errorCode){
                		if(suppressError){
                			deferred.resolve(null);
                		}
                		else{
                			wheresMyBus.Util.errorHandler(results);
                		}
                	}
                	else{             	
                    	deferred.resolve(results);
                	}
                },
                error: function(jqXHR, textStatus, errorThrown){
                	deferred.resolve(null);
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		},
		
		storeRecommendedRoute: function(arrFromPlace, arrToPlace, recommendedRoute, recommendedOption){
			var self = this;
			var deferred = $.Deferred();
			
			var jsonObj = new Object();
			jsonObj.arrFromPlace = arrFromPlace;
			jsonObj.arrToPlace = arrToPlace;
			jsonObj.recommendedRoute = recommendedRoute;
			jsonObj.recommendedOption = recommendedOption;
			jsonObj.device = wheresMyBus.Util.getDeviceDetails();
			var jsonData = JSON.stringify(jsonObj);			
            $.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "storeRecommendedRoute",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                },
                error: function(jqXHR, textStatus, errorThrown){
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		},
		
		getRecommendedRoute: function(fromOfficialId, toOfficialId, auditData){
			var self = this;
			var deferred = $.Deferred();
			
			var jsonObj = new Object();
			jsonObj.fromOfficialId = fromOfficialId;
			jsonObj.toOfficialId = toOfficialId;
			jsonObj.auditData = auditData;
			jsonObj.device = wheresMyBus.Util.getDeviceDetails();
			var jsonData = JSON.stringify(jsonObj);			
            $.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "getRecommendedRoute",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                	var results = jQuery.parseJSON(response);                 	
                	if(results.errorCode){
                		deferred.resolve(null);
                	}
                	else{             	
                    	deferred.resolve(results);
                	}
                },
                error: function(jqXHR, textStatus, errorThrown){
                	deferred.resolve(null);
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		},
		
		storeAuditTrail: function(auditTrailObj, otherObj){
			var self = this;
			var deferred = $.Deferred();	    
		    
			var newAuditTrailObj = new Object();
			newAuditTrailObj.auditObject = auditTrailObj;
			if(otherObj){
				newAuditTrailObj.other = otherObj;
			}			
			var jsonData = JSON.stringify(newAuditTrailObj);
            $.ajax({
            	url: wheresMyBus.Properties.serverUrl + wheresMyBus.Properties.apiPath + wheresMyBus.Properties.wsPath + "storeAuditTrail",
                type: "post",
                contentType: "application/json",
                data: jsonData,
                dataType: "text",
                xhrFields: {withCredentials: true},
                success: function(response, textStatus, jqXHR){
                },
                error: function(jqXHR, textStatus, errorThrown){
                },
                complete: function(){
                	
                },
                timeout: 30000 // sets timeout to 30 seconds
            });
			
			return deferred.promise();
		}
}