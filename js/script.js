require([
  "esri/layers/MapImageLayer",
  "esri/layers/TileLayer",
  "esri/Map",
  "esri/views/MapView",
  "dojo/dom",  // require dojo/dom for getting the DOM element
  "dojo/on",
  "dojo/domReady!"
], function(Map, MapView, MapImageLayer, dom, on){

  var city_layer = new MapImageLayer({
    id: "ny-housing",
    url: "https://gis.uaig.kz:6443/arcgis/rest/services/Map/MapAlm/MapServer"
  });

  var map = new Map({
    layers: [city_layer]
  });

  var view = new MapView({
    container: "viewDiv",  // Reference to the scene div created in step 5
    map: map,  // Reference to the map object created before the scene
  });

  var streetsLayerToggle = dom.byId("streetsLayer");

    // Listen to the onchange event for the checkbox
    on(streetsLayerToggle, "change", function(){
      // When the checkbox is checked (true), set the layer's visibility to true
    city_layer.visible = streetsLayerToggle.checked;
  });

    view.on("layerview-create", function(event) {
        if (event.layer.id === "ny-housing") {
          // Explore the properties of the housing layer's layer view here
          console.log("LayerView for New York housing density created!", event.layerView);
        }
    });

    city_layer.when(function() {
      view.goTo(city_layer.fullExtent);
    });

});
