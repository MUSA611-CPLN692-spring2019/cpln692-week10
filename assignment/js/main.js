/** ---------------
Routing and Leaflet Draw

Build an application that meets the following specifications
  - The user should click on a Leaflet draw marker button and add a marker to the map
  - When the user adds a second marker, an AJAX request is sent to Mapbox's optimized_routeMaker
    function. Add the shape of this routeMaker to the map. Hide the draw marker button and show the
    "Reset Map" button.
  - When the user adds a third, fourth, or nth marker, an updated AJAX request is sent and the
    new fastest/shortest path which visits all n points is plotted.
  - When the user clicks "Reset Map", the state should be reset to its original values and all
    markers and routeMaker should be removed from the map. Show the draw marker button and hide the
    "Reset Map" button.

Here is a video of what this would look like for two points: http://g.recordit.co/5pTMukE3PR.gif

Documentation of routeMaker optimization: https://www.mapbox.com/api-documentation/#optimization

To get the routeMaker between your two markers, you will need to make an AJAX call to the Mapbox
optimized_routeMaker API. The text you send to the API should be formatted like this:


## Decoding the routeMaker
The part of the response we need for drawing the routeMaker is the shape property. Unfortunately, it's in
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
- `line` should be set to the leaflet layer of the routeMaker.

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

  $('#button-draw').show(); //Creates a button that lets users draw to show
  $('#button-reset').hide(); //Creates reset button and temporarily hides it
}

$('#button-reset').click(resetApplication);

/** ---------------
On draw

Leaflet Draw runs every time a marker is added to the map. When this happens
---------------- */
function coordsMaker() {
  return state.markers[0]._latlng.lng + ',' + state.markers[0]._latlng.lat + ';' + state.markers[1]._latlng.lng + ',' + state.markers[1]._latlng.lat; //Returns/creates "lon1, lat1; lon2, lat2" coordinates, where the coordinates are inputted by the user when they click on the map. The coordinates are first extracted from each marker's property containing its respective coordinate (lat or lon), and the strings containing the coordinates are then concatenated with commas and semicolons to make each pair of coordinates appear as "lon1, lat1; lon2, lat2"
}

function routeMaker() {
  $.ajax({
    url: "https://api.mapbox.com/directions/v5/mapbox/driving/" + coordsMaker() + ".json?access_token=" + "pk.eyJ1IjoiaWFuc2Nod2FyemVuYmVyZyIsImEiOiJjanRrZjRvdHkxYW00M3lwZjE5anBoZHpsIn0.1-8tMneyRvUnNTmajpzgEA", //This line creates the URL which gives me access to MapBox's driving route creation API. The line first writes the Mapbox API, then gets the user-inputted coordinates from the coordsMaker(), then adds my token to the
    success: function(routes) { //"routes" is the name of the object Mapbox automatically creates that contains the code which details the best route. I found this out by first going to https://docs.mapbox.com/help/demos/how-mapbox-works/how-directions-works.html, then inspecting in elements to see its JavaScript files, then finding its mapbox-gl-directions.js file and a batch of code starting at line 6725 which I think details how MapBox calls the object storing the best route path "routes". As a result, this entire success function must use the word "routes" where necessary in order for it to work
      console.log(routes); //I first printed the routes array that gets created to the console so I could examine its structure, which helped me make the line directly beneath this one:
      state.line = L.polyline(decode(routes.routes[0].geometry), {color: 'black', stroke: 2}).addTo(map); //The "decode(routes.routes[0].geometry)" essentially extracts the property of the "routes" array's zeroth (really first) element I found when running console.log(routes) called "geometry" which contains the line of code detailing the best route between the 2 user-inputted markers. This line then sets the color and line width of the user-created direction line on the map, then takes all of this information and makes the actual line of it using L.polyline(), and then finally adds that line to the map. This line is stored in the line property of state, which was previously set as undefined on line 104
		}
  })
}

map.on('draw:created', function (e) {
  var type = e.layerType; // The type of shape
  var layer = e.layer; // The Leaflet layer for the shape
  var id = L.stamp(layer); // The unique Leaflet ID for the

	state.count = state.count + 1; //At line 102, the count property of state was originally set to 0. This makes it so each time the user make a point, the count goes up by 1 (ex. when the user makes their first point, count=1, then when they make their second, count=2, etc.)
	map.addLayer(layer); //When the user plots a point, this makes the marker actually add to the map
  state.markers.push(layer); //This adds the new user-created marker to the array of markers listed under the state object

  if (state.count == 2) { //This if statement in English means "if the user plots a second marker onto the map (if the count of markers is 2), 2 things happen: 1) The route gets drawn from the first marker to the second using the routeMaker() function made to create that line, and 2) Show the reset map button so the user can clear the line and markers"
	   routeMaker();
	   $('#button-reset').show();
	}

  console.log('Do something with the layer you just created:', layer, layer._latlng);

});
