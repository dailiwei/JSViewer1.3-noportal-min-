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
        'dojo/dom',
        'dojo/on',
        'dojo/query',
        'dojo/topic',
        'dijit/registry',
        './NlsStrings',
        "esri/dijit/LayerList"
    ],
    function (BaseWidget,
              declare,
              lang,
              array,
              dom,
              on,
              query,
              topic,
              registry,
              NlsStrings,
              LayerList) {

        var clazz = declare([BaseWidget], {
            //these two properties is defined in the BaseWiget
            baseClass: 'jimu-widget-layerList',
            name: 'layerList',

            //layerListView: Object{}
            //  A module is responsible for show layers list
            layerListView: null,

            operLayerInfos: null,

            addBaseControl: function () {

                //获取isOperationalLayer的类型的图层
                var layers = this.map.layerIds;
                var baseLists = [];
                var opLists = [];
                for (var i = 0; i < layers.length; i++) {
                    var layer = this.map.getLayer(layers[i]);
                    if (layer.isOperationalLayer) {
                        opLists.push({layer: layer});
                        if (layer.id == "不动产图层") {
                            this.opLayer = layer;
                        }

                    } else {
                        baseLists.push({layer: layer});
                    }
                }
                //基础底图展示
                var baseList = new LayerList({
                    map: this.map,
                    showSubLayers: true,
                    layers: baseLists.reverse()
                }, this.baseMapsDiv);
                baseList.startup();
                //业务图层展示
                var opList = new LayerList({
                    map: this.map,
                    showSubLayers: true,
                    layers: opLists.reverse()
                }, this.baseMapsDiv2);
                opList.startup();

                //setTimeout(lang.hitch(this,function(){
                //  this.reSetDefinitions2Layer([]);
                //}),10*1000);
            },
            reSetDefinitions2Layer: function (layerDefinitions) {
                //var layerDefinitions = [];
                //layerDefinitions[4] = "OBJECTID=3";
                //layerDefinitions[8] = "OBJECTID=2";
                this.opLayer.setLayerDefinitions(layerDefinitions);
            },

            startup: function () {
                this.inherited(arguments);
                topic.subscribe("map/layer/definitions", lang.hitch(this, this.reSetDefinitions2Layer));

                NlsStrings.value = this.nls;

                this.addBaseControl();
            },

            destroy: function () {
                this._clearLayers();
                this.inherited(arguments);
            }


        });

        return clazz;
    });