var wheresMyBus = wheresMyBus || {};

wheresMyBus.AuditTrail = function(){
	var thisDevice = wheresMyBus.Util.getDeviceDetails();
		
	this.device_cordova = thisDevice.cordova;
	this.device_model = thisDevice.model;
	this.device_platform = thisDevice.platform;
	this.device_uuid = thisDevice.uuid;
	this.device_version = thisDevice.version;
	this.batch = "";
	this.sequence = "";
	this.txn_type = "";
	this.remarks = "";
	this.actual_lat = "";
	this.actual_lng = "";
	this.actual_address = "";
	this.from_lat = "";
	this.from_lng = "";
	this.from_address = "";
	this.to_lat = "";
	this.to_lng = "";
	this.to_address = "";
	this.from_busstop1_official_id = "";
	this.from_busstop1_name = "";
	this.from_busstop2_official_id = "";
	this.from_busstop2_name = "";
	this.to_busstop1_official_id = "";
	this.to_busstop1_name = "";
	this.to_busstop2_official_id = "";
	this.to_busstop2_name = "";
	this.distance = "";
	this.interchange = "";
	this.bus_number = "";
	this.bus_eta = "";
	this.bus_lat = "";
	this.bus_lng = "";
	this.xml = "";
	this.json = "";
}

,

wheresMyBus.AuditTrail.prototype.init = function(){
	
}
