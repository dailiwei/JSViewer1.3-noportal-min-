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

define(['dojo/_base/declare',
        'dojo/_base/html',
        'dojo/_base/lang',
        'dojo/query',
        'dijit/_WidgetsInTemplateMixin',
        "esri/layers/ArcGISDynamicMapServiceLayer",
        "esri/dijit/LayerList",
        'jimu/BaseWidget',
        "esri/layers/MapImage",
        "esri/layers/MapImageLayer",
        "esri/geometry/Point"
    ],
    function (declare,
              html,
              lang,
              query,
              _WidgetsInTemplateMixin,
              ArcGISDynamicMapServiceLayer,
              LayerList,
              BaseWidget,
              MapImage,
              MapImageLayer,
              Point
    ) {
        var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
            baseClass: 'jimu-widget-about',
            // clasName: 'esri.widgets.About',

            _hasContent: null,

            postCreate: function () {
                this.inherited(arguments);

                this._hasContent = this.config.about && this.config.about.aboutContent;
            },

            startup: function () {
                this.inherited(arguments);
                this.layer = new MapImageLayer();
                this.map.addLayer(this.layer);

                this.addLayer();
            },


            addLayer: function () {
                var mi = new MapImage({
                    'extent': { 'xmin': 115.491869, 'ymin': 29.543414, 'xmax': 116.210088, 'ymax': 29.842630},
                    'href': "images/clouds/360000-V1-A11-363-02_87.png"
                });
                this.layer.addImage(mi);
                this.map.centerAt(new Point(115.491869,29.543414));

            }
        });
        return clazz;
    });