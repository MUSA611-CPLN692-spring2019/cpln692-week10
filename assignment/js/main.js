/** ---------------
Routing and Leaflet Draw

Build an application that meets the following specifications
  - The user should click on a Leaflet draw marker button and add a marker to the map
  - When the user adds a second marker, an AJAX request is sent to Mapbox's optimized_route
    function. Add the shape of this route to the map. Hide the draw marker button and show the
    "Reset Map" button.
  - When the user adds a third, fourth, or nth marker, an updated AJAX request is sent and the
    new fastest/shortest path which visits all n points is plotted.
  - When the user clicks "Reset Map", the state should be reset to its original values and all
    markers and route should be removed from the map. Show the draw marker button and hide the
    "Reset Map" button.

Here is a video of what this would look like for two points: http://g.recordit.co/5pTMukE3PR.gif

Documentation of route optimization: https://www.mapbox.com/api-documentation/#optimization

To get the route between your two markers, you will need to make an AJAX call to the Mapbox
optimized_route API. The text you send to the API should be formatted like this:


## Decoding the route

Note that the file `decode.js` is included, which introduces a function `decode`. If you pass the
shape string to the `decode` function, it will return an array of points in [lat, lng] format.

To plot these on the map, write a function to convert them to GeoJSON. Take a look at what GeoJSON
for a line looks like (you may want to create a line on geojson.io as an example). How can you
convert the array of points into the GeoJSON format? Hint: GeoJSON defines points as [lng, lat]
instead of [lat, lng], so you may need to flip your coordinates.

---------------- */

/** ---------------
State

- `count` should increase by one each time you add a new marker.
  This will help you figure out how many markers you have added
- `marker1` should be set to the leaflet layer that is created when
  you add your first marker
- `marker2` should be set to the leaflet layer that is created when
  you add your second marker
- `line` should be set to the leaflet layer of the route.

Keeping track of `marker1`, `marker2`, and `line` will help us remove
them from the map when we need to reset the map.
---------------- */

var state = {
  count: 0,
  markers: [],
  line: undefined
};

/** ---------------
Map configuration
---------------- */

var map = L.map('map', {
  center: [42.378, -71.103],
  zoom: 14
});

var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
}).addTo(map);

/** ---------------
Leaflet Draw configuration
---------------- */
var newLayer = new L.FeatureGroup();

var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: true,
    rectangle: false,
  },
  edit: {
    featureGroup: newLayer
  }
});

map.addControl(drawControl);

var marker1;
var marker2;


var coordinates = '';
var getRouteAPI1 = 'https://api.mapbox.com/directions/v5/mapbox/walking/';
var getRouteAPI2 = '?approaches=unrestricted;curb&access_token=pk.eyJ1Ijoicm9jaGlubmVyIiwiYSI6ImNpdjdraTF0bDAwMTEydG04d2x3cGxidGgifQ.mVnp9OqAHCylzC_RqOXg7A';
var getRouteAPI = '';
// var myRoute = '';

// how to extract from the response only the text and use decode()
// var getAndParseRoute = function() {
//   $.ajax(getRouteAPI).done(function(res) {
//       myRoute = JSON.stringify(res);
//     });
//   };


function getAndMapRoute() {
  $.ajax({
    url: getRouteAPI,
    success: function(res) {
      console.log(res);
      var latlngs = decode(res.routes[0].geometry);
      state.line = L.polyline(latlngs, {color: 'black'}).addTo(map);
    }
    // success: function(res){
    //   var latlngs = decode(res.trips[0].geometry);
    //   state.line = L.polyline(latlngs, {color: 'black'}).addTo(map);
    // }
  });
}

map.on(L.Draw.Event.CREATED, function (e) {
  // console.log(e.layer);
  $('#button-reset').show();
  var newData = e.layer.toGeoJSON();
  var lat = newData.geometry.coordinates[1];
  var lng = newData.geometry.coordinates[0];

  // console.log(newData);

  if (state.count == 0) {
        marker1 = L.geoJSON(newData).addTo(map);
        console.log(marker1);
        // map.addLayer(e.layer);
        state.markers.push([lat,lng]);
        // console.log(state.markers);
        state.count = state.count + 1;
    } else if (state.count == 1) {
        marker2 = L.geoJSON(newData).addTo(map);
        state.markers.push([lat,lng]);
        // console.log(state.markers);
        coordinates =String(state.markers[0][1]) +','+ String(state.markers[0][0]) +';'+
                String(state.markers[1][1]) +','+ String(state.markers[1][0]);
        getRouteAPI = getRouteAPI1.concat(coordinates, getRouteAPI2);
        getAndMapRoute();
        state.count = state.count + 1;
    } else {
      console.log('Exceed maximum points');
      console.log(state.markers);
    }
    });





/** ---------------
Reset application

Sets all of the state back to default values and removes both markers and the line from map. If you
write the rest of your application with this in mind, you won't need to make any changes to this
function. That being said, you are welcome to make changes if it helps.
---------------- */

var resetApplication = function() {
  // _.each(state.markers, function(m) {
  //     map.removeLayer(m);
  // });
  // map.removeLayer(state.line);
  if (state.count == 1) {
    map.removeLayer(marker1);
  }
  else if (state.count >= 2) {
    map.removeLayer(marker1);
    map.removeLayer(marker2);
    map.removeLayer(state.line);
  }

  state.count = 0;
  state.markers = [];
  state.line = undefined;
  $('#button-reset').hide();
};

$('#button-reset').click(resetApplication);

/** ---------------
On draw

Leaflet Draw runs every time a marker is added to the map. When this happens
---------------- */

map.on('draw:created', function (e) {
  var type = e.layerType; // The type of shape
  var layer = e.layer; // The Leaflet layer for the shape
  var id = L.stamp(layer); // The unique Leaflet ID for the

  console.log('Do something with the layer you just created:', layer, layer._latlng);
});
