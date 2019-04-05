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

var truckLocation = [-83.093, 42.376];
var warehouseLocation = [-83.083, 42.363];
var lastQueryTime = 0;
var lastAtRestaurant = 0;
var keepTrack = [];
var currentSchedule = [];
var currentRoute = null;
var pointHopper = {};
var pause = true;
var speedFactor = 50;

// Add your access token
mapboxgl.accessToken = 'pk.eyJ1IjoiYXN0b3JpYSIsImEiOiJjanR1aWV5aTgwdG5qNDVtcDdkcGh4bWU3In0.6LPQecMoTd7G0V0APrkg3w';

// Initialize a map
var map = new mapboxgl.Map({
  container: 'map', // container id
  style: 'mapbox://styles/mapbox/light-v10', // stylesheet location
  center: truckLocation, // starting position
  zoom: 12 // starting zoom
});
/** ---------------
Map configuration
---------------- */

/*var map = L.map('map', {
  center: [42.378, -71.103],
  zoom: 14
});*/

/*var Stamen_TonerLite = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
}).addTo(map);*/

/** ---------------
Leaflet Draw configuration
---------------- */

// Create a GeoJSON feature collection for the warehouse
var warehouse = turf.featureCollection([turf.point(warehouseLocation)]);

// Create an empty GeoJSON feature collection for drop-off locations
var dropoffs = turf.featureCollection([]);

// Create an empty GeoJSON feature collection, which will be used as the data source for the route before users add any new data
var nothing = turf.featureCollection([]);

map.on('load', function() {
  var marker = document.createElement('div');
  marker.classList = 'truck';

  // Create a new marker
  truckMarker = new mapboxgl.Marker(marker)
    .setLngLat(truckLocation)
    .addTo(map);
    // Create a circle layer
    map.addLayer({
      id: 'warehouse',
      type: 'circle',
      source: {
        data: warehouse,
        type: 'geojson'
      },
      paint: {
        'circle-radius': 20,
        'circle-color': 'white',
        'circle-stroke-color': '#3887be',
        'circle-stroke-width': 3
      }
    });

    // Create a symbol layer on top of circle layer
    map.addLayer({
      id: 'warehouse-symbol',
      type: 'symbol',
      source: {
        data: warehouse,
        type: 'geojson'
      },
      layout: {
        'icon-image': 'grocery-15',
        'icon-size': 1
      },
      paint: {
        'text-color': '#3887be'
      }
    });
    map.addSource('route', {
      type: 'geojson',
      data: nothing
    });

    map.addLayer({
      id: 'routeline-active',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#3887be',
        'line-width': [
          "interpolate",
          ["linear"],
          ["zoom"],
          12, 3,
          22, 12
        ]
      }
    }, 'waterway-label');

    map.addLayer({
  id: 'dropoffs-symbol',
  type: 'symbol',
  source: {
    data: dropoffs,
    type: 'geojson'
  },
  layout: {
    'icon-allow-overlap': true,
    'icon-ignore-placement': true,
    'icon-image': 'marker-15',
  }
});

// Listen for a click on the map
map.on('click', function(e) {
  // When the map is clicked, add a new drop-off point
  // and update the `dropoffs-symbol` layer
  newDropoff(map.unproject(e.point));
  updateDropoffs(dropoffs);
});

function newDropoff(coords) {
  // Store the clicked point as a new GeoJSON feature with
  // two properties: `orderTime` and `key`
  var pt = turf.point(
    [coords.lng, coords.lat],
    {
      orderTime: Date.now(),
      key: Math.random()
    }
  );
  dropoffs.features.push(pt);
  pointHopper[pt.properties.key] = pt;

  // Make a request to the Optimization API
  $.ajax({
    method: 'GET',
    url: assembleQueryURL(),
  }).done(function(data) {
    // Create a GeoJSON feature collection
    var routeGeoJSON = turf.featureCollection([turf.feature(data.trips[0].geometry)]);

    // If there is no route provided, reset
    if (!data.trips[0]) {
      routeGeoJSON = nothing;
    } else {
      // Update the `route` source by getting the route source
      // and setting the data equal to routeGeoJSON
      map.getSource('route')
        .setData(routeGeoJSON);
    }

    if (data.waypoints.length === 12) {
      window.alert('Maximum number of points reached. Read more at mapbox.com/api-documentation/navigation/#optimization.');
    }
  });
}

function updateDropoffs(geojson) {
  map.getSource('dropoffs-symbol')
    .setData(geojson);
}

// Here you'll specify all the parameters necessary for requesting a response from the Optimization API
function assembleQueryURL() {

  // Store the location of the truck in a variable called coordinates
  var coordinates = [truckLocation];
  var distributions = [];
  keepTrack = [truckLocation];

  // Create an array of GeoJSON feature collections for each point
  var restJobs = objectToArray(pointHopper);

  // If there are any orders from this restaurant
  if (restJobs.length > 0) {

    // Check to see if the request was made after visiting the restaurant
    var needToPickUp = restJobs.filter(function(d, i) {
      return d.properties.orderTime > lastAtRestaurant;
    }).length > 0;

    // If the request was made after picking up from the restaurant,
    // Add the restaurant as an additional stop
    if (needToPickUp) {
      var restaurantIndex = coordinates.length;
      // Add the restaurant as a coordinate
      coordinates.push(warehouseLocation);
      // push the restaurant itself into the array
      keepTrack.push(pointHopper.warehouse);
    }

    restJobs.forEach(function(d, i) {
      // Add dropoff to list
      keepTrack.push(d);
      coordinates.push(d.geometry.coordinates);
      // if order not yet picked up, add a reroute
      if (needToPickUp && d.properties.orderTime > lastAtRestaurant) {
        distributions.push(restaurantIndex + ',' + (coordinates.length - 1));
      }
    });
  }

  // Set the profile to `driving`
  // Coordinates will include the current location of the truck,
  return 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving/' + coordinates.join(';') + '?distributions=' + distributions.join(';') + '&overview=full&steps=true&geometries=geojson&source=first&access_token=' + mapboxgl.accessToken;
}

function objectToArray(obj) {
  var keys = Object.keys(obj);
  var routeGeoJSON = keys.map(function(key) {
    return obj[key];
  });
  return routeGeoJSON;
}

/*map.addLayer({
  id: 'routearrows',
  type: 'symbol',
  source: 'route',
  layout: {
    'symbol-placement': 'line',
    'text-field': '▶',
    'text-size': [
      "interpolate",
      ["linear"],
      ["zoom"],
      12, 24,
      22, 60
    ],
    'symbol-spacing': [
      "interpolate",
      ["linear"],
      ["zoom"],
      12, 30,
      22, 160
    ],
    'text-keep-upright': false
  },
  paint: {
    'text-color': '#3887be',
    'text-halo-color': 'hsl(55, 11%, 96%)',
    'text-halo-width': 3
  }
}, 'waterway-label');*/
});

/*var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: true,
    rectangle: false,
  }
});

map.addControl(drawControl);*/

/** ---------------
Reset application

Sets all of the state back to default values and removes both markers and the line from map. If you
write the rest of your application with this in mind, you won't need to make any changes to this
function. That being said, you are welcome to make changes if it helps.
---------------- */

/*var resetApplication = function() {
  _.each(state.markers, function(marker) { map.removeLayer(marker) })
  map.removeLayer(state.line);

  state.count = 0;
  state.markers = []
  state.line = undefined;
  $('#button-reset').hide();
}

$('#button-reset').click(resetApplication);*/

/** ---------------
On draw

Leaflet Draw runs every time a marker is added to the map. When this happens
---------------- */

/*map.on('draw:created', function (e) {
  var type = e.layerType; // The type of shape
  var layer = e.layer; // The Leaflet layer for the shape
  var id = L.stamp(layer); // The unique Leaflet ID for the

  console.log('Do something with the layer you just created:', layer, layer._latlng);
});*/
