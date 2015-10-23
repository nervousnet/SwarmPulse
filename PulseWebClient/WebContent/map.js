$(document)
		.ready(
				function() {
					var websocket;
					var counter = 0;
					var current_state = 0; // 0 - Real-Time, 1 - Time-Machine
					var current_layer = -1;
					var last_layer = 0;
							
					var data = [];
					var map = L.map('map', {
						zoomControl : false
					}).setView([ 47.379977, 8.545751 ], 2);
					var lightMarkers = new L.LayerGroup();
					var noiseMarkers = new L.LayerGroup();
					var msgMarkers = new L.LayerGroup();

					new L.Control.Zoom({
						position : 'topright'
					}).addTo(map);
					
					
					var mapStandard = 
					L.tileLayer(
						    'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
						    attribution: '&copy; OpenStreetMap contributors, CC-BY-SA',
						    maxZoom: 19
						    });
					
					mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
					mapquestLink = '<a href="http://www.mapquest.com//">MapQuest</a>';
					mapquestPic = '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">';
					
					var mapSatellite = 
						L.tileLayer(
							    'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
							    attribution: '&copy; '+mapLink+'. Tiles courtesy of '+mapquestLink+mapquestPic,
							    maxZoom: 22,
							    subdomains: '1234',
							    });
					
					var mapNoLabels = L
							.tileLayer(
									'https://cartocdn_{s}.global.ssl.fastly.net/base-midnight/{z}/{x}/{y}.png',
									{
										attribution : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
										maxZoom : 22
									});

					var mapWithLabels = L
							.tileLayer(
									'http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
									{
										attribution : '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
										maxZoom : 22
									});

	

					/** ****Pulse Logo****** */
					var info = L.control({
						position : 'topleft'
					});

					info.onAdd = function(map) {
						this._div = L.DomUtil.create('div', 'info');
						this.update();
						return this._div;
					};

					// method that we will use to update the control based on
					// feature properties passed
					info.update = function(props) {
						this._div.style.fontSize = "80%"
						this._div.innerHTML = '<img align = "left" src=\'pulse_logo.png\' width=\'115px\' height=\'10%\' bgcolor=\'#FFFFFF\'> <p width=\'20%\' align: \'left\'  style=\'color: #FFA500; font-family: verdana; display:inline-block; vertical-align: -7px;\'><i>mapping the world together</p><br>';

					};

					info.addTo(map);

					/** ******************************* */

					/** ***************Layer Control********************* */
					var baseMaps = {
						"Standard Map": mapStandard,
						"Satellite Map": mapSatellite,
						"Dark no labels Map" : mapNoLabels,
						"Dark with labels Map" : mapWithLabels
					};

					var groupedOverlays = {
						"Overlays" : {
							"Light" : lightMarkers,
							"Noise" : noiseMarkers,
							"Messages" : msgMarkers

						}
					};

					var options = {
						exclusiveGroups : [ "Overlays" ],
						groupCheckboxes : true,
						position : 'topleft'
					};

					var layerControl = L.control.groupedLayers(baseMaps,
							groupedOverlays, options);

					map.addControl(layerControl);
					/** ***************Layer Control********************* */
					
		
					

					/** ********************************************************************* */

					/** *****Legend for Color levels for noise***** */
					var legendSound = L.control({
						position : 'bottomleft'
					});

					legendSound.onAdd = function(map) {
						var div = L.DomUtil.create('div', 'label');
						grades = [ 0, 10, 30, 50, 70, 100, 120, 140 ],
								labels = [ "  0-10  ", "10-30", "30-50",
										"50-70", "70-100", "100-120",
										"120-140", "   140+  " ];

						div.style.border = "1px solid #ffffff";
						div.style.borderRadius = "2px";
						div.style.backgroundColor = "#2A2A2A";
						div.style.color = "#ffffff";
						div.style.fontSize = "70%";
						div.innerHTML = '<p align: \'bottom\'  style=\'color: #FFFFFF;   display:inline-block;\'> Sound Level (db)</p>  <br>';

						for (var i = 0; i < grades.length; i++) {
							div.innerHTML += '<img align = "left"  width=\'10px\' height=\'10px\' style="background-color:'
									+ getNoiseColor(grades[i] + 1)
									+ '"> <p align: \'left\' style=\'color: #FFA500; display:inline-block; \'>'
									+ labels[i] + ' </p><br>';

						}
						return div;
					};
					/** ********** */

					/** *****Legend for showing Light label***** */
					var legendLight = L.control({
						position : 'bottomleft'
					});

					legendLight.onAdd = function(map) {

						var div = L.DomUtil.create('div', 'label');
						var lightGrades = [ 0, 1, 5, 10, 100, 1000, 10000,
								100000 ];
						var lightLabels = [ "0", "1-5", "5-10", "10-100",
								"100-1000", "1000-10000", " 10000-100000 ",
								"100000+" ];

						div.style.border = "1px solid #ffffff";
						div.style.borderRadius = "2px";
						div.style.backgroundColor = "#2A2A2A";
						div.style.color = "#ffffff";
						div.style.fontSize = "70%";
						div.innerHTML = '<p align: \'bottom\'  style=\'color: #FFFFFF;   display:inline-block;\'> Light Level (lux)</p>  <br>';

						for (var i = 0; i < lightGrades.length; i++) {

							div.innerHTML += '<img align = "left"  width=\'10px\' height=\'10px\' style="background-color:'
									+ getLightColor(lightGrades[i] + 1)
									+ '"> <p align: \'left\' style=\'color: #FFA500; display:inline-block; \'>'
									+ lightLabels[i] + ' </p><br>';

						}
						return div;
					};

					/** *************************** */

					/** ****************************** */
					var downloadAppButton = L.easyButton({
						states : [ {
							stateName : 'downloadApp',
							icon : 'fa-mobile fa-lg',
							title : 'Download Mobile App',
							onClick : function(control) {
// control.state("connecting");
								// window.open("./Pulse.apk");
								showDialog();
							}
						} ],
						position : "topright"
					});

					downloadAppButton.addTo(map);
					/** ****************************** */
					/** ***********Server Connected Status Button**************** */
					var conButton = L.easyButton({
						states : [ {
							stateName : 'disconnected',
							icon : 'fa-chain-broken fa-lg red',
							title : 'Server disconnected',
							onClick : function(control) {
								control.state("connecting");
								doConnect();
							}
						}, {
							stateName : 'connecting',
							icon : 'fa-spinner fa-lg fa-spin',
							title : 'connecting...'
						}, {
							stateName : 'connected',
							icon : 'fa-chain fa-lg',
							title : 'Server Connected'
						}, {
							stateName : 'error',
							icon : 'fa-exclamation-circle fa-lg',
							title : 'Error.'
						} ],
						position : "topright"
					});

					conButton.addTo(map);
					conButton.state('connecting');

					/** *************************** */
					/**
					 * ***********Real Time or Time Machine
					 * Button****************
					 */
					var realTimeButton = L.easyButton({
						states : [ {
							stateName : 'realTime',
							icon : 'fa-clock-o fa-lg red',
							title : 'Real-Time',
							onClick : function(control) {
								control.state("timeMachine");
								changeSocketToTimeMachine();
								
								resetBeforeSendingTimeMachineRequest();
								
								$('#datePicker').show(0);
								
							}
						}, {
							stateName : 'timeMachine',
							icon : 'fa-history fa-lg',
							title : 'Time-Machine',
							onClick : function(control) {
								control.state("realTime");
// doConnect();
								
								if(current_layer == 0){
									resetToLightReadings();
									last_layer = 0;
								}else if (current_layer == 1) {

									
									resetToNoiseReadings();
									last_layer = 1;
								} else if (current_layer == 2) {

//									current_layer = 2;
									resetToMessagesOverlay();
									last_layer = 2;
								}
								changeSocketToRealTime();
// sliderControl.removeFrom(controlDiv);
// document.getElementById('footer').removeChild(controlDiv);

								$('#datePicker').hide(0);
							}
						} ],
						position : "topright"
							
					});

					realTimeButton.addTo(map);
					realTimeButton.state('realTime');

					
					/** *************************** */
					

				
					/** ********** */

					mapStandard.addTo(map);
					

					map.on('overlayadd', function(a) {
// console.log("a.name "+a.name);
// console.log("current_layer "+current_layer);
						if (a.name == "Light" && current_layer != 0) {
							
							resetToLightReadings();
							last_layer = 0;
						} else if (a.name == "Noise" && current_layer != 1) {

							
							resetToNoiseReadings();
							last_layer = 1;
						} else if (a.name == "Messages" && current_layer != 2) {

//							current_layer = 2;
							resetToMessagesOverlay();
							last_layer = 2;
						}
					});

					function resetToLightReadings() {
						removeAllMarkers();
						if (current_layer != 0)
							legendLight.addTo(map);
						if (last_layer == 1)
							legendSound.removeFrom(map);
						
						current_layer = 0;
						lightMarkers.addLayer(pruneCluster);
						map.addLayer(lightMarkers);
					
					}

					function resetToNoiseReadings() {
						removeAllMarkers();
						if (current_layer != 1)
							legendSound.addTo(map);
						
						if (last_layer == 0)
							legendLight.removeFrom(map);
						
						current_layer = 1;

						noiseMarkers.addLayer(pruneCluster);
						map.addLayer(noiseMarkers);
					}

					function resetToMessagesOverlay() {
						removeAllMarkers();
						
						if (last_layer == 1)
							legendSound.removeFrom(map);
						else if (last_layer == 0)
							legendLight.removeFrom(map);
						current_layer = 2;
						msgMarkers.addLayer(pruneCluster	);
						map.addLayer(msgMarkers);

					}

					function removeAllMarkers() {

						markerArray = [];

						pruneCluster.RemoveMarkers();
						lightMarkers.clearLayers();
						noiseMarkers.clearLayers();
						msgMarkers.clearLayers();
						map.removeLayer(lightMarkers);
						map.removeLayer(noiseMarkers);
						map.removeLayer(msgMarkers);
						counter = 0;
					}

				/** *********************************** */
					
					function getIcon(category, weight) {
						
						
							return "images/marker_"+category+"_"+weight+".png";
						
					}

					function getLightId(d) {
						return d > 100000 ? 7 : d > 10000 ? 6
								: d > 1000 ? 5 : d > 100 ? 4
										: d > 10 ? 3
												: d > 5 ? 2
														: d > 0 ? 1
																: 0;
					}
					
					function getNoiseId(d) {
						return d > 140 ? 7 : d > 120 ? 6
								: d > 100 ? 5 : d > 70 ? 4
										: d > 50 ? 3
												: d > 30 ? 2
														: d > 10 ? 1
																: 0;
					}

					function getLightId(d) {
						return d > 100000 ? 7 : d > 10000 ? 6
								: d > 1000 ? 5 : d > 100 ? 4
										: d > 10 ? 3
												: d > 5 ? 2
														: d > 0 ? 1
																: 0;
					}
					
					
					function getNoiseColor(d) {
						return d > 140 ? '#800026' : d > 120 ? '#BD0026'
								: d > 100 ? '#E31A1C' : d > 70 ? '#FC4E2A'
										: d > 50 ? '#FD8D3C'
												: d > 30 ? '#FEB24C'
														: d > 10 ? '#FED976'
																: '#FFEDA0';
					}

					function getLightColor(d) {
						return d > 100000 ? '#FFFFFF' : d > 10000 ? '#DADFA2'
								: d > 1000 ? '#BBBF8C' : d > 100 ? '#9C9F77'
										: d > 10 ? '#7D8061'
												: d > 5 ? '#5E604C'
														: d > 0 ? '#3F4036'
																: '#212121';
					}

					function getInnerColor(type) {

						if (type == 0) {
							return '#FFC690';
						} else if (type == 1) {
							return '#1A6A34';
						} else if (type == 2) {
							return '#3A6A34';
						}
					}
					/** ******************************* */
					var pruneCluster =  new PruneClusterForLeaflet();
						

// var markersCluster = new L.MarkerClusterGroup(
// {
// iconCreateFunction : function(cluster) {
//
// var markers = cluster.getAllChildMarkers();
// var markersCount = markers.length;
// var width = 0;
// var height = 0;
//
// if (markersCount < 10) {
// width = 15;
// height = 15;
// } else if (markersCount < 1000) {
// width = 20;
// height = 20;
// } else if (markersCount < 10000) {
// width = 25;
// height = 25;
// } else {
// width = 30;
// height = 30;
// }
//
// var bgColor = getMarkerClusterColor(cluster
// .getAllChildMarkers());
//
// return new L.DivIcon(
// {
// html : '<div style = "width:'
// + width
// + 'px; height:'
// + height
// + 'px; border-radius:50%; font-size:10px; color:#000; line-height: '
// + height
// + 'px; text-align:center; background:'
// + bgColor
// + '">'
// + cluster
// .getChildCount()
// + '</div>',
//
// className : 'cluster',
// iconSize : L.point(0, 0)
// });
// },
// disableClusteringAtZoom : 10,
// maxClusterRadius : 50,
// showCoverageOnHover : true
// });

					function getMarkerClusterColor(markers) {
						var sum;
						var lightLayerFlag;
						for (var i = 0; i < markers.length; i++) {
							if (i == 0) {
								if (markers[i].options.type == 0)
									lightLayerFlag = true
								else
									lightLayerFlag = false;
							}

							sum = markers[i].options.value;
						}
						var avg = sum / markers.length;

						if (lightLayerFlag)
							return getLightColor(avg);
						else
							return getNoiseColor(avg);
					}
					;

					lightMarkers.addLayer(pruneCluster);

					var markerArray = [];
					function addMarker(msg) {
						counter++;
						if (msg.properties.readingType == 0
								&& current_layer == 0) {
							
							var lightMarker = new PruneCluster.Marker(msg.geometry.coordinates[0], msg.geometry.coordinates[1]);
							lightMarker.data.popup = '<p style="color:black" align="center"><strong>'
											+ msg.properties.level
											+ '</strong> lux';
							lightMarker.data.name = msg.properties.recordTime;
							// lightMarker.data.id = msg.properties.readingType;
							lightMarker.data.weight = getLightId(msg.properties.level); // Weight
																						// is
																						// the
																						// level
																						// of
																						// Light
																						// or
																						// Noise
							lightMarker.data.category = msg.properties.readingType; // Category
																					// is
																					// readingType
							lightMarker.weight = getLightId(msg.properties.level);
// lightMarker.bindPopup(
// '<p style="color:black" align="center"><strong>'
// + msg.properties.level
// + '</strong> lux', {
// closeButton : false,
// offset : L.point(0, -5)
// });

// lightMarker.on('mouseover', function() {
// lightMarker.openPopup();
// });
// lightMarker.on('mouseout', function() {
// lightMarker.closePopup();
// });
							markerArray.push(lightMarker);
							pruneCluster.RegisterMarker(lightMarker);
							
							

						} else if (msg.properties.readingType == 1
								&& current_layer == 1) {
							var noiseMarker = new PruneCluster.Marker(msg.geometry.coordinates[0], msg.geometry.coordinates[1]);
							noiseMarker.data.popup ='<p style="color:black"  ><strong>'
								+ msg.properties.level
								+ '</strong> db';
							noiseMarker.data.name = msg.properties.recordTime;
// noiseMarker.data.id = getNoiseId(msg.properties.level);
							noiseMarker.data.weight = getNoiseId(msg.properties.level); // Weight
																						// is
																						// the
																						// level
																						// of
																						// Light
																						// or
																						// Noise
							noiseMarker.data.category = msg.properties.readingType; // Category
																					// is
																					// readingType
							noiseMarker.weight = getNoiseId(msg.properties.level);
							markerArray.push(noiseMarker);
							pruneCluster.RegisterMarker(noiseMarker);

						} else if (msg.properties.readingType == 2
								&& current_layer == 2) {
							
							var msgMarker = new PruneCluster.Marker(msg.geometry.coordinates[0], msg.geometry.coordinates[1]);
							
							if(containsURLWithHTMLLinks(msg.properties.message)){
								msgMarker.data.popup = '<p style="color:black" align="center"><strong>'
									+ replaceURLWithHTMLLinks(msg.properties.message) + "&output=embed"
									+ '</strong>';
								msgMarker.data.weight = 1; // Weight is the
															// level of Light or
															// Noise
								
							}else {

								msgMarker.data.popup = '<p style="color:black" align="center"><strong>'
									+ (msg.properties.message)
									+ '</strong>';
								msgMarker.data.weight = 0; // Weight is the
															// level of Light or
															// Noise
								
							}
								
								
							
							msgMarker.data.name = msg.properties.recordTime;
							msgMarker.data.category = msg.properties.readingType; // Category
																					// is
																					// readingType
							
							markerArray.push(msgMarker);
							pruneCluster.RegisterMarker(msgMarker);
						}
					}
					;

					
					function createIcon(data, category) {
					    return L.Icon({
					       
					    });
					}
					
					
					function replaceURLWithHTMLLinks(text) {
						
						var exp = /(\b(https?|ftp|file|http):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
						
						
						return text.replace(exp, "<a href='$1'>$1</a>");
					}
					
					function containsURLWithHTMLLinks(text) {
						var exp = /(\b(https?|ftp|file|http):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
						
						return text.search(exp) >= 0;
					}

					function getOuterColor(type, d) {
						if (type == 0) {
							return d > 200 ? '#1A6A34' : d > 100 ? '#8CBD31'
									: d > 70 ? '#FEDE00' : d > 50 ? '#FFDB4E'
											: d > 25 ? '#E88A3C'
													: d > 1 ? '#FF4A47'
															: '#FF4A47';
						} else if (type == 1) {
							return d > 70 ? '#1A6A34' : d > 60 ? '#8CBD31'
									: d > 40 ? '#FEDE00' : d > 20 ? '#FFDB4E'
											: d > 10 ? '#E88A3C'
													: d > 1 ? '#FF4A47'
															: '#FF4A47';
						} else if (type == 2) {

						}
					}
					;

					/** ****Update****** */
					var box = L.control.messagebox().addTo(map);

					L.control.liveupdate({
						update_map : function() {
							if(current_state == 0)
								updateMarkerArray();
// box.show('Counter :' + counter);
						},
						position : 'bottomright',
						interval : 10000
					}).addTo(map).startUpdating();

					function updateMarkerArray() {
					
						var currentTime = new Date().getTime();
						showSpinner();
						for (var i = 0; i < markerArray.length; i++) {
							var marker = markerArray[i];
// if (currentTime - marker.options.startTime >= 60000 * 5) {
							if(currentTime - marker.data.name >= 60000 * 5){ // 5
																				// minutes
// markersCluster.removeLayer(marker);
								var myArray = [];
								myArray.push(marker);
								pruneCluster.RemoveMarkers(myArray);
								pruneCluster.ProcessView();
								markerArray.splice(i, 1);
								counter--;
							}else 
								break;
						}
						hideSpinner();
						
					}

					/** *******Websocket************* */
					function doConnect() {
						showSpinner();
						if (window.MozWebSocket) {
							console
									.log("This browser supports WebSocket using the MozWebSocket constructor");
							window.WebSocket = window.MozWebSocket;
						} else if (!window.WebSocket) {
							console
									.log("This browser does not have support for WebSocket");
							hideSpinner();
							return;
						}

						websocket = new WebSocket("ws://129.132.255.27:8446");
						websocket.onopen = function(evt) {
							onOpen(evt)
						};
						websocket.onclose = function(evt) {
							onClose(evt)
						};
						websocket.onmessage = function(evt) {
							onMessage(evt)
						};
						websocket.onerror = function(evt) {
							onError(evt)
						};
						hideSpinner();
					}

					function doDisconnect() {
						websocket.close()
					}

					function onOpen(evt) {
						// Send an initial message
						websocket.send('WebClient Listening!');

						conButton.state('connected');
					}

					function onClose(evt) {
						conButton.state('disconnected');
					}

					function onMessage(evt) {
						
						hideSpinner();
// console.log(evt.data);
						var msg = JSON.parse(evt.data);
						var features = msg.features;
						 if (Array.isArray(features)) {
							 for(var i = 0; i < features.length; i++) {
								    var feature = features[i];
								    parseFeature(feature);
								   
								}
							 pruneCluster.ProcessView();
						 } else {
							    parseFeature(features);
								pruneCluster.ProcessView();
							
						 }
						
// console.log("msg.properties.readingType "
// + msg.properties.readingType);
						

					}

					function onError(evt) {
						conButton.state('error');
						console.log("WebSocket Error - " + evt.data);
					}

					doConnect();

					function openPopUp(e) {
						var popup = L.popup().setLatLng(e.latlng).setContent(
								'Light Level = ').openOn(map);
					}

					function closePopUp(e) {
						L.popup().close;
					}
					
					
					function changeSocketToTimeMachine(){
						current_state = 1;
						websocket.send('type=1');
					}
					function changeSocketToRealTime(){
						current_state = 0;
						websocket.send('type=0');
					}
					
					function sendTimeMachineRequest(readingType, startTime, endTime){
						showSpinner();
						resetBeforeSendingTimeMachineRequest();
						websocket.send('type=1,'+readingType+','+startTime+','+endTime);
					}
					
					function resetBeforeSendingTimeMachineRequest() {
						removeAllMarkers();
						
						if(current_layer == 0){
							lightMarkers.addLayer(pruneCluster);
							map.addLayer(lightMarkers)	
						} else if(current_layer == 1){
							noiseMarkers.addLayer(pruneCluster);
							map.addLayer(noiseMarkers)	
						} else if(current_layer == 2){
							msgMarkers.addLayer(pruneCluster);
							map.addLayer(msgMarkers);
						}
					}
					
					window.prepareTimeMachineReq = function(){
// console.log("inside prepareTimeMachineReq");
						
						 var txtDate =document.getElementById('txtDate').value;
						 var txtTime =document.getElementById('txtTime').value;
						        if((txtDate.length>0) && (txtTime.length==0)) { 
						        	showAlert("Please do set a Time.");
						            return false;
						        } else if((txtDate.length == 0) && (txtTime.length>0)) { 
						        	showAlert("Please do set a Date");
						            return false;
						        } else if((txtDate.length == 0) && (txtTime.length == 0)) { 
						        	showAlert("Please do set the Date and Time.");
						            return false;
						        } else {
						        	var dateAsObject =  $('#txtDate').datepicker("getDate"); 
						        	var timeAsObject =  $('#txtTime').timepicker('getTime', new Date(0));
						        	var millisec = dateAsObject.getTime() + timeAsObject.getTime()
						        	var date = new Date(millisec);
						        	sendTimeMachineRequest(current_layer, date.getTime(), date.getTime() + (60000 * 30));
						        		
						        }
					
					}
					
					
					function getStartTime(){
						return 
					}

					function showAlert(alertMsg) {
						$("#alert").text(alertMsg);
						$('#alert').dialog(
								// ...which upon when it's opened...
								{
									open : function(event, ui) {
										$(".ui-dialog-titlebar-close",
												ui.dialog | ui).hide();
									},
									modal : true,
									resizable : false,
									closeOnEscape : true,
									buttons : [ {
										text : "Cancel",
										"class" : 'button',
										click : function() {
											// Save code here
											 $(this).dialog('close');

										}
									} ],
									dialogClass: ' success-dialog'
								});

					}
					
					function showDialog() {
						$('#dialog').dialog(
								{
									open : function(event, ui) {
										$(".ui-dialog-titlebar-close",
												ui.dialog | ui).hide();
									},
									modal : true,
									resizable : false,
									closeOnEscape : true,
									buttons : [ {
										text : "Android",
										"class" : 'button',
										click : function() {
											// Cancel code here
											location.assign("https://play.google.com/store/apps/details?id=ch.ethz.coss.nervous.pulse");
											 $(this).dialog('close');

										}
									}, {
										text : "iOS",
										"class" : 'button',
										click : function() {
											// Save code here
											 $(this).dialog('close');

										}
									} , {
										text : "Cancel",
										"class" : 'button',
										click : function() {
											// Save code here
											 $(this).dialog('close');

										}
									} ],
									dialogClass: ' success-dialog'
								});

					}
					
					function parseFeature(feature){
								addMarker(feature);
					}
					
					function showSpinner() {
						/** ********************SPINNER************************** */					
						map.spin(true, {lines: 11 // The number of lines to
													// draw
							, length: 37 // The length of each line
							, width: 10 // The line thickness
							, radius: 22 // The radius of the inner circle
							, scale: 0.5 // Scales overall size of the
											// spinner
							, corners: 1 // Corner roundness (0..1)
							, color: '#FFF' // #rgb or #rrggbb or array of
											// colors
							, opacity: 0.25 // Opacity of the lines
							, rotate: 0 // The rotation offset
							, direction: 1 // 1: clockwise, -1:
											// counterclockwise
							, speed: 1 // Rounds per second
							, trail: 60 // Afterglow percentage
							, fps: 20 // Frames per second when using
										// setTimeout() as a fallback for CSS
							, zIndex: 2e9 // The z-index (defaults to
											// 2000000000)
							, className: 'spinner' // The CSS class to assign
													// to the spinner
							, top: '50%' // Top position relative to parent
							, left: '50%' // Left position relative to parent
							, shadow: false // Whether to render a shadow
							, hwaccel: false // Whether to use hardware
												// acceleration
							, position: 'absolute' });
						
// setTimeout(function(){ map.spin(false); }, 3000);
						/** ********************SPINNER************************** */
					}
					
					function hideSpinner(){
						map.spin(false);
					}
					
					
// var hazardIcon = L.icon({
// iconUrl: "test.png",
// iconSize: [16, 16],
// iconAnchor: [8, 8],
// popupAnchor: [0, 0]
// });
					
					
					/** ********************************************* */
				
					
					
					
					pruneCluster.BuildLeafletClusterIcon= function (cluster) {
						 var c = 'prunecluster prunecluster-';
					        var iconSize = 38;
					        var maxPopulation = this.Cluster.GetPopulation();
					         if (cluster.population < Math.max(10, maxPopulation * 0.01)) {
					            c += 'small';
					        }
					        else if (cluster.population < Math.max(100, maxPopulation * 0.05)) {
					            c += 'medium';
					            iconSize = 40;
					        }
					        else {
					            c += 'large';
					            iconSize = 44;
					        }
					        
					        if(current_layer == 0){
					        	c += "-0-";
					        	c += ((cluster.totalWeight/cluster.population).toFixed());
					        } else  if(current_layer == 1){
								c += "-1-"
								c += ((cluster.totalWeight/cluster.population).toFixed());
							} 
								
	
					     
					        return new L.DivIcon({
					            html: "<div><span>" + cluster.population + "</span></div>",
					            className: c,
					            iconSize: L.point(iconSize, iconSize)
					        });
					    }
					
					
					pruneCluster.PrepareLeafletMarker = function (marker, data, category) {
						marker.setIcon(L.icon({
							    iconUrl: getIcon(data.category, data.weight),
							    iconAnchor: [20,40]})); 
						
						
// if (data.icon) {
// if (typeof data.icon === 'function') {
// marker.setIcon(data.icon(data, category));
// }
// else {
// // marker.setIcon(data.icon);
// marker.setIcon(L.icon({
// iconUrl: getIcon(category, data.weight),
// iconAnchor: [20,40]}));
// }
// }
						  marker.on('mouseover', function(e){
							    // do click event logic here
// leafletMarker.openPopup();
							    	generatePopup(e, data.popup);
							    	
							    });
						  
						marker.on('click', function(e){
						    // do click event logic here
// leafletMarker.openPopup();
						    	generatePopup(e, data.popup);
						    	
						    });
// if (data.popup) {
// var content = typeof data.popup === 'function' ? data.popup(data, category) :
// data.popup;
// if (marker.getPopup()) {
// marker.setPopupContent(content, data.popupOptions);
// }
// else {
// marker.bindPopup(content, data.popupOptions);
// }
// }
				    };
					
// pruneCluster.PrepareLeafletMarker = function(leafletMarker, data) {
//						
// leafletMarker.setIcon(L.icon({
// iconUrl: getIcon(data.id),
// iconAnchor: [20,40]})); // See http://leafletjs.com/reference.html#icon
//					    
// leafletMarker.on('mouseover', function(){
// //do click event logic here
// // alert("HELP");
// });
// leafletMarker.on('mouseout', function(){
// //do click event logic here
// // alert("HELP2");
// });
// // //listeners can be applied to markers in this function
// leafletMarker.on('click', function(e){
// //do click event logic here
// // leafletMarker.openPopup();
// // generatePopup(e, data.popup);
//					    	
// });
//					    
// // A popup can already be attached to the marker
// // bindPopup can override it, but it's faster to update the content instead
// if (leafletMarker.getPopup()) {
// leafletMarker.setPopupContent(data.name);
// } else {
// leafletMarker.bindPopup(data.name);
// }
// };
					
					var generatePopup = function (e, popupContent) {

						  var clickedPopup = e.target.getPopup();
						  var newPopup = new L.popup({
						    offset: new L.Point(0, -20),
						    closeButton: false,
						    autoPan: false,
						    closeOnClick: true
						  });
						  // If a popup has not already been bound to the
							// marker, create one
						  // and bind it.
						  if (!clickedPopup) {
						    newPopup.setContent(popupContent)
						      .setLatLng(e.latlng)
						      .openOn(e.target._map);
						    e.target.bindPopup(newPopup);
						  }
						  // We need to destroy and recreate the popup each
							// time the marker is
						  // clicked to refresh its position
						  else if (!clickedPopup._isOpen) {
						    var content = clickedPopup.getContent();
						    e.target.unbindPopup(clickedPopup);
						    newPopup.setContent(content)
						      .setLatLng(e.latlng)
						      .openOn(e.target._map);
						    e.target.bindPopup(newPopup);
						  }
						};
					/** ********************************************** */
					resetToLightReadings();
					$('#datePicker').hide(0);
					
				});