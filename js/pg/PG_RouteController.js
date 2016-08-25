var wheresMyBus = wheresMyBus || {};

wheresMyBus.PG_RouteController = {
			    
		searchBus: function(isRefresh){
			var self = this;
			var storeRecommendedRouteAtServer = false;
			
			// Get to location					
			var toPlaceName = $('#destination').val();
			
			// Set parameters
			if(!isRefresh){
				wheresMyBus.Util.showLoading();
				wheresMyBus.Main.originLat = wheresMyBus.Main.currLat;
    			wheresMyBus.Main.originLng = wheresMyBus.Main.currLng;
    			wheresMyBus.Main.originFormattedAddress = wheresMyBus.Main.currFormattedAddress;    			
    			
    			wheresMyBus.Main.toPlaceName = toPlaceName;
    			wheresMyBus.Main.actualToPlaceName = toPlaceName;
			}
			
			if(toPlaceName == ""){
				var errorObj = new Array();
    			errorObj.errorCode = "";
    			errorObj.errorMessage = "Where are you going?";
    			wheresMyBus.Util.errorHandler(errorObj);
			}
			else{				
				wheresMyBus.Main.recommendedRoutes = [];
				wheresMyBus.Main.gettingBusEta = true;
				
				// 1. Get nearest places based on current location
				var auditData = new Object();
				auditData.isRefresh = (isRefresh?true:false);
				auditData.batch = wheresMyBus.Util.generateUUID();
				auditData.sequence = "1";
				var suppressError = (isRefresh?true:false);
				wheresMyBus.Api.getNearestPlaces(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng, auditData, suppressError).done(function(arrFromPlace) {
					
					if(arrFromPlace){
						if(arrFromPlace.length > 0){
							// 2. Get toPlace's officialId(s)
							wheresMyBus.Sqlite.getPlaceByName(wheresMyBus.Main.toPlaceName).done(function(arrToPlace) {
								
								// 2.1 If toPlace is a custom POI, get its nearest bus stops as toPlace
								if(arrToPlace[0].type != "custom"){
									getRouteCombinations();
								}
								else{
									auditData.sequence = "1.1";
									wheresMyBus.Api.getNearestPlaces(arrToPlace[0].lat, arrToPlace[0].lng, auditData, suppressError).done(function(arrNearestToPlace) {
										arrToPlace = arrNearestToPlace;
										getRouteCombinations();
									});
								}
								
								// 3.2 Get route for all combinations of From Places + To Places
								var fromToPlaceCombinationCount = 0;
								var callback = function(routes){
									wheresMyBus.Main.recommendedRoutes.push(routes);
									
									if(fromToPlaceCombinations[fromToPlaceCombinationCount]){
										self.getRoutes(fromToPlaceCombinations[fromToPlaceCombinationCount].fromPlaceOfficialId,
												fromToPlaceCombinations[fromToPlaceCombinationCount].toPlaceOfficialId,
												callback, auditData);
										fromToPlaceCombinationCount++;
									}
								};

								// 3.1 Get route combinations either 
								//		- recommended routes from server or
								//		- route's combinations
								var canStartGetShortestRoute = false;
								var fromToPlaceCombinations = new Array();
								auditData.sequence = "2";
								function getRouteCombinations(){
									wheresMyBus.Api.getRecommendedRoute(arrFromPlace[0].official_id, arrToPlace[0].official_id, auditData)
										.done(function(recommendedRoute) {		
											if(recommendedRoute && recommendedRoute.length > 0){
												var eachCombination = new Object();
												eachCombination.fromPlaceOfficialId = recommendedRoute[0].recommended_from_official_id;
												eachCombination.toPlaceOfficialId = recommendedRoute[0].recommended_to_official_id;
												fromToPlaceCombinations.push(eachCombination);
											}
											else{
												storeRecommendedRouteAtServer = true;
												$.each(arrFromPlace, function(key, eachFromPlace) {							
													$.each(arrToPlace, function(key, eachToPlace) {								
														var eachCombination = new Object();
														eachCombination.fromPlaceOfficialId = eachFromPlace.official_id;
														eachCombination.toPlaceOfficialId = eachToPlace.official_id;
														fromToPlaceCombinations.push(eachCombination);
													})							
												})
											}
											
											self.getRoutes(fromToPlaceCombinations[fromToPlaceCombinationCount].fromPlaceOfficialId,
															fromToPlaceCombinations[fromToPlaceCombinationCount].toPlaceOfficialId,
															callback, auditData);
											fromToPlaceCombinationCount++;
											
											canStartGetShortestRoute = true;
										});
								}
								
								// 4. Get shortest route
								function getShortestRoute() {
		            				setTimeout(function() {
		            					if(canStartGetShortestRoute && wheresMyBus.Main.recommendedRoutes.length == fromToPlaceCombinations.length){
		            						// calculate shortest route
		            						var orderedRecommendedRoutes = [];
		            						var bestRoute = new Object();
		            						bestRoute.distance = 0;
		            						bestRoute.interchange = 0;
		            						bestRoute.weight = 0;
		            						$.each(wheresMyBus.Main.recommendedRoutes, function(key, eachRoute) {
		            							if(eachRoute){	            								
		            								var thisDistance = eachRoute.options[0].distance;
		                							var thisInterchange = eachRoute.options[0].interchanges.length;
		                							var thisWeight = parseInt(thisDistance) + (thisInterchange * wheresMyBus.Main.interchangeWeightage); 
		                								
		                							if(orderedRecommendedRoutes.length == 0){
		                								bestRoute.distance = thisDistance;
		                								bestRoute.interchange = thisInterchange;
		                								bestRoute.weight = thisWeight;
		                								orderedRecommendedRoutes.push(eachRoute);
		                    			            }
		                							else if(thisWeight < bestRoute.weight){
		                								bestRoute.distance = thisDistance;
		                								bestRoute.interchange = thisInterchange;
		                								bestRoute.weight = thisWeight;
		                								orderedRecommendedRoutes.unshift(eachRoute);
		                    			            }
		                							else{
		                								orderedRecommendedRoutes.push(eachRoute);
		                							}
	                								
	                								// record into audit trail
		                							auditData.sequence = "4";
	                								var newAuditTrail = new wheresMyBus.AuditTrail();
	                	            	    		newAuditTrail.batch = auditData.batch;
	                	            	    		newAuditTrail.sequence = auditData.sequence;
	                	            	    		newAuditTrail.txn_type = "busETAResult" + (isRefresh?" Refresh":"");
	                	            	    		newAuditTrail.remarks = "Route "+ (key+1) + "of" + wheresMyBus.Main.recommendedRoutes.length +
																			" from " + eachRoute.start.officialId + " " + eachRoute.start.placeName +
																			" to " + eachRoute.end.officialId + " " + eachRoute.end.placeName +
																			" distance: " + eachRoute.options[0].distance + 
																			" interchanges: " + eachRoute.options[0].interchanges.length +
																			" weight: " + thisWeight; 
	                	            	    		newAuditTrail.from_busstop1_official_id = eachRoute.start.officialId;
	                	            	    		newAuditTrail.from_busstop1_name = eachRoute.start.placeName;
	                	            	    		newAuditTrail.to_busstop1_official_id = eachRoute.end.officialId;
	                	            	    		newAuditTrail.to_busstop1_name = eachRoute.end.placeName;
	                	            	    		newAuditTrail.distance = eachRoute.options[0].distance;
	                	            	    		newAuditTrail.interchange = eachRoute.options[0].interchanges.length;
	                	            	    		
	                	            	    		$.each(eachRoute.options[0].buses, function(key, eachBus) {
	                	            	    			newAuditTrail.remarks += " bus: " + eachBus.busNumber;
	                	            	    			newAuditTrail.bus_number = eachBus.busNumber;
	                	            	    			newAuditTrail.bus_eta = eachBus.eta;
	                	            	    			newAuditTrail.bus_lat = eachBus.lat;
	                	            	    			newAuditTrail.bus_lng = eachBus.lng;
	                	            	    			wheresMyBus.Api.storeAuditTrail(newAuditTrail).done(function(){});
	                	            				});
		            							}
		            						})
		            						wheresMyBus.Main.recommendedRoutes = orderedRecommendedRoutes;
		            						
		            						// 5. Plot best option from best route
		            						if(wheresMyBus.Main.recommendedRoutes.length > 0){
		            							// hide search dialog
		            							if(!isRefresh){
		            								wheresMyBus.Controls.toggleSearchDialog();
		            							}
												
												// plot markers
												setTimeout(function(){
													wheresMyBus.Map.plotMarkers(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption, isRefresh, null);
												}, 500);
												
												// 6. Show distance
												if(!isRefresh){
													wheresMyBus.Controls.toggleRouteDetailsButton(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
												}
												else{
													wheresMyBus.Controls.refreshRouteDetailsButton(wheresMyBus.Main.shortestRoute, wheresMyBus.Main.shortestOption);
												}
												
												// 7. Refresh bus eta
												if(!isRefresh){
													wheresMyBus.Controls.refreshBusEta();
												}
												
												if(!isRefresh && storeRecommendedRouteAtServer){
													// 8. Store recommended route at server
													var recommendedRoute = new Object();
													recommendedRoute.fromOfficialId = wheresMyBus.Main.recommendedRoutes[wheresMyBus.Main.shortestRoute].start.officialId,
													recommendedRoute.toOfficialId = wheresMyBus.Main.recommendedRoutes[wheresMyBus.Main.shortestRoute].end.officialId,
													wheresMyBus.Api.storeRecommendedRoute(arrFromPlace, arrToPlace,
																							recommendedRoute,
																							wheresMyBus.Main.shortestOption).done(function() {
												    });										
												}
												
												// 9. Update wheresMyBus.Main.toPlaceName so that refreshETA does not need to call getNearestPlaces for toPlace if it's a custom place
												wheresMyBus.Main.toPlaceName = wheresMyBus.Main.recommendedRoutes[wheresMyBus.Main.shortestRoute].end.placeName;
		            						}
		            						else if(!isRefresh){
		            							wheresMyBus.Util.errorHandler();
		            						}
		            						else{
		            							// if is refresh but no recommended routes found, do nothing!!
		            						}
		            						
		            						if(!isRefresh){
		            							wheresMyBus.Util.hideLoading();
		            						}
		            						
		            						// 10. Reset flag
		            						wheresMyBus.Main.gettingBusEta = false;
		            						
		            					} 
		            					else {
		            						getShortestRoute();
		            					}           					
		            				}, 100);
		            			}
								getShortestRoute();
							});
						}
						else{
							var errorObj = new Array();
		        			errorObj.errorCode = "";
		        			errorObj.errorMessage = "Sorry, can't find any bus stop within walking distance!";
		        			wheresMyBus.Util.errorHandler(errorObj);
						}
					}
					else{
						var errorObj = new Array();
	        			errorObj.errorCode = "";
	        			errorObj.errorMessage = "Check your connection and try again!";
	        			wheresMyBus.Util.errorHandler(errorObj);
					}
					
				});
			}
		},
		
		getRoutes: function(fromPlace, toPlace, callback, auditData){
			var self = this;
			
			wheresMyBus.PG_CTB.getRoutes(fromPlace, toPlace, auditData).done(function(xmlDoc){
				if(xmlDoc){
					self.processXmlData(fromPlace, toPlace, xmlDoc, callback, auditData);
				}
				else{
					callback();
				}
			});
		},
		
		processXmlData: function(fromPlace, toPlace, xmlDoc, callback, auditData){
			var self = this;
			var routes = new wheresMyBus.Routes.init();
			var bestOption = new Object();
		    bestOption.distance = 0;
		    bestOption.interchange = 0;	
		    
			// 2. Process the xml data
		    try{
		    	var x 	= xmlDoc.getElementsByTagName("dict");
				var xx 	= x[0].getElementsByTagName("dict");
			    var y 	= x[0].getElementsByTagName("key"); // details or options
			    var loc = xx[0].getElementsByTagName("string");
				
			    // 2.1 get start + destination
			    //		- sometimes Place Code is returned as POI. E.g. Gurney Plaza
			    var xmlStartPlaceName = (loc[2].firstChild?loc[2].firstChild.nodeValue:"");
			    var xmlStartPlaceCode =  (loc[3].firstChild?loc[3].firstChild.nodeValue:"");
			    var xmlEndPlaceName = (loc[0].firstChild?loc[0].firstChild.nodeValue:"");
			    var xmlEndPlaceCode = (loc[1].firstChild?loc[1].firstChild.nodeValue:"");
			    
			    // 2.2 filter out occasional wrong data returned from the api call
			    wheresMyBus.Sqlite.getPlaceByOfficialId(fromPlace).done(function(fromPlaceRecord){
			    	wheresMyBus.Sqlite.getPlaceByOfficialId(toPlace).done(function(toPlaceRecord){
			    					    		
			    		if( xmlStartPlaceName.replace(/\s/g,'').toLowerCase() == fromPlaceRecord.name.replace(/\s/g,'').toLowerCase() && 
			    				xmlEndPlaceName.replace(/\s/g,'').toLowerCase() == toPlaceRecord.name.replace(/\s/g,'').toLowerCase() ){
			    			
			    			routes.start.officialId = fromPlaceRecord.official_id;
						    routes.start.placeName = fromPlaceRecord.name;
						    routes.start.placeCode =  fromPlaceRecord.code;
						    routes.end.officialId = toPlaceRecord.official_id;
						    routes.end.placeName = toPlaceRecord.name;
						    routes.end.placeCode = toPlaceRecord.code;
			    			
			    			// 2.3 start parsing the xml data
			    			// loop through keys to get options
						    for(i=0; i<y.length; i++){
						        // search for option
						    	var pp = (y[i].firstChild?y[i].firstChild.nodeValue:"");
						        if(pp.match(/option/gi) != null){
						        	var interchangeCodes = new Array();
						        	var option = new wheresMyBus.Routes.Option();
						        	
						            var next = self.getNextSibling(y[i]); // dict
						            var aa = (next?next.getElementsByTagName("key"):null); // details, eta, majorBusStops, map, distance
						            
						            if(aa){
						            	// 2.2 get direction details
							            var bb = (next?next.getElementsByTagName("array"):null); //get direction details section
							            var cc = (bb && bb[0]?bb[0].getElementsByTagName("dict"):null); //get direction details
							            if(cc){
							            	for(k=0; k<cc.length; k++) {
								            	var dd = cc[k].getElementsByTagName("string");
								            	if(dd){
								            		var direction = new wheresMyBus.Routes.Direction();
									            	direction.from = (dd[0]&&dd[0].firstChild?dd[0].firstChild.nodeValue:"");
									            	direction.instructions = (dd[1]&&dd[1].firstChild?dd[1].firstChild.nodeValue:"");
									            	direction.distance = (dd[2]&&dd[2].firstChild?dd[2].firstChild.nodeValue:"");
									                
									                // check if match "walk"
									                if(direction.instructions.match(/walk/gi) != null) {
									                	direction.mode = google.maps.TravelMode.WALKING;
									                }
									                else{
									                	direction.mode = google.maps.TransitMode.BUS;
									                }
									                
									                option.directions.push(direction);
								            	}
								            }
							            }
							            
							            // get eta + map + distance
							            for(j=0; j<aa.length; j++){
							                var ee = aa[j];
							                if(ee){
							                	// find eta
							                    if(ee.firstChild.nodeValue == "eta"){
								                    var eenext = self.getNextSibling(ee); // dict
								                    
								                    // 2.3 get bus stop
								                    var hh = (eenext?eenext.getElementsByTagName("string"):null); // 0:busstopid, 1:busstoptitle
								                    if(hh){
								                    	option.startBusStopCode = (hh[0]&&hh[0].firstChild?hh[0].firstChild.nodeValue:"");
									                    option.startBusStopName = (hh[1]&&hh[1].firstChild?hh[1].firstChild.nodeValue:"");
								                    }
								                    
								                    // 2.4 get eta for each bus
								                    var ff = (eenext?eenext.getElementsByTagName("dict"):null); // buses
								                    if(ff){
								                    	for(k=0; k<ff.length; k++){
									                        var gg = ff[k].getElementsByTagName("string"); // 0:eta, 1:route, 2:lastdestination
									                        if(gg){
									                        	if(gg[0].text == "" || gg[1].text == "" || gg[2].text == ""){
										                            return;
										                        }
										                        else{
										                        	var bus = new wheresMyBus.Routes.Bus();
										                        	bus.busNumber = (gg[1]&&gg[1].firstChild?gg[1].firstChild.nodeValue:"");
										                        	bus.eta = (gg[0]&&gg[0].firstChild?gg[0].firstChild.nodeValue:"");
										                        	bus.lastDestination = (gg[2]&&gg[2].firstChild?gg[2].firstChild.nodeValue:"");
										                        	bus.lat = "";
										                        	bus.lng = "";
										                        	option.buses.push(bus);
										                        }
									                        } 
									                    }
								                    }
							                    }
									                    
							                    // find majorBusStops	                    
							                    else if(ee.firstChild.nodeValue == "majorBusStops"){	                    	
								                    var eenext = self.getNextSibling(ee); // array
								                    var ff = (eenext?eenext.getElementsByTagName("dict"):null);
								                    if(ff){
								                    	for(k=0; k<ff.length; k++){
									                        var gg = ff[k].getElementsByTagName("string"); // 0:dec , 1:interchange, 2:title
									                        if(gg){
									                        	// 2.5 get bus stop code
										                        var busStopCode = (gg[2]&&gg[2].firstChild?gg[2].firstChild.nodeValue:"");
										                        if(busStopCode != "Current Location" && busStopCode != "Destination" && busStopCode != ""){
										                        	interchangeCodes.push(busStopCode);
										                        }
									                        }     
									                    }
								                    }
							                    }
							                    
							                    //find map
							                    else if(ee.firstChild.nodeValue == "map"){
								                    var eenext = self.getNextSibling(ee); //dict
								                    var ff = (eenext?eenext.getElementsByTagName("key"):null) // buses, point, interchange
								                    if(ff){
								                    	for(k=0; k<ff.length; k++){
								                        	
								                        	// 2.6 get buses coordinates
								                        	if(ff[k].firstChild.nodeValue == "buses"){
									                            var eenext2 = self.getNextSibling(ff[k]);
									                            var gg      = (eenext2?eenext2.getElementsByTagName("dict"):null);
									                            
									                            if(gg){
									                            	for(m=0; m<gg.length; m++){
										                                var jj = gg[m].getElementsByTagName("string"); // 0:lat , 1:long
										                                if(jj){
										                                	option.buses[m].lat = (jj[0]&&jj[0].firstChild?jj[0].firstChild.nodeValue:"");
											                                option.buses[m].lng = (jj[1]&&jj[1].firstChild?jj[1].firstChild.nodeValue:"");
										                                } 
									                                }
									                            }                        
								                            }
								                        	
								                            // 2.7 get points coordinates
								                        	else if(ff[k].firstChild.nodeValue == "point"){
									                            var eenext2 = self.getNextSibling(ff[k]);
									                            var gg 		= (eenext2?eenext2.getElementsByTagName("string"):null); //start 0:lat,1:long  end 2:lat,3:long
									                            
									                            if(gg){
									                            	routes.start.lat = (gg[0]&&gg[0].firstChild?gg[0].firstChild.nodeValue:"");
										                            routes.start.lng = (gg[1]&&gg[1].firstChild?gg[1].firstChild.nodeValue:"");
										                            routes.end.lat 	 = (gg[2]&&gg[2].firstChild?gg[2].firstChild.nodeValue:"");
										                            routes.end.lng 	 = (gg[3]&&gg[3].firstChild?gg[3].firstChild.nodeValue:"");
									                            }
								                            }
								                        	
								                        	// 2.8 get interchange coordinates
								                        	else if(ff[k].firstChild.nodeValue == "interchange"){
									                            var eenext2 = self.getNextSibling(ff[k]);
									                            var gg 		= (eenext2?eenext2.getElementsByTagName("dict"):null);
									                            
									                            if(gg){
									                            	for(m=0; m<gg.length; m++){
										                                var jj = gg[m].getElementsByTagName("string"); // 0:lat , 1:long	
										                                
										                                if(jj){
										                                	var interchange = new wheresMyBus.Routes.Interchange();
											                                interchange.lat = (jj[0]&&jj[0].firstChild?jj[0].firstChild.nodeValue:"");
											                                interchange.lng = (jj[1]&&jj[1].firstChild?jj[1].firstChild.nodeValue:"");
											                                
											                                if(interchangeCodes[option.interchanges.length]){
											                                	interchange.placeCode = interchangeCodes[option.interchanges.length];
											                                }
											                                option.interchanges.push(interchange);
										                                }
									                                }
									                            }
								                            }
								                        }
								                    }
							                    }
							                    
							                    // 2.9 find distance
							                    else if (ee.firstChild.nodeValue == "distance") {
								                    var nextDist = self.getNextSibling(ee);
								                    if(nextDist){
								                    	distance = (nextDist.firstChild?nextDist.firstChild.nodeValue:0);
									                    option.distance = distance;
								                    }
							                    }
							                }
							                else{
							                	return null;
							                }
							            }
							            routes.options.push(option);
						            }
						            else{
						            	return null;
						            }
						        }
						    }
						    
						    // Check route distance as some routes do not have full distance
						    // - if route distance is smaller than point2point distance, means CTB data is wrong
						    // - then will need to get distance from Google
						    var point2pointDistance = wheresMyBus.Util.getPoint2PointDistance(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng, routes.end.lat, routes.end.lng);
				    		if(point2pointDistance && routes.options[0].distance < point2pointDistance){
				    			wheresMyBus.Map.getDistance(wheresMyBus.Main.currLat, wheresMyBus.Main.currLng, routes.end.lat, routes.end.lng).done(function(actualDistance){
				    				var xmlDistance = routes.options[0].distance;
				    				routes.options[0].distance = actualDistance;
				    				callback(routes);
				    				
				    				// Record wrong distance into audit trail
				                	auditData.sequence = "3.1";
				                	var newAuditTrail = new wheresMyBus.AuditTrail();
				    	    		newAuditTrail.batch = auditData.batch;
				    	    		newAuditTrail.sequence = auditData.sequence;
				    	    		newAuditTrail.txn_type = "ctbAPICall Wrong Distance";
				    	    		newAuditTrail.remarks = "From: "+ fromPlace + " " + routes.start.placeName + 
				    	    								" To: " + toPlace + " " + routes.end.placeName +
				    	    								" Distance: "+ xmlDistance +
				    	    								" Actual Distance: " + actualDistance; 
									newAuditTrail.from_busstop1_official_id = fromPlace;
									newAuditTrail.to_busstop1_official_id = toPlace;
									wheresMyBus.Api.storeAuditTrail(newAuditTrail).done(function(){});
				    			});
				    		}
				    		else{
				    			callback(routes);
				    		}
			    		}
			    		else{
			    			// Record wrong data returned into audit trail
		                	auditData.sequence = "3.1";
		                	var newAuditTrail = new wheresMyBus.AuditTrail();
		    	    		newAuditTrail.batch = auditData.batch;
		    	    		newAuditTrail.sequence = auditData.sequence;
		    	    		newAuditTrail.txn_type = "ctbAPICall Wrong Result";
		    	    		newAuditTrail.remarks = "From: "+ fromPlace + " " + routes.start.placeName + 
		    	    								" To:" + toPlace + " " + routes.end.placeName; 
							newAuditTrail.from_busstop1_official_id = fromPlace;
							newAuditTrail.to_busstop1_official_id = toPlace;
							wheresMyBus.Api.storeAuditTrail(newAuditTrail).done(function(){});
							
							callback(null);
			    		}
			    	})
			    })
			    
		    }
		    catch(err){
		    	callback(null);
		    }
		},
		
		getNextSibling: function(n) {
		    optKey2 = n.nextSibling;
		    while (optKey2.nodeType != 1) {
		        optKey2 = optKey2.nextSibling;
		    }
		    return optKey2;
		}
}
