define([
        'dojo/_base/declare',
        'dojo/_base/lang',
        'jimu/BaseWidget',
        'dojo/_base/html',
        'dojo/dom-construct',
        'dojo/topic',
        'esri/layers/GraphicsLayer',
        'esri/graphic',
        'dojo/_base/array',
        'dojox/xml/parser',
        'esri/geometry/Point',
        'esri/geometry/Polygon',
        'esri/geometry/Extent',
        'esri/symbols/SimpleMarkerSymbol',
        'esri/symbols/SimpleLineSymbol',
        'esri/symbols/SimpleFillSymbol',
        "dijit/Menu",
        "dijit/MenuItem",
        "dijit/MenuSeparator",
        "esri/toolbars/navigation",
        'dojo/request/xhr',
        "esri/tasks/QueryTask",
        "esri/tasks/query",
        'jimu/LayerInfos/LayerInfos'
    ],
    function (declare,
              lang,
              BaseWidget,
              html,
              domConstruct,
              topic,
              GraphicsLayer,
              Graphic,
              array,
              parser,
              Point,
              Polygon,
              Extent,
              SimpleMarkerSymbol,
              SimpleLineSymbol,
              SimpleFillSymbol,
              Menu,
              MenuItem,
              MenuSeparator,
              Navigation,
              xhr,
              QueryTask,
              Query,
              LayerInfos

    ) {
        var clazz = declare([BaseWidget], {

            name: 'CommonBase',
            baseClass: 'jimu-widget-commonbase',
            postCreate: function () {
                var itemInfo = this._obtainMapLayers();
                LayerInfos.getInstance(this.map, itemInfo);
            },
            _obtainMapLayers: function() {
                // summary:
                //    obtain basemap layers and operational layers if the map is not webmap.
                var basemapLayers = [],
                    operLayers = [];
                // emulate a webmapItemInfo.
                var retObj = {
                    itemData: {
                        baseMap: {
                            baseMapLayers: []
                        },
                        operationalLayers: []
                    }
                };
                array.forEach(this.map.graphicsLayerIds, function(layerId) {
                    var layer = this.map.getLayer(layerId);
                    if (layer.isOperationalLayer) {
                        operLayers.push({
                            layerObject: layer,
                            title: layer.label || layer.title || layer.name || layer.id || " ",
                            id: layer.id || " "
                        });
                    }
                }, this);
                array.forEach(this.map.layerIds, function(layerId) {
                    var layer = this.map.getLayer(layerId);
                    if (layer.isOperationalLayer) {
                        operLayers.push({
                            layerObject: layer,
                            title: layer.label || layer.title || layer.name || layer.id || " ",
                            id: layer.id || " "
                        });
                    } else {
                        basemapLayers.push({
                            layerObject: layer,
                            id: layer.id || " "
                        });
                    }
                }, this);

                retObj.itemData.baseMap.baseMapLayers = basemapLayers;
                retObj.itemData.operationalLayers = operLayers;
                return retObj;
            },

            startup: function () {
                this.inherited(arguments);

                //this.map.on("click",lang.hitch(this,this.mapClick)); //监听住click事件
                //根据默认的条件过滤东西
                this.getDefaultFilter();
            },
            mapClick:function (evt){
                console.log(evt.mapPoint);
            },
            initLayer:function(){
                this.layer = new GraphicsLayer();
                this.map.addLayer(this.layer);
            },
            getDefaultFilter: function () {
                var params = window.urlParams;

                if(params.hasOwnProperty("x")&&params.hasOwnProperty("y")){
                    //
                    this.locateToXY(params["x"],params["y"]);
                }
            },
            locateToXY:function(lgtd,lttd){
                //直接定位

                setTimeout(lang.hitch(this,function(){
                    var centerPt = new Point(Number(lgtd),Number(lttd),this.map.spatialReference);
                    this.map.centerAndZoom(centerPt,7);
                }),1*1000);
            }
        });
        return clazz;
    });