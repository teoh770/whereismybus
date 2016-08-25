var wheresMyBus = wheresMyBus || {};

wheresMyBus.Util = {
			
		generateUUID : function () {
	    	var d = new Date().getTime();
	        var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				            var r = (d + Math.random()*16)%16 | 0;
				            d = Math.floor(d/16);
				            return (c=='x' ? r : (r&0x7|0x8)).toString(16);
				        });
	        return uuid;
	    },
	    
		alertHandler: function(title, message){
	    	if (navigator.notification) {
	    		navigator.notification.alert(
	                    message,
	                    null,
	                    title,
	                    'OK' // buttonName
	                );
	        }
	    	else{
	    		alert(message);
	    	}
	    },

	    errorHandler: function(errorObj) {
	    	wheresMyBus.Util.hideLoading();
			
	    	if(errorObj){
	    		if(errorObj.errorCode == ""){
	    			wheresMyBus.Util.alertHandler("Opps", errorObj.errorMessage);
	    		}
	    		else if(errorObj.errorCode == "401"){
	    			wheresMyBus.Util.alertHandler("Opps", errorObj.errorMessage);
	    		}
	    		else if(errorObj.errorCode == "406"){
	    			wheresMyBus.Util.alertHandler("Opps", errorObj.errorMessage);
	    		}
	    		else if(errorObj.errorCode == "cannotLoadFromServer"){
	    			wheresMyBus.Util.alertHandler("Opps", "Connection problem. Please try again.");
	    		}
	    	}
	    	else{
	    		wheresMyBus.Util.alertHandler("Opps", "Please try again.");
	    	}
	    },
		
	    showMapOverlay: function(){
			$("#map-overlay").show();
		},
		
		hideMapOverlay: function(){
			$("#map-overlay").hide();
		},
		
		showLoading: function(message){
			if(message){
				$("#spinner").addClass("with-message");
				$("#spinner.with-message .message").text(message);
			}
			else{
				$("#spinner").removeClass("with-message");
				$("#spinner .message").text("");
			}
			
			$("#overlay").show();
			$("#spinner").show();
		},
		
		hideLoading: function(callback){
			$("#overlay").hide();
			$("#spinner").hide();
			$("#spinner").removeClass("with-message");
			$("#spinner .message").text("");
			
			if(callback){
				callback();
			}
		},
		
		checkConnection : function (){
			if(navigator.onLine){
	    		return true;
	    	}
	    	else {
	    		return false;
	    	}
	    },
	    
	    onOffline : function(){
	    	var errorObj = new Array();
			errorObj.errorCode = "";
			errorObj.errorMessage = "Looks like you are offline!";
			wheresMyBus.Util.errorHandler(errorObj);
	    },
	    
	    getDeviceDetails : function(){
	    	var thisDevice = new Object();
	    	if(wheresMyBus.Main.isPhone && device){
	    		thisDevice.cordova = device.cordova;
	    		thisDevice.model = device.model;
	    		thisDevice.platform = device.platform;
	    		thisDevice.uuid = device.uuid;
	    		thisDevice.version = device.version;
	    	}
	    	else{
	    		thisDevice.cordova = "";
	    		thisDevice.model = "";
	    		thisDevice.platform = "";
	    		thisDevice.uuid = "";
	    		thisDevice.version = "";
	    	}
	    	return thisDevice;
	    },
	    
	    getPoint2PointDistance : function(fromLat, fromLng, toLat, toLng){
    		var radlat1 = Math.PI * fromLat/180;
    		var radlat2 = Math.PI * toLat/180;
    		var radlon1 = Math.PI * fromLng/180;
    		var radlon2 = Math.PI * toLng/180;
    		var theta = fromLng-toLng;
    		var radtheta = Math.PI * theta/180;
    		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    		dist = Math.acos(dist);
    		dist = dist * 180/Math.PI;
    		dist = dist * 60 * 1.1515;
    		dist = dist * 1.609344;
    		return dist;
	    }
}
