var wheresMyBus = wheresMyBus || {};

wheresMyBus.PG_CTB = {
			    
		getRoutes: function(fromPlace, toPlace, auditData){
			var self = this;
			var deferred = $.Deferred();
			
			$.ajax({
            	url: "http://www.ctbsolutions.com.my/jsonp/?a=pyt2.aspx?from="+fromPlace+"&to="+toPlace,
            	/*url: "http://202.9.98.228/jsonp/?a=pyt2.aspx?from="+fromPlace+"&to="+toPlace,*/
            	crossDomain: true,
                type: "GET",
                dataType: "jsonp",
                success: function(response, textStatus, jqXHR){
                	var xmlResult = response.a;
                	var parser=new DOMParser();
              	  	var xmlDoc=parser.parseFromString(xmlResult,'text/xml');
                	deferred.resolve(xmlDoc);
                	
                	// Record xml response into audit trail
                	auditData.sequence = "3";
                	var newAuditTrail = new wheresMyBus.AuditTrail();
    	    		newAuditTrail.batch = auditData.batch;
    	    		newAuditTrail.sequence = auditData.sequence;
    	    		newAuditTrail.txn_type = "ctbAPICall";
    	    		newAuditTrail.remarks = "From: "+ fromPlace + " To:" + toPlace; 
					newAuditTrail.from_busstop1_official_id = fromPlace;
					newAuditTrail.to_busstop1_official_id = toPlace;
    	    		newAuditTrail.xml = xmlResult;
					wheresMyBus.Api.storeAuditTrail(newAuditTrail).done(function(){});
                },
                error: function(jqXHR, textStatus, errorThrown){
                	deferred.resolve(null);
                },
                complete: function(){
                	
                },
                timeout: 300000 // sets timeout to 5 minutes
            });
			
			return deferred.promise();
	    }
}
