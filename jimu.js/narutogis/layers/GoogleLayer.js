define([ "dojo/_base/declare", "dijit/Dialog", "dijit/_WidgetBase",  
		"dijit/_TemplatedMixin", "esri/layers/TiledMapServiceLayer" ,"esri/SpatialReference","esri/geometry/Extent","esri/layers/TileInfo"], function(declare,  
		Dialog, _WidgetBase, _TemplatedMixin, TiledMapServiceLayer,SpatialReference,Extent,TileInfo) {  
		    return declare("GoogleLayer", esri.layers.TiledMapServiceLayer, { // create WMTSLayer by extending esri.layers.TiledMapServiceLayer  

		        type: "googlemap",

            constructor: function(){  
            this.spatialReference = new esri.SpatialReference({  
                wkid: 102100  
            });  
            this.initialExtent = new esri.geometry.Extent(-20037508.342787, -20037508.342787, 20037508.342787, 20037508.342787, this.spatialReference);  
            this.fullExtent = new esri.geometry.Extent(-20037508.342787, -20037508.342787, 20037508.342787, 20037508.342787, this.spatialReference);  
            //  
            this.tileInfo = new esri.layers.TileInfo({  
                "dpi": "90.71428571427429",  
                "format": "image/png",  
                "compressionQuality": 0,  
                "spatialReference": {  
                    "wkid": "3857"  
                },  
                "rows": 256,  
                "cols": 256,  
                "origin": {  
                    "x": -20037508.342787,  
                    "y": 20037508.342787  
                },  
                          
                // Scales in DPI 96  
                "lods": [{"level": 0,"scale": 591657527.591555,"resolution": 156543.033928  
                }, {"level": 1,"scale": 295828763.795777,"resolution": 78271.5169639999  
                }, {"level": 2,"scale": 147914381.897889,"resolution": 39135.7584820001  
                }, {"level": 3,"scale": 73957190.948944,"resolution": 19567.8792409999  
                }, {"level": 4,"scale": 36978595.474472,"resolution": 9783.93962049996  
                }, {"level": 5,"scale": 18489297.737236,"resolution": 4891.96981024998  
                }, {"level": 6,"scale": 9244648.868618,"resolution": 2445.98490512499  
                }, {"level": 7,"scale": 4622324.434309,"resolution": 1222.99245256249  
                }, {"level": 8,"scale": 2311162.217155,"resolution": 611.49622628138  
                }, {"level": 9,"scale": 1155581.108577,"resolution": 305.748113140558  
                }, {"level": 10,"scale": 577790.554289,"resolution": 152.874056570411  
                }, {"level": 11,"scale": 288895.277144,"resolution": 76.4370282850732  
                }, {"level": 12,"scale": 144447.638572,"resolution": 38.2185141425366  
                }, {"level": 13,"scale": 72223.819286,"resolution": 19.1092570712683  
                }, {"level": 14,"scale": 36111.909643,"resolution": 9.55462853563415  
                }, {"level": 15,"scale": 18055.954822,"resolution": 4.77731426794937  
                }, {"level": 16,"scale": 9027.977411,"resolution": 2.38865713397468  
                }, {"level": 17,"scale": 4513.988705,"resolution": 1.19432856685505  
                }, {"level": 18,"scale": 2256.994353,"resolution": 0.597164283559817  
                }, {"level": 19,"scale": 1128.497176,"resolution": 0.298582141647617  
                }]  
            });  
            this.loaded = true;  
            this.onLoad(this);  
        },  
        getTileUrl: function(level, row, col){  
            if (this.type=="googlemap")
            { 
                return "http://mt" + (col % 4) + ".google.cn/vt/lyrs=m@275000000&hl=zh-CN&gl=CN&src=app&expIds=201527&rlbl=1&" + "x=" + col + "&" +
                          "y=" +
                          row +
                          "&" +
                          "z=" +
                          level +
                          "&s=Gali";
            }else if(this.type=="googleimage")
            {
                //http://mt1.google.cn/vt/lyrs=s@158&hl=zh-CN&gl=CN&src=app&expIds=201527&rlbl=1&x=843&y=387&z=10&s=Gali
                return "http://mt" + (col % 4) + ".google.cn/vt/lyrs=s@158&hl=zh-CN&gl=CN&src=app&expIds=201527&rlbl=1&" + "x=" + col + "&" +
                         "y=" +
                         row +
                         "&" +
                         "z=" +
                         level +
                         "&s=Gali";
            
            } else if (this.type == "googletrain") {
                return "http://mt" + (col % 4) + ".google.cn/vt/lyrs=t@275000000&hl=zh-CN&gl=CN&src=app&expIds=201527&rlbl=1&" + "x=" + col + "&" +
                             "y=" +
                             row +
                             "&" +
                             "z=" +
                             level +
                             "&s=Gali";
            } else if (this.type == "googlepoi") {
                return "http://mt" + (col % 4) + ".google.cn/vt/imgtp=png32&lyrs=h@275000000&hl=zh-CN&gl=CN&src=app&expIds=201527&rlbl=1&" + "x=" + col + "&" +
                            "y=" +
                            row +
                            "&" +
                            "z=" +
                            level +
                            "&s=Gali";
            }
            
        },
        setType: function (type) {


        }
    });  
});  