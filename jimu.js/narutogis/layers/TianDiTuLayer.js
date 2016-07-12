define([ "dojo/_base/declare", "dijit/Dialog", "dijit/_WidgetBase",  
		"dijit/_TemplatedMixin", "esri/layers/TiledMapServiceLayer" ,"esri/SpatialReference","esri/geometry/Extent","esri/layers/TileInfo"], function(declare,  
		Dialog, _WidgetBase, _TemplatedMixin, TiledMapServiceLayer,SpatialReference,Extent,TileInfo) {  
		    return declare("TianDiTuLayer", esri.layers.TiledMapServiceLayer, { // create WMTSLayer by extending esri.layers.TiledMapServiceLayer

		        type: "tianditumap",
                _hosts: new Array("t0", "t1", "t2", "t3", "t4", "t5", "t6", "t7"),
            constructor: function(){  
            this.spatialReference = new esri.SpatialReference({  
                wkid: 4326
            });  
            this.initialExtent = new esri.geometry.Extent(-180, -90, 180, 90, this.spatialReference);
            this.fullExtent = new esri.geometry.Extent(-180, -90, 180, 90, this.spatialReference);
            //  
            this.tileInfo = new esri.layers.TileInfo({  
                "dpi": "90.71428571427429",  
                "format": "image/png",  
                "compressionQuality": 0,  
                "spatialReference": {  
                    "wkid": "4326"
                },  
                "rows": 256,  
                "cols": 256,  
                "origin": {  
                    "x": -180,
                    "y": 90
                },
                          
                // Scales in DPI 96  
                "lods": [
                    {"level": 0,"scale": 2.95498e+008,"resolution":  0.703125
                }, {"level": 1,"scale": 1.47749e+008,"resolution": 0.351563
                }, {"level": 2,"scale": 7.38744e+007,"resolution": 0.175781
                }, {"level": 3,"scale": 3.69372e+007,"resolution": 0.0878906
                }, {"level": 4,"scale": 1.84686e+007,"resolution": 0.0439453
                }, {"level": 5,"scale": 9.2343e+006,"resolution": 0.0219727
                }, {"level": 6,"scale": 4.61715e+006,"resolution": 0.0109863
                }, {"level": 7,"scale": 2.30857e+006,"resolution": 0.00549316
                }, {"level": 8,"scale": 1.15429e+006,"resolution": 0.00274658
                }, {"level": 9,"scale": 577144,"resolution": 0.00137329
                }, {"level": 10,"scale": 288572,"resolution": 0.000686646
                }, {"level": 11,"scale": 144286,"resolution": 0.000343323
                }, {"level": 12,"scale": 72143,"resolution": 0.000171661
                }, {"level": 13,"scale": 36071.5,"resolution": 8.58307e-005
                }, {"level": 14,"scale": 18035.7,"resolution": 4.29153e-005
                }, {"level": 15,"scale": 9017.87,"resolution": 2.14577e-005
                }, {"level": 16,"scale": 4508.9,"resolution": 1.07289e-005
                }, {"level": 17,"scale": 2254.47,"resolution": 5.36445e-006
                }]

            });
            this.loaded = true;  
            this.onLoad(this);  
        },  
        getTileUrl: function(level, row, col){
            var index = Math.abs(col%7);
            var host = this._hosts[index];
            var url = "";
            if( this.type == "tianditumap")
            {
                url="http://"+host+".tianditu.cn/vec_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=vec&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;
            }
            if (this.type == "tianditumapi")
            {
                url="http://"+host+".tianditu.cn/cva_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cva&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;
            }
            if(this.type == "tianditutrain")
            {
                url="http://"+host+".tianditu.cn/ter_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ter&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;
            }
            if(this.type == "tianditutraini")
            {
                url="http://"+host+".tianditu.cn/cta_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cta&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;
            }
            if (this.type == "tiandituimage")
            {
                url="http://"+host+".tianditu.cn/img_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;

            }
            if(this.type == "tiandituimagei")
            {
                url="http://"+host+".tianditu.cn/cia_c/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=c&FORMAT=tiles&TILEMATRIX="+(level+1)+"&TILECOL="+col+"&TILEROW="+ row;
            }
            return url;
        },
        setType: function (type) {


        }
    });  
});  