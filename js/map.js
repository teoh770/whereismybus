var wheresMyBus = wheresMyBus || {};

function lazyLoadingCallback(){
	$.getScript("lib/markerwithlabel.js")
    .done(function (script, textStatus) {
    	wheresMyBus.Map.init(wheresMyBus.Main.initMapCallback);
    })
    .fail(function (jqxhr, settings, ex) {
    });
}

wheresMyBus.Map = {
		
		directionsDisplay: null,
		directionsService: null,
		stepDisplay: null,
		
		init: function(callback){
			var self = this;
			
			// 1. Check if browser supports geolocation
			var retryCount = 0;
			var getCurrentPosition = function(suppressError){	
				navigator.geolocation.getCurrentPosition(
	            		// yes
	            		function (position) {
	            			// 2. Set default map center
	            			var defaultCoordinate = new google.maps.LatLng(wheresMyBus.Main.defaultLat, wheresMyBus.Main.defaultLng);
	        		    	
	            			// 3. Create the map
	            			var mapOptions = {	center: defaultCoordinate,
	        							        zoom: 14,
	        							        mapTypeId: google.maps.MapTypeId.ROADMAP,
	        							        panControl:false,
	        							        mapTypeControl:false,
	        							        overviewMapControl:false,
	        							        rotateControl:false,
	        							        scaleControl:true,
	        							        streetViewControl:false,
	        							        zoomControl:true
	        							     };
	        		        wheresMyBus.Main.map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
	            			self.fixInfoWindow();
	            			
	        		        // 4. Get start position
	        		        var isRefresh = false;
	        		        self.getStartPosition(position, isRefresh, callback);
	            	    }, 
	            	    // no
	            	    function (e) {
	            	    	// Set getCurrentPositionStatus to true
	            			getCurrentPositionStatus = true;
	            			
	            	    	if(!suppressError){
	            	    		var errorObj = new Array();
		            			errorObj.errorCode = "";
		            			errorObj.errorMessage = "Please ensure your Location Services is turned on!";
		            			wheresMyBus.Util.errorHandler(errorObj);
	            	    	}
	            	    	
	            	    	// Retry getCurrentPosition
							setTimeout(function() {
		        				if(retryCount <= 100){
		        					wheresMyBus.Util.showLoading("Checking for location");
		        					getCurrentPosition(true);
		        				}
		        				else{
		        					var errorObj = new Array();
				        			errorObj.errorCode = "";
				        			errorObj.errorMessage = "Can't get your location. Check your settings and try again!";
				        			wheresMyBus.Util.errorHandler(errorObj);
		        				}
		        				retryCount++;
            				}, 1000);
	            		}, 
	            		{ timeout: 45000, enableHighAccuracy: true }
	            );
			};
			
			if(window.google && google.maps){
				$.getScript("lib/markerwithlabel.js")
		        .done(function (script, textStatus) {
		        })
		        .fail(function (jqxhr, settings, ex) {
		        });
				
				getCurrentPosition(false);
			}
			else{
				$.getScript("http://maps.googleapis.com/maps/api/js?v=3.21&language=en&callback=lazyLoadingCallback")
		        .done(function (script, textStatus) {
		        })
		        .fail(function (jqxhr, settings, ex) {
		        });
			}
		},	
		
		getStartPosition: function(position, isRefresh, callback){
			var self = this;
			
			var currLat = position.coords.latitude;
			var currLng = position.coords.longitude;
			wheresMyBus.Main.actualLat = position.coords.latitude;
			wheresMyBus.Main.actualLng = position.coords.longitude;
			
			// Get address for current coordinates
			var latlng = new google.maps.LatLng(currLat, currLng);			
			var geocoder = new google.maps.Geocoder();			
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					var formatted_address = "";
            		var city = "";
            		var country = "";
            		
            		// Check if current address is valid
            		var isValidAddress = false;
            		$.each(results, function(key, eachAddress) {
            			$.each(eachAddress.address_components, function(key, eachComponent) {
        					if($.inArray(eachComponent.long_name, wheresMyBus.Main.validCities) >= 0) {
        						city = eachComponent.long_name;
        					}
        					if($.inArray(eachComponent.long_name, wheresMyBus.Main.validCountries) >= 0){
        						country = eachComponent.long_name;
        					}
        				});
            			
            			if(city != "" && country != ""){
        					isValidAddress = true;
        					formatted_address = results[0].formatted_address;
        					return false;
        				}
            		});
            		
            		// Current address is not valid, set it to the default value
            		if(!isRefresh && !isValidAddress){
            			currLat = wheresMyBus.Main.defaultLat;
            			currLng = wheresMyBus.Main.defaultLng;
            			formatted_address = wheresMyBus.Main.defaultFormattedAddress;
            			city = wheresMyBus.Main.defaultCity;
            			country = wheresMyBus.Main.defaultCountry;
            		}
            		else if(isRefresh && !isValidAddress && wheresMyBus.Main.currLat && wheresMyBus.Main.currLng){
            			currLat = wheresMyBus.Main.currLat;
            			currLng = wheresMyBus.Main.currLng;
            			formatted_address = wheresMyBus.Main.currFormattedAddress;
            			city = wheresMyBus.Main.currCity;
            			country = wheresMyBus.Main.currCountry;
            		}
            		
            		// Set start coordinates + formated address
            		wheresMyBus.Main.currLat = currLat;
        			wheresMyBus.Main.currLng = currLng;
        			wheresMyBus.Main.currFormattedAddress = formatted_address;
        			wheresMyBus.Main.currCity = city;
        			wheresMyBus.Main.currCountry = country;
        			$("#search-dialog .from .value").text(formatted_address);
        			
        			if(!isRefresh){
        				// Plot start marker
        				self.plotCurrentPosition();
        				
        				// Reset map center
        				var startLatLng = new google.maps.LatLng(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng);
        	    		wheresMyBus.Main.map.setCenter(startLatLng);
        			}
        	    	
        	    	if(callback){
        	    		callback();
        	    	}
        	    	
        	    	// Record new current location into audit trail
        	    	if(!isRefresh || isValidAddress){
        	    		var newAuditTrail = new wheresMyBus.AuditTrail();
        	    		newAuditTrail.txn_type = "currLocation" + (isRefresh?" Refresh":"");
        	    		newAuditTrail.remarks = "Curr location lat:" + wheresMyBus.Main.currLat + " lng:" + wheresMyBus.Main.currLng +
												" " + wheresMyBus.Main.currFormattedAddress;
        	    		newAuditTrail.actual_lat = wheresMyBus.Main.actualLat;
        	    		newAuditTrail.actual_lng = wheresMyBus.Main.actualLng;
        	    		newAuditTrail.from_lat = wheresMyBus.Main.currLat;
        	    		newAuditTrail.from_lng = wheresMyBus.Main.currLng;
        	    		newAuditTrail.from_address = wheresMyBus.Main.currFormattedAddress;
						wheresMyBus.Api.storeAuditTrail(newAuditTrail).done(function(){});
        	    	}
			    } 
				else {
					if(!isRefresh){
	            		// Set current address to the default value
	            		wheresMyBus.Main.currLat = wheresMyBus.Main.defaultLat;
	        			wheresMyBus.Main.currLng = wheresMyBus.Main.defaultLng;
	        			wheresMyBus.Main.currFormattedAddress = wheresMyBus.Main.defaultFormattedAddress;
	        			$("#search-dialog .from .value").text(formatted_address);
	            	}
	            	
	            	if(callback){
        	    		callback();
        	    	}
			    }
			});
		},
	    
		fixInfoWindow: function() {
		    // Here we redefine set() method.
		    // If it is called for map option, we hide InfoWindow, if "noSupress" option is false.
		    // As Google doesn't know about this option, its InfoWindows will not be opened.
		    var set = google.maps.InfoWindow.prototype.set;
		    google.maps.InfoWindow.prototype.set = function (key, val) {
		        if (key === 'map') {
		            if (!this.get('noSupress')) {
		                // Suppress infoWindow from POI
		                return;
		            }
		        }
		        set.apply(this, arguments);
		    }
		},
		
		resetMap: function(){
			self = this;
			
			// Remove all markers
			wheresMyBus.Map.removeAllMarkers();
			
			// Remove polyline
			if(wheresMyBus.Main.busRoutePolyline){
				wheresMyBus.Main.busRoutePolyline.setMap(null);
				wheresMyBus.Main.busRoutePolyline = null;
			}
			if(wheresMyBus.Main.busRoutePolylineOpp){
				wheresMyBus.Main.busRoutePolylineOpp.setMap(null);
				wheresMyBus.Main.busRoutePolylineOpp = null;
			}			
			
			// Reset direction renderer
			self.resetDirectionDisplay();
			
			// Replot current location marker
			wheresMyBus.Map.plotCurrentPosition();
			
    		// Reset zoom
	    	wheresMyBus.Main.map.setZoom(14);
	    	
	    	// Reset Center
	    	var startLatLng = new google.maps.LatLng(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng);
	    	wheresMyBus.Main.map.setCenter(startLatLng);									
		},
		
		resetDirectionDisplay: function(){
			if(wheresMyBus.Map.directionsDisplay != null) {
				wheresMyBus.Map.directionsDisplay.setMap(null);
				wheresMyBus.Map.directionsDisplay = null;
			}
		},
		
		toggleMapZoomControls: function(status){
			if(wheresMyBus.Main.map){
				if(status){
					wheresMyBus.Main.map.setOptions({
			        	zoomControl:true,
				        zoomControlOptions: {
				            style:google.maps.ZoomControlStyle.DEFAULT,
				            position: google.maps.ControlPosition.RIGHT_CENTER
				        }
			        });
				}
				else{
					wheresMyBus.Main.map.setOptions({
			        	zoomControl:false
			        });
				}
			}
		},
		
	    removeAllMarkers: function(isRefresh){
	    	var self = this;
	    	
	    	// Remove all markers
	    	self.removeOriginMarkers();
	    	self.removeStartMarkers();
	    	self.removeDestinationMarkers();
	    	self.removeBusMarkers();
	    	self.removeInterchangeMarkers();	    		    
	    	
	    	if(!isRefresh){
	    		self.removeBusRouteMarkers();	    		
	    	}
	    },
	    
	    removeOriginMarkers: function(){
	    	var self = this;
	    	
	    	for(var i=0; i<wheresMyBus.Main.originMarkers.length; i++) {
	    		wheresMyBus.Main.originMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.originMarkers = [];
	    },
	    
	    removeStartMarkers: function(){
	    	var self = this;
	    	
	    	for(var i=0; i<wheresMyBus.Main.startMarkers.length; i++) {
	    		wheresMyBus.Main.startMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.startMarkers = [];
	    },
	    
	    removeDestinationMarkers: function(){
	    	var self = this;
	    	
	    	for(var i=0; i<wheresMyBus.Main.destinationMarkers.length; i++) {
	    		wheresMyBus.Main.destinationMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.destinationMarkers = [];
	    },
	    
	    removeBusMarkers: function(){
	    	for(var i=0; i<wheresMyBus.Main.busMarkers.length; i++) {
	    		wheresMyBus.Main.busMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.busMarkers = [];
	    },
	    
	    removeInterchangeMarkers: function(){
	    	for(var i=0; i<wheresMyBus.Main.interchangeMarkers.length; i++) {
	    		wheresMyBus.Main.interchangeMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.interchangeMarkers = [];
	    },
	    
	    removeBusRouteMarkers: function(){
	    	for(var i=0; i<wheresMyBus.Main.busRouteMarkers.length; i++) {
	    		wheresMyBus.Main.busRouteMarkers[i].setMap(null);
	    	}
	    	wheresMyBus.Main.busRouteMarkers = [];
	    },
	    
	    plotCurrentPosition: function(){
	    	var self = this;
	    	
	    	// remove start marker
	    	self.removeStartMarkers();
	    	
	    	// re-plot current position
	    	var startLatLng = new google.maps.LatLng(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng);
			var image1 = {
			url: "img/human.png",
			scaledSize: new google.maps.Size(28, 43)
			};
	    	marker = new MarkerWithLabel({
	    	    position: startLatLng,
	    	    title:"Start",
	    	    icon: image1,
	    	});
	    	marker.setMap(wheresMyBus.Main.map);
	    	wheresMyBus.Main.startMarkers.push(marker);
	    },
	    
	    plotMarkers: function(routeNum, routeOptionNum, isRefresh, callback){
	    	var self = this;
	    		    	
	    	self.removeAllMarkers(isRefresh);
	    	var marker = null;
	    		    	
	    	// Plot bus route
	    	if(wheresMyBus.Main.currCountry == wheresMyBus.Main.singapore){
	    		wheresMyBus.SG_RouteController.showBusRoute(callback);
	    	}
	    	
	    	// Plot origin
	    	if(!(wheresMyBus.Main.originLat == wheresMyBus.Main.currLat && wheresMyBus.Main.originLng == wheresMyBus.Main.currLng) ){
	    		var originLatLng = new google.maps.LatLng(wheresMyBus.Main.originLat, wheresMyBus.Main.originLng);
                        var image2 = {
			url: "img/greenMarker.png",
			scaledSize: new google.maps.Size(25, 40)
			};
		    	marker = new MarkerWithLabel({
		    	    position: originLatLng,
		    	    title:"Start",
		    	    icon: image2,
		    	});
		    	marker.setMap(wheresMyBus.Main.map);
		    	wheresMyBus.Main.originMarkers.push(marker);
		    	google.maps.event.addListener(marker,'click',function() {
		    		wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
	    		})
	    	}
	    	
	    	// Plot start
	    	var startLatLng = new google.maps.LatLng(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng);
			var image1 = {
			url: "img/human.png",
			scaledSize: new google.maps.Size(28, 43)
			};
	    	marker = new MarkerWithLabel({
	    	    position: startLatLng,
	    	    title:"You're here",
	    	    icon: image1,
	    	});
	    	marker.setMap(wheresMyBus.Main.map);
	    	wheresMyBus.Main.startMarkers.push(marker);
	    	google.maps.event.addListener(marker,'click',function() {
	    		wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
    		})
	    	
	    	// Plot destination
	    	var endLatLng = new google.maps.LatLng(wheresMyBus.Main.recommendedRoutes[routeNum].end.lat, wheresMyBus.Main.recommendedRoutes[routeNum].end.lng);
			var image3 = {
			url: "img/redMarker.png",
			scaledSize: new google.maps.Size(25, 40)
			};
	    	marker = new MarkerWithLabel({
	    	    position: endLatLng,
	    	    title:"Your Destination",
				icon: image3,
	    	    labelContent: wheresMyBus.Main.recommendedRoutes[routeNum].end.placeName,
	    	    labelAnchor: new google.maps.Point(30, 70),
	    	    labelClass: "destination-label"
	    	});
	    	marker.setMap(wheresMyBus.Main.map);
	    	wheresMyBus.Main.destinationMarkers.push(marker);
	    	google.maps.event.addListener(marker,'click',function() {
	    		wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
    		})
	    	
	    	// Plot each bus
	    	$.each(wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].buses, function(key, eachBus) {
	    		if(eachBus.lat!="" && eachBus.lng!=""){
	    			var eachBusLatLng = new google.maps.LatLng(eachBus.lat, eachBus.lng);
					var image4 = {
					url: "img/busmarker.png",
					scaledSize: new google.maps.Size(29, 34)
			};
			    	marker = new MarkerWithLabel({
			    	    position: eachBusLatLng,
			    	    title: eachBus.busNumber,
			    	    icon: image4,					
			    	    zIndex: 998,
			    	    labelContent: eachBus.busNumber + " <span class='eta'>" + eachBus.eta + "</span>",
			    	    labelAnchor: new google.maps.Point(30, 70),
			    	    labelClass: "bus-label",
			    	    labelZIndex: 999	    	    	
			    	});
			    	marker.setMap(wheresMyBus.Main.map);
			    	wheresMyBus.Main.busMarkers.push(marker);
			    	google.maps.event.addListener(marker,'click',function() {
			    		wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
		    		})
	    		}
	    		else{
	    			wheresMyBus.Controls.toggleBusEtaPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption, "show");
	    		}
			});
	    	
	    	// Plot each interchange
	    	var interchangeCount = 1;
	    	$.each(wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].interchanges, function(key, eachInterchange) {
	    		
	    		// Get the interchange's name
	    		wheresMyBus.Sqlite.getPlaceByCode(eachInterchange.placeCode).done(function(place){
	    			var interchangeName = "";
	    			if(eachInterchange.placeName != ""){
	    				interchangeName = eachInterchange.placeName;
	    			}
	    			else if(eachInterchange.placeCode != "" && place && place.name){
	    				interchangeName = place.name;
	    			}
	    			wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].interchanges[key].placeName = interchangeName;
	    				    			
	    			var eachInterchangeLatLng = new google.maps.LatLng(eachInterchange.lat, eachInterchange.lng);
					var image5 = {
					url: "img/busstop.png",
					scaledSize: new google.maps.Size(50, 79)
					};
					
	    			marker = new MarkerWithLabel({
			    	    position: eachInterchangeLatLng,
			    	    title:"Bus Stop",
			    	    icon: image5,
			    	    labelContent: interchangeCount + ". " + interchangeName,
						labelAnchor: new google.maps.Point(30, 110),
						labelClass: "busstop-label"
			    	});
			    	marker.setMap(wheresMyBus.Main.map);
			    	wheresMyBus.Main.interchangeMarkers.push(marker);
			    	google.maps.event.addListener(marker,'click',function() {
			    		wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
		    		})
			    	interchangeCount++;
	    		});
			});
	    },
	    
	    replotBusMarkers: function(routeNum, routeOptionNum){
	    	var self = this;
	    		    	
	    	self.removeBusMarkers();
	    	var marker = null;
	    		    	
	    	// Plot each bus
	    	$.each(wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].buses, function(key, eachBus) {
	    		if(eachBus.lat!="" && eachBus.lng!=""){
	    			var eachBusLatLng = new google.maps.LatLng(eachBus.lat, eachBus.lng);	    		
			    	marker = new MarkerWithLabel({
			    	    position: eachBusLatLng,
			    	    title: eachBus.busNumber,
			    	    icon: "img/bus.png",
			    	    labelContent: eachBus.busNumber + " <span class='eta'>" + eachBus.eta + "</span>",
			    	    labelAnchor: new google.maps.Point(30, 70),
			    	    labelClass: "bus-label"
			    	});
			    	marker.setMap(wheresMyBus.Main.map);
			    	wheresMyBus.Main.busMarkers.push(marker);
			    	wheresMyBus.Controls.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
	    		}	    		
			});
	    },
	    
	    getDistance: function(fromLat, fromLng, toLat, toLng){			
	    	var deferred = $.Deferred();
	    	
			callback = function(response, status) {
				if (status != google.maps.DistanceMatrixStatus.OK) {
					deferred.resolve(null);
				} 
				else {
				    var distance = "";
				    var origins = response.originAddresses;;
				    
				    for (var i = 0; i < origins.length; i++) {
				    	var results = response.rows[i].elements;
				    	for (var j = 0; j < results.length; j++) {
				    		distance = results[j].distance.text;
				    		distance = distance.replace("km","").trim();
				    	}
				    }
				    
				    deferred.resolve(distance);
				}				
			};
			
			var service = new google.maps.DistanceMatrixService();
			service.getDistanceMatrix(
		    {
		    	origins: [new google.maps.LatLng(fromLat, fromLng)],
		    	destinations: [new google.maps.LatLng(toLat, toLng)],
		    	travelMode: google.maps.TravelMode.DRIVING,
		        unitSystem: google.maps.UnitSystem.METRIC,
		        avoidHighways: false,
		        avoidTolls: false
		    }, callback);
			
			return deferred.promise();
	    }
}
