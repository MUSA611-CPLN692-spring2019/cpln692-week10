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
The part of the response we need for drawing the route is the shape property. Unfortunately, it's in
a format we can't use directly. It will be a string that looks something like this:

`ee~jkApakppCmPjB}TfCuaBbQa|@lJsd@dF|Dl~@pBfb@t@bQ?tEOtEe@vCs@xBuEfNkGdPMl@oNl^eFxMyLrZoDlJ{JhW}JxWuEjL]z@mJlUeAhC}Tzi@kAv`...

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
  line: undefined,
}

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

var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: true,
    rectangle: false,
  }
});

map.addControl(drawControl);

/** ---------------
Reset application

Sets all of the state back to default values and removes both markers and the line from map. If you
write the rest of your application with this in mind, you won't need to make any changes to this
function. That being said, you are welcome to make changes if it helps.
---------------- */

var resetApplication = function() {
  _.each(state.markers, function(marker) { map.removeLayer(marker) })
  map.removeLayer(state.line);

  state.count = 0;
  state.markers = []
  state.line = undefined;
  $('#button-reset').hide();
}

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
