define([
    'dojo/_base/declare',
    'jimu/BaseWidget',
    'dojo/_base/lang',
    'dojo/Deferred',
    "jimu/dijit/Message",
    'jimu/dijit/LoadingShelter',
    './Print',
    "esri/request"
  ],
  function(
    declare, BaseWidget, lang, Deferred,
    Message, LoadingShelter, Print, esriRequest

  ) {
    return declare([BaseWidget], {
      baseClass: 'jimu-widget-print',
      name: 'Print',
      className: 'esri.widgets.Print',
      _portalPrintTaskURL: null,

      postCreate: function() {
        this.inherited(arguments);

        this.shelter = new LoadingShelter({
          hidden: true
        });
        this.shelter.placeAt(this.domNode);
        this.shelter.startup();
      },

      startup: function() {
        this.inherited(arguments);
      
        this._initPrinter();
      },

      _initPrinter: function() {
        this.print = new Print({
          map: this.map,
          appConfig: this.appConfig,
          printTaskURL: this.config.serviceURL,
          defaultAuthor: this.config.defaultAuthor,
          defaultCopyright: this.config.defaultCopyright,
          defaultTitle: this.config.defaultTitle,
          defaultFormat: this.config.defaultFormat,
          defaultLayout: this.config.defaultLayout,
          nls: this.nls,
          async: false//这块可能变
        });
        this.print.placeAt(this.printNode);
        this.print.startup();
      }



    });
  });