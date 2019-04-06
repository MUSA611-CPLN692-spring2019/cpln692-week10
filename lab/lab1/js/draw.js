// Global Variables
var myRectangle;
var myRectangles = [];
var toggle = {};
const style = {};
var shape = {};

// Initialize Leaflet Draw
var drawControl = new L.Control.Draw({
  draw: {
    polyline: false,
    polygon: false,
    circle: false,
    marker: false,
    rectangle: true,
  }
});

map.addControl(drawControl);

// Event which is run every time Leaflet draw creates a new layer
map.on('draw:created', function (e) {
    var type = e.layerType; // The type of shape[id]
    var layer = e.layer; // The Leaflet layer for the shape[id]
    var id = L.stamp(layer); // The unique Leaflet ID for the layer

/* =====================
Lab 1: Leaflet Draw
===================== */
/* =====================
Task 1: Try to draw something on the map

Try to use one or two of the drawing tools. They should allow you to draw
without needing any additional configuration. These shape[id]s will not be added to
the map. We'll fix that in the next task.
===================== */
// user input

/* =====================
Task 2: Add rectangles to map

Add the rectangle layers to the map when they are drawn. Hint: you can use the
addLayer function that we have used in the past.
===================== */
layer.addTo(map);

/* =====================
Task 3: Limit to one rectangle

For our application, we only want one rectangle to be displayed on the map at
any given time. When a user draws a new rectangle, the old rectangle should be
removed from the map. To remove a previously drawn rectangle, we will need to
store some information about it in a global variable. Use the variable
myRectangle, which is already defined in this document, to store the new Leaflet
layer before adding it to the map.

You will also need to remove the previous layer from the map.

If you get the error: "Cannot read property '_leaflet_id' of undefined", it
may be because you are trying to remove a layer that does not yet exist. Can you
check to see if myRectangle is defined before trying to remove it?
===================== */
if (myRectangle) {map.removeLayer(myRectangle);}
myRectangle = layer;

/* =====================
Task 4: Add shape[id] to sidebar

Let's add the shape[id] we've created to the sidebar. In the HTML, there is a
container with ID #shape[id]s. Use jQuery's append function to add a new div inside
the #shape[id]s container. The idea should look like the following:

<div class="shape[id]" data-leaflet-id="[the id]"><h1>Current ID: [the id]</h1></div>

Where [the id] is replaced by the Leaflet ID of the layer.

When a new layer is added, you can use jQuery's empty function to clear out the
#shape[id]s container before appending a new .shape[id].
===================== */
$('.sidebar').css('display','initial')
$('.shape').remove();
$('.sidebar').append(`
  <div class="shape" data-leaflet-id ="${id}">Current ID: ${id}</div>
`);

/* =====================
Task 5 (Stretch Goal): Store multiple shape[id]s

Instead of showing one shape[id] at a time, let's allow multiple shape[id]s to be drawn.
Instead of storing one Leaflet layer in the myRectangle variable, we should use
an array to store multiple layers. There will also be multiple shape[id]s displayed
in the sidebar.

Change the variable myRectangle to myRectangles and set it to equal an empty
array. Change the rest of your code to push new layers into the array.
===================== */
$('.shape').remove();
myRectangles.push(layer);
myRectangles.forEach(function(layer) { // loop only necessary because $('.shape[id]') is removed earlier
  let id = L.stamp(layer);

  layer.addTo(map);
  $('.sidebar').append(`<div class="shape" data-leaflet-id="${id}">${id}</div>`);

/* =====================
Task 6 (Stretch Goal): Connect sidebar and map

The HTML in the sidebar and the Leaflet layers on the map and in our Javascript
variable can be linked by using the Leaflet ID. Modify the application so that
clicking on a shape[id] in the sidebar will do one of the following:

- Change the color of the corresponding shape[id] on the map
- Delete the corresponding shape[id] on the map (be sure to remove it from the
sidebar and the myRectanges array)
- Anything else you can think of!
===================== */
  shape[id] = `.shape[data-leaflet-id="${id}"]`;

  toggle[id] = true;
  layer.on('click',function(){
    if(toggle[id]) {
      map.removeLayer(layer);
      toggle[id] = !toggle[id];
      $(shape[id]).css('background-color','white');
    }
  });
  $(shape[id]).on('click',function() {
    if(toggle[id]) {
      map.removeLayer(layer);
      toggle[id] = !toggle[id];
    }
    else if(!toggle[id]) {
      layer.addTo(map);
      toggle[id] = !toggle[id];
    }
  });

  Object.defineProperty(style,id,{
    value:layer.options.opacity, // style[id] is immutable
    // value:layer.options,      // style[id] mutable. WHY????
    writable:false
  });
  console.log(style[id]);
  $(shape[id]).on('mouseenter',function(){
    console.log(style[id]);
    layer.setStyle({opacity:0.1});
  });
  $(shape[id]).on('mouseleave',function(){
    console.log(style[id]);
    layer.setStyle({opacity:style[id]});
  });

/* =====================
Task 7 (Stretch Goal): Reverse Task 6

Modify the application so moving your mouse over a rectangle on the map will
highlight (change style in some way) the corresponding element in the sidebar.
Moving your mouse outside of the circle should remove the highlighting.
===================== */
  layer.on('mouseover',function(){
    console.log(style[id]);
    layer.setStyle({opacity:0.1});
    $(shape[id]).css('background-color','#f4f4f4');
  });
  layer.on('mouseout',function(){
    console.log(style[id]);
    layer.setStyle({opacity:style[id]});
    $(shape[id]).css('background-color','white');
  });
});
});
