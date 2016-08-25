var wheresMyBus = wheresMyBus || {};

wheresMyBus.Main = {
			    
		// Global variables		
		/* Komtar */
		defaultLat: "5.415037",
		defaultLng: "100.3293421",
		defaultFormattedAddress: "1, Jalan Penang, Georgetown, 10000 Pulau Pinang, Malaysia",
		defaultCity: "Penang",
		defaultCountry: "Malaysia",
		
		penang: "Penang",
		malaysia: "Malaysia",
		validCountries: ["Malaysia"],
		validCities: ["Penang"],
		
		shortestRoute: 0,
		shortestOption: 0,
		interchangeWeightage: 5,
		
		map: null,
		originMarkers: [],
		startMarkers: [],
		destinationMarkers: [],
		busMarkers: [],
		interchangeMarkers: [],
		busRouteMarkers: [],
		busRoutePolyline: null,
		busRoutePolylineOpp: null,
		
		actualLat: null,
		actualLng: null,
		actualFormattedAddress: null,
		originLat: null,
		originLng: null,
		originFormattedAddress: null,
		currCountry: null,
		currCity: null,
		currLat: null,
		currLng: null,
		currFormattedAddress: null,
		actualToPlaceName: null,
		actualToPlaceOfficialId: null,
		toPlaceName: null,
		toPlaceOfficialId: null,
		recommendedRoutes: [],
		
		previousFromPlace: null,
		previousToPlace: null,
		previousBusNumber: null,
				
		places: [],
		refreshCurrLocInterval: null,
		replotBusesInterval: null,
		gettingBusEta: false,

		isPhone: false,
		isIOS: false,
		isAndroid: false,
		isGingerBread: false,
		
		init: function(){
			$(document).ready(function() {
				wheresMyBus.Util.showLoading();
				
				// Check if is browser or mobile
			    if ((navigator.userAgent.match(/iphone/i) || navigator.userAgent.match(/ipad/i)) && window.cordova) {
			    	wheresMyBus.Main.isPhone = true;
			    	wheresMyBus.Main.isIOS = true;
			    }
			    else if (navigator.userAgent.match(/android/i) && window.cordova) {
			    	wheresMyBus.Main.isPhone = true;
			    	wheresMyBus.Main.isAndroid = true;
			    }
			    
			    // If is mobile, start loading everything only when device is ready
			    if(wheresMyBus.Main.isPhone) {
			    	document.addEventListener("deviceready", onDeviceReady, false);
			    } else {
			        onDeviceReady();
			    }
			    
			    function onDeviceReady() {
			    	
			    	// Fix the status bar for iOS7
			    	if(navigator.userAgent.match(/(iPad|iPhone);.*CPU.*OS 7_\d/i)) {
			            $("body").addClass("ios7");
			            $('body').append('<div id="ios7statusbar"/>');
			        }
			    	
			    	// Check if is Ginger Bread
			    	else if(wheresMyBus.Main.isAndroid) {
			    		var txt = "";
			    		if(device){
			    			/* device attributes : device.cordova, device.model, device.platform, device.uuid, device.version */
			    			txt = device.platform + " " + device.version;
			    		}
			    		else{
			    			txt += "<p>Browser CodeName: " + navigator.appCodeName + "</p>";
				    		txt += "<p>Browser Name: " + navigator.appName + "</p>";
				    		txt += "<p>Browser Version: " + navigator.appVersion + "</p>";
				    		txt += "<p>Cookies Enabled: " + navigator.cookieEnabled + "</p>";
				    		txt += "<p>Browser Language: " + navigator.language + "</p>";
				    		txt += "<p>Browser Online: " + navigator.onLine + "</p>";
				    		txt += "<p>Platform: " + navigator.platform + "</p>";
				    		txt += "<p>User-agent header: " + navigator.userAgent + "</p>";
			    		}
			    		
			    		if(txt.match(/(Android).*(2.3\.)/i)){
			    			wheresMyBus.Main.isGingerBread = true;
			    		}
			    	}
			    	
			    	// Instantiate fastClick
			    	FastClick.attach(document.body);
			    	
			    	// Initialize the app
			    	// Init sqlite
			    	wheresMyBus.Sqlite.initilizeConnection().done(function(){
			    		// Check for internet connection
			    		var auditData = new Object();
						auditData.isRefresh = false;
						auditData.batch = "";
						auditData.sequence = "";
			    		var retryCount = 0;
			    		var ping = function(suppressError){
			    			wheresMyBus.Api.ping(auditData).done(function(response){
				    			if(response){
				    				// Init map
									wheresMyBus.Map.init(wheresMyBus.Main.initMapCallback);
				    			}
				    			else{
				    				if(!suppressError){
										var errorObj = new Array();
					        			errorObj.errorCode = "";
					        			errorObj.errorMessage = "Internet required. Please connect to wifi or mobile data!";
					        			wheresMyBus.Util.errorHandler(errorObj);
									}

				        			// Retry getPlaces
									setTimeout(function() {
				        				if(retryCount <= 100){
				        					wheresMyBus.Util.showLoading("Checking for network");
				        					ping(true);
				        				}
				        				else{
				        					var errorObj = new Array();
						        			errorObj.errorCode = "";
						        			errorObj.errorMessage = "Can't connect to the internet. Check your connection and try again!";
						        			wheresMyBus.Util.errorHandler(errorObj);
				        				}
				        				retryCount++;
		            				}, 1000);
				    			}
				    		});
			    		};
			    		ping(false);
			    	});

					// Handles android back button
		        	document.addEventListener("backbutton", function(e){
		        		if($("#routeDetails-panel").hasClass("fly-down")){
		        			wheresMyBus.Controls.toggleRouteDetailsPanel();
		        		}
		        		else if($("#showRouteDetails-frame").hasClass("fly-down")){
		    			    e.preventDefault();
		    			    wheresMyBus.Controls.resetSearch();
		    			}
		        		else if($("#search-dialog").hasClass("fly-down")){
		        			e.preventDefault();
		    			    navigator.app.exitApp();
		        		}
		    		}, false);
			    }
			});			
		},
		
		initMapCallback: function(){
			var auditData = new Object();
			auditData.isRefresh = false;
			auditData.batch = "";
			auditData.sequence = "";

			// Get places
			wheresMyBus.Api.getPlaces(wheresMyBus.Main.currCity, wheresMyBus.Main.currCountry, auditData).done(function(places){
				if(places){
					// Store places into sqlite
					wheresMyBus.Sqlite.insertPlaces(places).done(function(){
						// Init control
						wheresMyBus.Controls.init();

						// Fly down Search Dialog
						wheresMyBus.Controls.toggleSearchDialog();
						
						// Hide loading
						wheresMyBus.Util.hideLoading();
					});
				}
				else{
					var errorObj = new Array();
	       			errorObj.errorCode = "";
	       			errorObj.errorMessage = "Unable to get places. Please try again!";
	       			wheresMyBus.Util.errorHandler(errorObj);
				}
			});
		}
};

wheresMyBus.Main.init();
