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
        'dojo/request/xhr',
        "esri/tasks/QueryTask",
        "esri/tasks/query",
        "dojo/Deferred"
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
              xhr,
              QueryTask,
              Query,
              Deferred

    ) {
        var clazz = declare([BaseWidget], {

            name: 'QueryPop',
            baseClass: 'jimu-widget-QueryPop',
            postCreate: function () {
                this.inherited(arguments);
                //监听map的点击时间
                this.map.on("click",lang.hitch(this,this.mapClick)); //监听住click事件
            },

            startup: function () {
                this.inherited(arguments);
            },
            mapClick:function (evt){
                //获取当前点击的位置信息
                var mp = evt.mapPoint;
                //去server后台查询：
                this.getLayerResult(mp).then(lang.hitch(this,function(data){
                    console.dir(data);
                    //features，就是点击查询出来的所有的图形，不见得是一个，因为作图的时候可能把几个图层覆盖
                    //现在默认为是一个图形被选择出来 attributes是图形的属性，字段信息
                    console.dir(data.features[0].attributes);
                    //data 里面有所有的数据
                    window.open("http://www.narutogis.com","_blank");
                }));
            },
            getLayerResult:function(point){

                var defer = new Deferred();
                //op_url 是图层的地图地址 需要修改成你自己的，我这里写死的，可以配置到config.json 就是全局的那个
                var url  = this.appConfig.op_url?appConfig.op_url:"http://www.rwworks.com:6080/arcgis/rest/services/2015shp/MapServer/7";

                //查询图层的接口，调用arcgisserver的查询服务， http://www.rwworks.com:6080/arcgis/rest/services/2015shp/MapServer/7/query
                var queryTask = new QueryTask(url);

                //构造查询参数对象
                var query = new Query();
                //不返回图形信息，只返回属性信息
                query.returnGeometry = false;
                //设置当前的点的位置的参数作为，查询图形
                query.geometry = point;
                //query.outFields = ["CNNM","CNNMCD"];//返回字段 单独指定
                query.outFields = ["*"];//返回字段 所有的
                //query.where = "FID='"+"0"+"'";;//类似SQL的语句
                query.where = "1=1";//查询全部
                //指定返回的投影坐标系
                query.outSpatialReference = this.map.spatialReference;

                dojo.connect(queryTask, "onComplete",lang.hitch(this, function(featureSet) {

                    if(featureSet){
                        defer.resolve(featureSet);
                    }else{
                        defer.resolve([]);
                    }
                }));
                queryTask.execute(query);
                return defer;
            }


        });
        return clazz;
    });