///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
    'jimu/BaseWidget',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/_base/html',
    'dojo/dom',
    'dojo/on',
    'dojo/query',
    'dojo/topic',
    'dijit/registry',
    './LayerListView',
    './NlsStrings',
    'jimu/LayerInfos/LayerInfos',
      "esri/layers/ArcGISDynamicMapServiceLayer",
      "esri/dijit/LayerList"
  ],
  function(BaseWidget,
           declare,
           lang,
           array,
           html,
           dom,
           on,
            query,
            topic,
            registry,
            LayerListView,
            NlsStrings,
            LayerInfos,
            ArcGISDynamicMapServiceLayer,
            LayerList
            ) {

    var clazz = declare([BaseWidget], {
      //these two properties is defined in the BaseWiget
      baseClass: 'jimu-widget-layerList',
      name: 'layerList',

      //layerListView: Object{}
      //  A module is responsible for show layers list
      layerListView: null,

      //operLayerInfos: Object{}
      //  operational layer infos
      operLayerInfos: null,

      addBaseControl:function(){

        //获取isOperationalLayer的类型的图层
        var layers = this.map.layerIds;
        var baseLists = [];
        var opLists = [];
        for (var i = 0; i < layers.length; i++) {
          var layer = this.map.getLayer(layers[i]);
          if (layer.isOperationalLayer) {
            opLists.push({layer:layer});
            if(layer.id=="不动产图层"){
              this.opLayer = layer;
            }

          }else{
            baseLists.push({layer:layer});
          }
        }
        //基础底图展示
        var baseList = new LayerList({
          map: this.map,
          showSubLayers: true,
          layers: baseLists.reverse()
        },this.baseMapsDiv);
        baseList.startup();
        //业务图层展示
        var opList = new LayerList({
          map: this.map,
          showSubLayers: true,
          layers: opLists
        },this.baseMapsDiv2);
        opList.startup();

        //setTimeout(lang.hitch(this,function(){
        //  this.reSetDefinitions2Layer([]);
        //}),10*1000);
      },
      reSetDefinitions2Layer:function(layerDefinitions){
        //var layerDefinitions = [];
        //layerDefinitions[4] = "OBJECTID=3";
        //layerDefinitions[8] = "OBJECTID=2";
        this.opLayer.setLayerDefinitions(layerDefinitions);
      },

      startup: function() {
        this.inherited(arguments);
        topic.subscribe("map/layer/definitions",lang.hitch(this,this.reSetDefinitions2Layer)  );

        NlsStrings.value = this.nls;

        this.addBaseControl();


        var itemInfo = this._obtainMapLayers();
        LayerInfos.getInstance(this.map, itemInfo)
          .then(lang.hitch(this, function(operLayerInfos) {
            this.operLayerInfos = operLayerInfos;
            this.showLayers();
            this.bindEvents();
          }));
      },

      destroy: function() {
        this._clearLayers();
        this.inherited(arguments);
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

      showLayers: function() {
        // summary:
        //    create a LayerListView module used to draw layers list in browser.
        html.setStyle(this.layersSection,"display","block")
        this.layerListView = new LayerListView({
          operLayerInfos: this.operLayerInfos,
          layerListWidget: this,
          config: this.config
        }).placeAt(this.layerListBody);
      },

      _clearLayers: function() {
        // summary:
        //   clear layer list
        //domConstruct.empty(this.layerListTable);
        if (this.layerListView && this.layerListView.destroyRecursive) {
          this.layerListView.destroyRecursive();
        }
      },

      _refresh: function() {
        this._clearLayers();
        this.showLayers();
      },

      /****************
       * Event
       ***************/
      bindEvents: function() {
        // summary:
        //    bind events are listened by this module
        this.own(on(this.operLayerInfos,
          'layerInfosChanged',
          lang.hitch(this, this._onLayerInfosChanged)));

        this.own(on(this.operLayerInfos,
          'tableInfosChanged',
          lang.hitch(this, this._onLayerInfosChanged)));

        this.own(this.operLayerInfos.on('layerInfosIsVisibleChanged',
          lang.hitch(this, this._onLayerInfosIsVisibleChanged)));

        this.own(on(this.operLayerInfos,
          'updated',
          lang.hitch(this, this._onLayerInfosObjUpdated)));
      },

      _onLayerInfosChanged: function(/*layerInfo, changedType*/) {
        this._refresh();
      },

      _onLayerInfosIsVisibleChanged: function(changedLayerInfos) {
        array.forEach(changedLayerInfos, function(layerInfo) {
          query("[class~='visible-checkbox-" + layerInfo.id + "']", this.domNode)
          .forEach(function(visibleCheckBoxDomNode) {
            var visibleCheckBox = registry.byNode(visibleCheckBoxDomNode);
            if(layerInfo.isVisible()) {
              visibleCheckBox.check();
            } else {
              visibleCheckBox.uncheck();
            }
          }, this);

        });
      },

      _onLayerInfosObjUpdated: function() {
        this._refresh();
      },

      onAppConfigChanged: function(appConfig, reason, changedData){
        /*jshint unused: false*/
        this.appConfig = appConfig;
      }
    });

    return clazz;
  });