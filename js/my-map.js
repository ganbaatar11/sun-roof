// This example requires the Drawing library. Include the libraries=drawing
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=drawing">

// initializing both searchbox and draw manager
function initialize() {
  initAutocomplete();
}

function initAutocomplete() {
  /** E = A * r * H * PR
  E => Energy (kWh) 
  A => Total solar panel Area (m2) 
  r => solar panel yield or efficiency(%): 16% = 0.16
  H => Between 200 kWh/m2.y (Norway) and 2600 kWh/m2.y: 2000
  PR => Performance Ratio: range between 0.5 and 0.9, default value = 0.75
  */
  
  var calculate_energy = function (a){
    var r = 0.16
    var H = 2000; 
    var pr = 0.75
    var to_kw = 0.001;
    return Number.parseFloat(a * r * H * pr * to_kw).toFixed(2);
  };
  
  var calculate_area = function (event){
    return Number.parseFloat(google.maps.geometry.spherical.computeArea(event.getPath())).toFixed(2);
  }
  
  var costs = [[0, 5, 5.10], [5,10, 5], [10,25, 4.85], [25, 100, 4.45], [100, Infinity, 3.70]];

  var calculate_cost = function (energy, costs){
    for(var _c of costs){
      if(energy >= _c[0] && energy < _c[1]){
        return Number.parseFloat(energy * _c[2]).toFixed(2);
      }
    };
    return Number.parseFloat(0).toFixed(2);
  }
  
  var update_details = function(event){
    set_shape(event);
    var a = calculate_area(event.overlay);
    var e = calculate_energy(a);
    var c = calculate_cost(e, costs);
    document.getElementById("area").innerText = a  + " m^2";
    document.getElementById("energy").innerText = e + " kW";
    document.getElementById("cost").innerText = "$ " + c;
  }
   
  var chicago = {lat: 41.8851557, lng: -87.6292102}
   
  var map = new google.maps.Map(document.getElementById('map'), {
    center: chicago,
    zoom: 17,
    mapTypeId: 'satellite'
  });

  // current drawn shape
  var selected_shape = null;

  // clear previous shape when new shape is drawn completely
  var set_shape = function(event){
    if (selected_shape) selected_shape.overlay.setMap(null);
    selected_shape = event;
    selected_shape.overlay.setMap(map);
  }
  
  // create drawing tools
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.OverlayType,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_CENTER,
      drawingModes: ['polygon']
    },
    markerOptions: {icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png'},
    polygonOptions: {
      fillColor: '#ffff00',
      // fillOpacity: 1,
      strokeWeight: 5,
      clickable: true,
      editable: true,
      zIndex: 1
    }
  });
  
  // set map for drawing tools
  drawingManager.setMap(map);
  
  // adding overlaycomplete event listener on map
  // google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
  //   update_details(event);
  // });
  
  // calculatiting details each time when drawn shape is updated
  google.maps.event.addListener(drawingManager, 'overlaycomplete', function(event) {
    if(event && event.type == 'polygon') {      
      google.maps.event.addListener(event.overlay.getPath(), 'set_at', function() {
        update_details(event);
      });
      
      google.maps.event.addListener(event.overlay.getPath(), 'insert_at', function() {
        update_details(event);
      });
      update_details(event);
    };
  });
  
  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  
  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function() {
    searchBox.setBounds(map.getBounds());
  });
  
  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function() {
    var places = searchBox.getPlaces();
    
    if (places.length == 0) {
      return;
    }
    
    // Clear out the old markers.
    markers.forEach(function(marker) {
      marker.setMap(null);
    });
    markers = [];
    
    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function(place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      
      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));
      
      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    
    // set map to fit bounds 
    map.fitBounds(bounds);
  });
}