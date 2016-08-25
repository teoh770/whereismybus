var wheresMyBus = wheresMyBus || {};

wheresMyBus.Controls = {
			    
		init: function(){
			var self = this;
						
			// bind auto complete for destination
			wheresMyBus.Controls.setupAutoCompleteDestination();
			
			$("#destination").change(function(){
				$('#searchBus-button').prop('disabled', true);
		    	$('#searchBus-button').addClass('disabled');
			});
			
			$("#searchBus-button").click(function(){
				self.searchBus();
			});	
			
			$("#resetSearch-button").click(function(){
				if($("#resetSearch-button").hasClass("clicked")){
					// if already clicked do nothing
				}
				else{
					$("#resetSearch-button").addClass("clicked");
					self.resetSearch();
					
					setTimeout(function(){
						$("#resetSearch-button").removeClass("clicked");
					},1000);
				}
			});
			
			$("#showRouteDetails-button").click(function(){
				self.toggleRouteDetailsPanel(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
			});
			
			$("#closeRouteDetails-button").click(function(){
				self.toggleRouteDetailsPanel();
			});	
		},
		
		setupAutoCompleteDestination: function(){
			var self = this;
			
			wheresMyBus.Sqlite.getPlaceNames().done(function(placeNames){
				wheresMyBus.Main.places = [];				
				$.each(placeNames, function(key, eachPlaceName) {
					var eachPlaceObject = new Object();
					eachPlaceObject.data = eachPlaceName;
					eachPlaceObject.value = eachPlaceName;
					wheresMyBus.Main.places.push(eachPlaceObject);
				});
				
				$('#destination').autocomplete({
					lookup: wheresMyBus.Main.places,
				    onSelect: function (suggestion) {
				    	$('#destination').css("font-size","20px");
				    	$('#searchBus-button').prop('disabled', false);
				    	$('#searchBus-button').removeClass('disabled');
				    },
				    autoSelectFirst: true,
				    showNoSuggestionNotice: true,
				    noSuggestionNotice: 'No match found!',
				    onInvalidateSelection: function(){
				    	$('#searchBus-button').prop('disabled', true);
				    	$('#searchBus-button').addClass('disabled');
				    }
				});
			});
		},
		
		searchBus: function(isRefresh){
			wheresMyBus.PG_RouteController.searchBus(isRefresh);
		},
		
		toggleSearchDialog: function(){
			var self = this;
			
			// Hide search-dialog
			if($("#search-dialog").hasClass("fly-down")){
				$("#search-dialog").removeClass("fly-down");
				wheresMyBus.Map.toggleMapZoomControls(true);
				wheresMyBus.Util.hideMapOverlay();
				
				clearInterval(wheresMyBus.Main.refreshCurrLocInterval);
			}
			
			// Show search-dialog
			else{
				$("#search-dialog").addClass("fly-down");
				wheresMyBus.Map.toggleMapZoomControls(false);
				wheresMyBus.Util.showMapOverlay();
				
				// Interval to refresh current location
				var count = 0;
				function myTimer() {
					count++
			    	console.log(count);
			    	
			    	// Refresh current position
					var isRefresh = true;
		            navigator.geolocation.getCurrentPosition(
		            		// yes
		            		function (position) {
		            			wheresMyBus.Map.getStartPosition(position, isRefresh, null);
		            	    }, 
		            	    // no
		            	    function (e) {
		            	    	// do nothing
		            		}, 
		            		{ timeout: 35000 }
		            );
				}			
				wheresMyBus.Main.refreshCurrLocInterval = setInterval(function(){myTimer()}, 20000); // 20 seconds
			}
		},
		
		resetSearch: function(){
			var self = this;
			
			self.toggleSearchDialog();
			self.toggleRouteDetailsButton();
			self.toggleBusEtaPanel(null, null, "hide");
			
			wheresMyBus.Map.resetMap();
			clearInterval(wheresMyBus.Main.replotBusesInterval);
		},
		
		refreshRouteDetailsButton: function(routeNum, routeOptionNum){
			var self = this;
			
			var distance = wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].distance;
			var measurement = wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].measurement;
			$("#showRouteDetails-button").html(distance + "<span class='measurement'>" + measurement + "</span>");			
		},
		
		toggleRouteDetailsButton: function(routeNum, routeOptionNum){
			var self = this;
			
			if($("#showRouteDetails-frame").hasClass("fly-down")){				
				$("#showRouteDetails-frame").removeClass("fly-down");
				$("#showRouteDetails-button").html("");
			}
			else{
				if(wheresMyBus.Main.recommendedRoutes.length > 0){
					var distance = wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].distance;
					var measurement = wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].measurement;
					$("#showRouteDetails-button").html(distance + "<span class='measurement'>" + measurement + "</span>");
					$("#showRouteDetails-frame").addClass("fly-down");
				}
			}
		},
		
		toggleRouteDetailsPanel: function(routeNum, routeOptionNum){
			var self = this;
			
			if($("#routeDetails-panel").hasClass("fly-down")){				
				$("#routeDetails-panel").removeClass("fly-down");
				$("#routeDetails-panel .details").html("");
				setTimeout(function() {
					$("#routeDetails-panel").hide();
				}, 200);
			}
			else{
				var html = "";
				var option = wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum];
	    		
				// Get the fromPlace's name
				var getFromPlaceNameDone = false;
				$.each(option.directions, function(key, eachDirection) {
					if(eachDirection.fromName == ""){
						wheresMyBus.Sqlite.getPlaceByCode(eachDirection.from).done(function(place){
			    			var fromPlaceName = "";
			    			if(place && place.name){
			    				fromPlaceName = place.name;
			    			}
			    			else{
			    				fromPlaceName = eachDirection.from;
			    			}
			    			wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].directions[key].fromName = fromPlaceName;
			    			
			    			if(key == option.directions.length-1){
			    				getFromPlaceNameDone = true;
			    			}
			    		});
					}
					else{
						getFromPlaceNameDone = true;
					}
				});
				
				// Get the toPlace's type
				var toPlace = null;
				wheresMyBus.Sqlite.getPlaceByName(wheresMyBus.Main.actualToPlaceName).done(function(place){
					toPlace = place[0];
	    		});
				
				// Construct the panel
				function contructPanel() {
    				setTimeout(function() {
    					if(getFromPlaceNameDone && toPlace){
    						var directions = "";
    						var bus = "";
    						var img = "";
    						
    						$.each(option.directions, function(key, eachDirection) {
    							// prepare distance div
    							var distance = "";
    							if(eachDirection.distance != 0){
    								distance = "<span class='distance'>Distance " + eachDirection.distance + eachDirection.measurement + "</span>"
    							}
    							
    							// prepare bus div
    							bus = "";
    							if(eachDirection.mode == google.maps.TransitMode.BUS){
    								bus = "<img src='img/bus.png' class='bus-img'>"
    							}
    							
    							// prepare interchange img
    							img = "<img src='img/busstop.png' class='busstop-img'>";
    							if(key == 0){
    								//img = "<i class='fa fa-map-marker start-marker'></i>";
    								img = "<img src='img/human.png' class='bus-img'>";
    							}
    							
    							// prepare headsign div
    							var headsign = "";
    							if(eachDirection.towards != ""){
    								headsign = "<span class='head-sign'>Towards " + eachDirection.towards + "</span>"
    							}
    							
    							directions +=	"<tr>" +
    											"	<td class='left'>" + img + "<br>" + eachDirection.fromName + "</td>" +
    											"	<td class='right'></td>" +
    											"</tr>";
    			
    							directions += 	"<tr>" +
    											"	<td class='left'><img src='img/arrowdown.png'></td>" +
    											"	<td class='right'>" + bus + eachDirection.instructions + "<br>"+ headsign + distance + "</td>" +										
    											"</tr>";
    						});
    						
    						directions += 	"<tr>" +
    										"	<td class='left'><img src='img/redMarker.png' class='bus-img'>" + "<br>" + wheresMyBus.Main.actualToPlaceName + "</td>" +
    										"	<td class='right'></td>" +
    										"</tr>";
    						
    						html += directions;
    						
    						$("#routeDetails-panel").show();
    						setTimeout(function() {
    							$("#routeDetails-panel .details").html(html);
    							
    							if(!wheresMyBus.Main.isGingerBread){
    								$("#routeDetails-panel").addClass("non-gingerbread");
    								$("#routeDetails-panel").addClass("fly-down");
    							}
    							else{
    								$("#routeDetails-panel").addClass("gingerbread");
    								$("#routeDetails-panel").addClass("fly-down");
    							}
    							
    						}, 100);
    					} 
    					else {
    						contructPanel();
    					}           					
    				}, 100);
    			}
    			contructPanel();
			}
		},
		
		toggleBusEtaPanel: function(routeNum, routeOptionNum, display){
			var self = this;
			
			if(display=="hide"){				
				$("#busEta-frame").removeClass("fly-down");
				$("#busEta-button").html("");
			}
			else{
				$.each(wheresMyBus.Main.recommendedRoutes[routeNum].options[routeOptionNum].buses, function(key, eachBus) {
					var busNumber = eachBus.busNumber;
					var busEta = eachBus.eta;
					var label = "Bus";
					if(eachBus.operator){
						label = eachBus.operator;
					}
					
					$("#busEta-button").html("<span class='eta'>" + busEta + "</span>" +
												"<span class='label'>" + label + "&nbsp;</span>" +
												"<span class='bus-no'>" + busNumber + "</span>");
					if(busEta == "Arriving"){
						$(".eta").css("font-size", "20px");
					}
					$("#busEta-frame").addClass("fly-down");
				});
			}
		},
		
		refreshBusEta: function(newStartLat, newStartLng, newStartFormattedAddress){
			var self = this;
						
			var callback = function(){
				// 2. Only execute if previous getBusEta process is no longer running
				if(!wheresMyBus.Main.gettingBusEta){
					// 3. Search bus based on the new current position
					var isRefresh = true;
					self.searchBus(isRefresh);
				}
			};
			
			if(newStartLat && newStartLng){ // for testing
				wheresMyBus.Main.currLat = newStartLat;
    			wheresMyBus.Main.currLng = newStartLng;
    			wheresMyBus.Main.currFormattedAddress = newStartFormattedAddress;
    			$("#search-dialog .from .value").text(newStartFormattedAddress);
    	    	callback();
			}
			else{
				var count = 0;
				function myTimer() {
					count++
			    	console.log(count);
			    	
			    	// 1. Refresh current position
					var isRefresh = true;
		            navigator.geolocation.getCurrentPosition(
		            		// yes
		            		function (position) {
		            			// if distance between previous position and current position is less than 100m, reuse previous location
		            			var distance = wheresMyBus.Util.getPoint2PointDistance(wheresMyBus.Main.actualLat, wheresMyBus.Main.actualLng,
		            																	position.coords.latitude, position.coords.longitude);
		            			if(distance >= 0.1){		            				
		            				wheresMyBus.Map.getStartPosition(position, isRefresh, callback);
		            			}
		            			else{
		            				callback();
		            			}
		            	    }, 
		            	    // no
		            	    function (e) {
		            	    	callback();
		            		}, 
		            		{ timeout: 35000 }
		            );
				}			
				wheresMyBus.Main.replotBusesInterval = setInterval(function(){myTimer()}, 10000); // 10 seconds
			}
		}
}
