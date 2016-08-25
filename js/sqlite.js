var wheresMyBus = wheresMyBus || {};

wheresMyBus.Sqlite = {
		
		database: null,
	
		// Default handlers
		errorHandler: function (transaction, error) {
			//console.log('Error: ' + error.message + ' code: ' + error.code);
		},
	 
		successCallBack: function () {},
		 
		nullHandler: function (){},
	
		// Define database options
		databaseOptions: {
			fileName: "sqlite_wheremybus",
			version: "1.0",
			displayName: "SQLite Where My Bus",
			maxSize: 1024
		},
	
		// Connect to database and setup the tables
		initilizeConnection: function () {
			var self = this;
			
			// 1. Check if the mobile device support databases
			if (!window.openDatabase) {	
				var errorObj = new Array();
				errorObj.errorCode = "";
				errorObj.errorMessage = "Looks like your device is not supported!";
				wheresMyBus.Util.errorHandler(errorObj);
				return;
			}
			
			// for asynchronous handling
			var deferred = $.Deferred();
			
			// 2. Create the local database (if it doesn't exist) or open the connection (if it does exist),
			// and get a reference to the generated connection.
			self.database = openDatabase(
					self.databaseOptions.fileName,
					self.databaseOptions.version,
					self.databaseOptions.displayName,
					self.databaseOptions.maxSize
			);
			
			// 3. Create the table if it doesn't exist.
			self.database.transaction (
				function ( transaction ){
					// required tables					
					transaction.executeSql(
							(
									"CREATE TABLE IF NOT EXISTS places " +
									"(" +
									"	pid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
									" 	country TEXT NOT NULL, " +
									"	city TEXT NOT NULL, " +
									"	zone TEXT NOT NULL, " +
									"	postcode TEXT NOT NULL, " +
									"	road TEXT NOT NULL, " +
									"	category TEXT NOT NULL, " +
									"	type TEXT NOT NULL, " +
									"	official_id TEXT NOT NULL, " +
									"	code TEXT NOT NULL, " +
									"	name TEXT NOT NULL, " +
									"	lat TEXT NOT NULL, " +
									"	lng TEXT NOT NULL " +
									")"
							),
							[],self.successCallBack,self.errorHandler);
					
				},self.errorHandler,function(){deferred.resolve();});
			
			return deferred.promise();
		},			
				
		insertPlaces: function (places) {
			var self = this;
			var deferred = $.Deferred();
			
			self.database.transaction (
					function ( transaction ){
						
						transaction.executeSql('DROP TABLE IF EXISTS places',self.nullHandler,self.nullHandler);
						
						transaction.executeSql(
								(
										"CREATE TABLE IF NOT EXISTS places " +
										"(" +
										"	pid INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, " +
										" 	country TEXT NOT NULL, " +
										"	city TEXT NOT NULL, " +
										"	zone TEXT NOT NULL, " +
										"	postcode TEXT NOT NULL, " +
										"	road TEXT NOT NULL, " +
										"	category TEXT NOT NULL, " +
										"	type TEXT NOT NULL, " +
										"	official_id TEXT NOT NULL, " +
										"	code TEXT NOT NULL, " +
										"	name TEXT NOT NULL, " +
										"	lat TEXT NOT NULL, " +
										"	lng TEXT NOT NULL " +
										")"
								),
								[],self.successCallBack,self.errorHandler);
			
						var count = 0;
						$.each(places, function(index, eachPlace) {
							// insert into local storage
							transaction.executeSql(
									(											
											"INSERT INTO places (" +
											"country, city, zone, postcode, road," +
											"category, type, official_id, code, name," +
											"lat, lng" +
											" ) VALUES ( " +
												"?, ?, ?, ?, ?," +
												"?, ?, ?, ?, ?," +
												"?, ?" +
											");"
									),
									[ eachPlace.country, eachPlace.city, eachPlace.zone, eachPlace.postcode, eachPlace.road,
									  eachPlace.category, eachPlace.type, eachPlace.official_id, eachPlace.code, eachPlace.name,
									  eachPlace.lat, eachPlace.lng],
									self.successCallBack,self.errorHandler);
							
							// check when to return DONE
							count++;
				    		if(count == places.length){
				    			deferred.resolve();
				    		}
				        });	
					});
			
			return deferred.promise();
		},
		
		getPlaces: function () {
			var self = this;
			var deferred = $.Deferred();
			var arrResults =  new Array();
			
			var selectSql = "SELECT * FROM places ORDER BY pid";
			var arrSelectParam = new Array();
			self.database.transaction (
					function ( transaction ){	
						transaction.executeSql(
								selectSql,
								arrSelectParam,
								function( transaction, results ){
									// process the results into array										
									if (results != null && results.rows != null) {
						                for (var i = 0; i < results.rows.length; i++) {
						                  var row = results.rows.item(i);
						                  arrResults.push(row);                  
						                }
						        	}
									deferred.resolve(arrResults);																		
								},
								self.errorHandler);						   	 
					});
            
            return deferred.promise();
		},
		
		getPlaceNames: function () {
			var self = this;
			var deferred = $.Deferred();
			var arrResults =  new Array();
			
			var selectSql = "SELECT DISTINCT name FROM places ORDER BY name";
			var arrSelectParam = new Array();
			self.database.transaction (
					function ( transaction ){	
						transaction.executeSql(
								selectSql,
								arrSelectParam,
								function( transaction, results ){
									// process the results into array										
									if (results != null && results.rows != null) {
						                for (var i = 0; i < results.rows.length; i++) {
						                  var row = results.rows.item(i).name;
						                  arrResults.push(row);                  
						                }
						        	}
									deferred.resolve(arrResults);																		
								},
								self.errorHandler);						   	 
					});
            
            return deferred.promise();
		},
		
		getPlaceByCode: function (code) {
			var self = this;
			var deferred = $.Deferred();
						
			self.database.transaction (
					function ( transaction ){		 
						transaction.executeSql(
								(
										"SELECT * FROM places WHERE code = ? AND type = ?"
								),
								[ code, "busStop" ],
								function( transaction, results ){
									if (results.rows.length != 0) {	
										deferred.resolve(results.rows.item(0));											
									}
									else {
										deferred.resolve(null);																													
									}
								},
								self.errorHandler);	
					});
			return deferred.promise();
		},
		
		getPlaceByName: function (name) {
			var self = this;
			var deferred = $.Deferred();
			
			self.database.transaction (
					function ( transaction ){		 
						transaction.executeSql(
								(
										"SELECT * FROM places WHERE name = ?"
								),
								[ name ],
								function( transaction, results ){
									if (results != null && results.rows != null) {
										var thisPlace = new Array();
										
						                for (var i = 0; i < results.rows.length; i++) {
						                	thisPlace.push(results.rows.item(i));
						                }
						                
						                deferred.resolve(thisPlace);
						        	}
									else {
										deferred.resolve(null);																													
									}
								},
								self.errorHandler);	
					});
			return deferred.promise();
		},
		
		getPlaceByOfficialId: function (officialId) {
			var self = this;
			var deferred = $.Deferred();
			
			self.database.transaction (
					function ( transaction ){		 
						transaction.executeSql(
								(
										"SELECT * FROM places WHERE official_id = ?"
								),
								[ officialId ],
								function( transaction, results ){
									if (results.rows.length != 0) {	
										deferred.resolve(results.rows.item(0));											
									}
									else {
										deferred.resolve(null);																													
									}
								},
								self.errorHandler);	
					});
			return deferred.promise();
		}
}

