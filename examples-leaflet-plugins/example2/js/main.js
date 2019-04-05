/* =====================
Leaflet Configuration
===================== */

var map = L.map('map', {
  center: [39.95, -75.16],
  zoom: 14
});
basemapURL = "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";

var Stamen_TonerLite = L.tileLayer(basemapURL, {
  attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  subdomains: 'abcd',
  minZoom: 0,
  maxZoom: 20,
  ext: 'png'
}).addTo(map);
// Plugin. Let's add an option:
L.Control.geocoder({placeholder:"WHERE IM AT"}).addTo(map);


var url = 'https://gist.githubusercontent.com/rossbernet/739cfd731519c8b49dd063779adedbd7/raw/cb1ca853899e9833f02ca0bc272dee74937c5d0c/squaresPoly.geojson';
var jsondata;
$.ajax(url).done(function(res) {
  jsondata = JSON.parse(res);
  layer = L.geoJSON(jsondata).addTo(map)
});
