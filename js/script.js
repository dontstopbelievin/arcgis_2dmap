var map;
var timer;
/* Get the documentElement (<html>) to display the page in fullscreen */
var elem = document.documentElement;
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
      featureLayer: new FeatureLayer("https://gis.uaig.kz/server/rest/services/Map2d/объекты_города/MapServer/20"),
      searchFields: ["kad_n"],
      displayField: "kad_n",
      exactMatch: false,
      outFields: ["*"],
      name: "Кадастровый номер",
      placeholder: "введите кадастровый номер",
      maxResults: 6,
      maxSuggestions: 6,
      infoTemplate: new InfoTemplate("Кадастровый номер", `<table>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Кадастровый номер:</td>  <td class="attrValue">`+"${kad_n}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Код района:</td>  <td class="attrValue">`+"${coder}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Адрес:</td>  <td class="attrValue">`+"${adress}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Целевое назначение</td>  <td class="attrValue">`+"${funk}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Площадь зу:</td>  <td class="attrValue">`+"${s}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Право:</td>  <td class="attrValue">`+"${right_}"+`</td></tr>
      </table>`),
      enableSuggestions: true,
      autoNavigate: false,
      minCharacters: 0
    });
    sources.push({
      featureLayer: new FeatureLayer("https://gis.uaig.kz/server/rest/services/Map2d/Базовая_карта_MIL1/MapServer/16"),
      searchFields: ["street_name_1"],
      displayField: "street_name_1",
      exactMatch: false,
      outFields: ["*"],
      name: "Здания и сооружения",
      placeholder: "пример: Ауэзова",
      maxResults: 6,
      maxSuggestions: 6,
      infoTemplate: new InfoTemplate("Здания и сооружения", `<table>
        <tr style="background-color: rgba(0, 0, 255, 0.05);width:100%"><td class="attrName">Адресный массив:</td>  <td class="attrValue">`+"${id_adr_massive}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Количество этажей:</td>  <td class="attrValue">`+"${floor}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Год постройки:</td>  <td class="attrValue">`+"${year_of_foundation}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Общая площадь:</td>  <td class="attrValue">`+"${obsch_area}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Объем здания, м3:</td>  <td class="attrValue">`+"${volume_build}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Площадь жил. помещения:</td>  <td class="attrValue">`+"${zhil_area}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Площадь застройки, м2:</td>  <td class="attrValue">`+"${zastr_area}"+`</td></tr>
        <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Наименование первичной улицы:</td>  <td class="attrValue">`+"${street_name_1}"+`</td></tr>
        <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Основной номер дома:</td>  <td class="attrValue">`+"${number_1}"+`</td></tr>
      </table>`),
      enableSuggestions: true,
      autoNavigate: false,
      minCharacters: 0
    });
    search.set("sources", sources);
    search.startup();

    var layer, layer2;
    layer = new ArcGISDynamicMapServiceLayer("http://gis.uaig.kz/server/rest/services/Map2d/Базовая_карта_MIL1/MapServer");
    layer2 = new ArcGISDynamicMapServiceLayer("http://gis.uaig.kz/server/rest/services/Map2d/объекты_города/MapServer");
    map.addLayer(layer);
    map.addLayer(layer2);

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
          id: "Базовая_карта_MIL1"
       },{
          layer: layer2,
          id: "Объекты города"
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
    var popup_minimized = false;

    layer.on('load', layerReady);

    function layerReady(){console.log(layer);

      //elem = document.getElementById('testing');

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
      document.getElementsByClassName("titleButton maximize")[0].addEventListener("click", minimize_popup);

      on(search,'select-result', function(e) {
        //console.log ('selected result', e);
        this.map.setScale(1000);
        this.map.centerAt(e.result.feature.geometry.getCentroid());
      });

      map.on("click", executeIdentifyTask);
      //create identify tasks and setup parameters
      identifyTask = new IdentifyTask('https://gis.uaig.kz/server/rest/services/Map2d/Базовая_карта_MIL1/MapServer');

      identifyParams = new IdentifyParameters();
      identifyParams.tolerance = 3;
      identifyParams.returnGeometry = true;
      identifyParams.layerIds = [16];
      identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_VISIBLE;
      identifyParams.width = map.width;
      identifyParams.height = map.height;
    }

    function minimize_popup(event){
      event.preventDefault();
      if(popup_minimized){
        document.getElementsByClassName('contentPane')[0].style.display = 'block';
        document.getElementsByClassName('actionsPane')[0].style.display = 'block';
        popup_minimized = false;
      }else{
        document.getElementsByClassName('contentPane')[0].style.display = 'none';
        document.getElementsByClassName('actionsPane')[0].style.display = 'none';
        popup_minimized = true;
      }

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
            document.getElementsByClassName('contentPane')[0].style.display = 'block';
            document.getElementsByClassName('actionsPane')[0].style.display = 'block';
            popup_minimized = false;
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
                var taxParcelTemplate = new InfoTemplate("${layerName}", `<table>
                  <tr style="background-color: rgba(0, 0, 255, 0.05);width:100%"><td class="attrName">Адресный массив:</td>  <td class="attrValue">`+"${Адресный массив}"+`</td></tr>
                  <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Количество этажей:</td>  <td class="attrValue">`+"${Количество этажей}"+`</td></tr>
                  <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Год постройки:</td>  <td class="attrValue">`+"${Год постройки}"+`</td></tr>
                  <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Общая площадь:</td>  <td class="attrValue">`+"${Общая площадь}"+`</td></tr>
                  <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Объем здания, м3:</td>  <td class="attrValue">`+"${Объем здания, м3}"+`</td></tr>
                  <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Площадь жил. помещения:</td>  <td class="attrValue">`+"${Площадь жил. помещения}"+`</td></tr>
                  <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Площадь застройки, м2:</td>  <td class="attrValue">`+"${Площадь застройки, м2}"+`</td></tr>
                  <tr style="background-color: rgba(0, 255, 0, 0.05);"><td class="attrName">Наименование первичной улицы:</td>  <td class="attrValue">`+"${Наименование первичной улицы}"+`</td></tr>
                  <tr style="background-color: rgba(0, 0, 255, 0.05);"><td class="attrName">Основной номер дома:</td>  <td class="attrValue">`+"${Основной номер дома}"+`</td></tr>
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
