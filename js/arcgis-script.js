var map;
var timer;
/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = "";
require([
    "dojo/dom",
    "dojo/on",
    "dojo/dom-construct",
    "esri/dijit/Search",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/FeatureLayer",
    "esri/InfoTemplate",
    "esri/sniff",
    "esri/map",
    "dojo/parser",
    "dojo/string",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/tasks/IdentifyTask",
    "esri/tasks/IdentifyParameters",
    "esri/dijit/Popup",
    "dojo/_base/array",
    "esri/Color",
    "esri/geometry/webMercatorUtils",
    "esri/dijit/Scalebar",
    "esri/dijit/HomeButton",
    "esri/dijit/LayerList",
    "dijit/Dialog", "dijit/DialogUnderlay",
    "dojo/keys",
    "esri/SnappingManager",
    "esri/dijit/Measurement",
    "esri/units",

    "dijit/form/CheckBox","dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/TitlePane",
    "dojo/domReady!"
], function(dom, on, domConstruct, Search, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, FeatureLayer, InfoTemplate, has, Map, parser, string,
SimpleFillSymbol, SimpleLineSymbol, IdentifyTask, IdentifyParameters, Popup, arrayUtils, Color, webMercatorUtils, Scalebar, HomeButton,
LayerList, Dialog, DialogUnderlay, keys, SnappingManager, Measurement, Units) {
    parser.parse();

    var identifyTask, identifyParams;

    var popup = new Popup({
      fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
    }, domConstruct.create("div"));

    var map = new Map("map",{
      scale: 250000,
      infoWindow: popup,
      maxScale: 500,
      minScale: 250000,
      slider:false
    });

    var search = new Search({
      enableLabel: false,
      enableInfoWindow: true,
      showInfoWindowOnSelect: true,
      map: map,
      sources: []
    }, "search");

    var sources = search.get("sources");
    sources.push({
      featureLayer: new FeatureLayer("https://gis.uaig.kz:6443/arcgis/rest/services/Map/MapAlm/MapServer/69"),
      searchFields: ["KAD_N"],
      displayField: "KAD_N",
      exactMatch: false,
      outFields: ["*"],
      name: "Кадастровый номер",
      placeholder: "введите кадастровый номер",
      maxResults: 6,
      maxSuggestions: 6,
      infoTemplate: new InfoTemplate("Кадастровый номер", `<table>
        <tr><td class="attrName">Кадастровый номер:</td>  <td class="attrValue">`+"${KAD_N}"+`</td></tr>
        <tr><td class="attrName">Код района:</td>  <td class="attrValue">`+"${CodeR}"+`</td></tr>
        <tr><td class="attrName">Адрес:</td>  <td class="attrValue">`+"${Adress}"+`</td></tr>
        <tr><td class="attrName">Целевое назначение</td>  <td class="attrValue">`+"${Funk}"+`</td></tr>
        <tr><td class="attrName">Площадь зу:</td>  <td class="attrValue">`+"${S}"+`</td></tr>
        <tr><td class="attrName">Право:</td>  <td class="attrValue">`+"${right}"+`</td></tr>
      </table>`),
      enableSuggestions: true,
      autoNavigate: false,
      minCharacters: 0
    });
    sources.push({
      featureLayer: new FeatureLayer("https://gis.uaig.kz:6443/arcgis/rest/services/Map/MapAlm/MapServer/2"),
      searchFields: ["address"],
      displayField: "address",
      exactMatch: false,
      outFields: ["*"],
      name: "Здания и сооружения",
      placeholder: "пример: Ауэзова",
      maxResults: 6,
      maxSuggestions: 6,
      infoTemplate: new InfoTemplate("Здания и сооружения", `<table>
        <tr><td class="attrName">Адрес:</td>  <td class="attrValue">`+"${address}"+`</td></tr>
        <tr><td class="attrName">Этажность:</td>  <td class="attrValue">`+"${FLOOR}"+`</td></tr>
        <tr><td class="attrName">Год постройки:</td>  <td class="attrValue">`+"${YEAR_OF_FO}"+`</td></tr>
        <tr><td class="attrName">Функциональное назначение:</td>  <td class="attrValue">`+"${NAME}"+`</td></tr>
        <tr><td class="attrName">Площадь постройки:</td>  <td class="attrValue">`+"${ZASTR_AREA}"+`</td></tr>
        <tr><td class="attrName">Общая площадь:</td>  <td class="attrValue">`+"${OBSCH_AREA}"+`</td></tr>
        <tr><td class="attrName">Материал строения:</td>  <td class="attrValue">`+"${MATERIAL}"+`</td></tr>
        <tr><td class="attrName">Комментарий:</td>  <td class="attrValue">`+"${NOTE}"+`</td></tr>
        <tr><td class="attrName">Ссылка:</td>  <td class="attrValue">`+"<a target='_blank' href='${links}'>Подробнее</a>"+`</td></tr>
      </table>`),
      enableSuggestions: true,
      autoNavigate: false,
      minCharacters: 0
    });
    search.set("sources", sources);
    search.startup();

    var layer;
    layer = new ArcGISDynamicMapServiceLayer("https://gis.uaig.kz:6443/arcgis/rest/services/Map/MapAlm/MapServer");
    map.addLayer(layer);

    //dojo.keys.copyKey maps to CTRL on windows and Cmd on Mac., but has wrong code for Chrome on Mac
    var snapManager = map.enableSnapping({
      snapKey: has("mac") ? keys.META : keys.CTRL
    });
    var layerInfos = [{
      layer: layer
    }];
    snapManager.setLayerInfos(layerInfos);

    var measurement = new Measurement({
      map: map,
      defaultAreaUnit: Units.SQUARE_METERS,
      defaultLengthUnit: Units.METERS
    }, dom.byId("measurementDiv"));
    measurement.startup();

    var layers_widget = new LayerList({
       map: map,
       showLegend: true,
       showOpacitySlider: true,
       showSubLayers: true,
       layers: [{
          layer: layer,
          id: "Все слои"
       }]
    },"layerList");
    layers_widget.startup();

    var scalebar = new Scalebar({
      map: map,
      scalebarUnit: "metric"
    });

    var home = new HomeButton({
      map: map
    }, "HomeButton");
    home.startup();

    var fulls = document.getElementById("fullscreen_button");
    var zoom_in = document.getElementById("zoom_in");
    var zoom_out = document.getElementById("zoom_out");
    var layers_button = document.getElementById("layers_button");
    var layers_hidden = true;
    dragElement(document.getElementById("my_layers_panel"));
    var measurement_button = document.getElementById("measurement_button");
    var measurement_hidden = true;
    dragElement(document.getElementById("my_measurement_panel"));

    layer.on('load', layerReady);

    function layerReady(){
      elem = document.getElementById("my_map")
      document.getElementById('main_loading').style.display = 'none';
      document.getElementById('search').style.visibility = 'visible';
      document.getElementById('info').style.visibility = 'visible';
      document.getElementById('HomeButton').style.visibility = 'visible';

      map.on("mouse-move", showCoordinates);
      map.on("mouse-drag", showCoordinates);

      fulls.style.visibility = "visible";
      fulls.addEventListener("click", openFullscreen);
      zoom_in.style.visibility = "visible";
      zoom_in.addEventListener("click", my_zoom_in);
      zoom_out.style.visibility = "visible";
      zoom_out.addEventListener("click", my_zoom_out);
      layers_button.style.visibility = "visible";
      layers_button.addEventListener("click", openLayers);
      measurement_button.style.visibility = "visible";
      measurement_button.addEventListener("click", openMeasurements);

      on(search,'select-result', function(e) {
        //console.log ('selected result', e);
        this.map.setScale(1000);
        this.map.centerAt(e.result.feature.geometry.getCentroid());
      });

      map.on("click", executeIdentifyTask);
      //create identify tasks and setup parameters
      identifyTask = new IdentifyTask('https://gis.uaig.kz:6443/arcgis/rest/services/Map/MapAlm/MapServer');

      identifyParams = new IdentifyParameters();
      identifyParams.tolerance = 3;
      identifyParams.returnGeometry = true;
      identifyParams.layerIds = [2];
      identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
      identifyParams.width = map.width;
      identifyParams.height = map.height;

      dragElement(document.getElementsByClassName("esriPopupWrapper")[0]);
    }

    function my_zoom_in(){
      map.setZoom(0);
    }

    function my_zoom_out(){
      map.setZoom(1);
    }

    function openLayers() {
      if(layers_hidden){
        document.getElementById('my_layers_panel').style.visibility = "visible";
        layers_hidden=false;
      }else{
        document.getElementById('my_layers_panel').style.visibility = "hidden";
        layers_hidden=true;
      }
    }

    function openMeasurements() {
      if(measurement_hidden){
        document.getElementById('my_measurement_panel').style.visibility = "visible";
        measurement_hidden=false;
      }else{
        document.getElementById('my_measurement_panel').style.visibility = "hidden";
        measurement_hidden=true;
      }
    }

    function dragElement(elmnt) {
      var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      if (document.getElementById(elmnt.id + "header")) {
        /* if present, the header is where you move the DIV from:*/
        document.getElementById(elmnt.id + "header").onmousedown = dragMouseDown;
      }else if(document.getElementsByClassName("sizer")[0]){
        document.getElementsByClassName("sizer")[0].onmousedown = dragMouseDown;
      }
      /*else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
      }*/

      function dragMouseDown(e) {
        document.getElementsByClassName("pointer")[0].style.visibility = "hidden";
        document.getElementsByClassName("outerPointer")[0].style.visibility = "hidden";
        //console.log(document.getElementsByClassName("esriPopupWrapper")[0].style.right);
        if(document.getElementsByClassName("esriPopupWrapper")[0].style.right == '16px'){
          document.getElementsByClassName("esriPopupWrapper")[0].style.left = '-'+(document.getElementsByClassName("esriPopupWrapper")[0].clientWidth+16)+'px';
          document.getElementsByClassName("esriPopupWrapper")[0].style.right = "auto";
        }else if(document.getElementsByClassName("esriPopupWrapper")[0].style.bottom == '17px'){
          document.getElementsByClassName("esriPopupWrapper")[0].style.top = '-'+(document.getElementsByClassName("esriPopupWrapper")[0].clientHeight+17)+'px';
          document.getElementsByClassName("esriPopupWrapper")[0].style.bottom = "auto";
        }

        e = e || window.event;
        e.preventDefault();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      }

      function closeDragElement() {
        /* stop moving when mouse button is released:*/
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    /* View in fullscreen */
    function openFullscreen() {
      var fullscreenElement = document.fullscreenElement || document.mozFullScreenElement ||
        document.webkitFullscreenElement || document.msFullscreenElement;
      var fulls_event_open = elem.requestFullscreen || elem.mozRequestFullScreen ||
        elem.webkitRequestFullscreen || elem.msRequestFullscreen;
      var fulls_event_close = document.exitFullscreen || document.mozCancelFullScreen ||
        document.webkitExitFullscreen || document.msExitFullscreen;
      if (fullscreenElement) {
        switch(fulls_event_close){
          case document.exitFullscreen:
            document.exitFullscreen();
            break;
          case document.mozCancelFullScreen:
            document.mozCancelFullScreen();
            break;
          case document.webkitExitFullscreen:
            document.webkitExitFullscreen();
            break;
          case document.msExitFullscreen:
            document.msExitFullscreen();
            break;
          default:
            console.log("error");
        }
      } else {
        switch(fulls_event_open){
          case elem.requestFullscreen:
            elem.requestFullscreen();
            break;
          case elem.mozRequestFullScreen:
            elem.mozRequestFullScreen();
            break;
          case elem.webkitRequestFullscreen:
            elem.webkitRequestFullscreen();
            break;
          case elem.msRequestFullscreen:
            elem.msRequestFullscreen();
            break;
          default:
            console.log("error");
        }
      }
    }

    function showCoordinates(evt) {
      //the map is in web mercator but display coordinates in geographic (lat, long)
      var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
      //display mouse coordinates
      dom.byId("info").innerHTML = mp.x.toFixed(3) + " " + mp.y.toFixed(3) + " Градусы";
    }

    function executeIdentifyTask (event) {
      if(!measurement.getTool() && map.getScale()<63000){
        clearTimeout(timer);
        identifyParams.geometry = event.mapPoint;
        identifyParams.mapExtent = map.extent;

        var deferred = identifyTask
          .execute(identifyParams)
          .addCallback(function (response) {
            document.getElementsByClassName("pointer")[0].style.visibility = "visible";
            document.getElementsByClassName("outerPointer")[0].style.visibility = "visible";
            // response is an array of identify result objects
            // Let's return an array of features.
            if(response.length == 0){
              timer = setTimeout(function(){map.infoWindow.hide(); }, 1000);
            }
            return arrayUtils.map(response, function (result) {
              //console.log(result.feature);
              var feature = result.feature;
              var layerName = result.layerName;

              feature.attributes.layerName = layerName;
              if (layerName === 'Здания и сооружения') {
                var my_link = "";
                if(result.feature.attributes.ссылка != ""){
                    my_link = "<a target='_blank' href='${ссылка}'>Подробнее</a>";
                }
                var taxParcelTemplate = new InfoTemplate("${layerName}", `<table>
                  <tr><td class="attrName">Адрес:</td>  <td class="attrValue">`+"${Адрес}"+`</td></tr>
                  <tr><td class="attrName">Этажность:</td>  <td class="attrValue">`+"${Этажность}"+`</td></tr>
                  <tr><td class="attrName">Год постройки:</td>  <td class="attrValue">`+"${Год постройки}"+`</td></tr>
                  <tr><td class="attrName">Функциональное назначение:</td>  <td class="attrValue">`+"${Функциональное назначение}"+`</td></tr>
                  <tr><td class="attrName">Площадь постройки:</td>  <td class="attrValue">`+"${Площадь постройки}"+`</td></tr>
                  <tr><td class="attrName">Общая площадь:</td>  <td class="attrValue">`+"${Общая площадь}"+`</td></tr>
                  <tr><td class="attrName">Материал строения:</td>  <td class="attrValue">`+"${Материал строения}"+`</td></tr>
                  <tr><td class="attrName">Комментарий:</td>  <td class="attrValue">`+"${Комментарий}"+`</td></tr>
                  <tr><td class="attrName">Ссылка:</td>  <td class="attrValue">`+my_link+`</td></tr>
                </table>`);
                feature.setInfoTemplate(taxParcelTemplate);
              }
              return feature;
            });
          });

        map.infoWindow.setFeatures([deferred]);
        map.infoWindow.show(event.mapPoint);
      }
    }

});
