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
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/config',
  'dojo/cookie',
  'dojo/Deferred',
  'dojo/promise/all',
  'dojo/request/xhr',
  './utils',
  './WidgetManager',
  './shared/utils',
  './tokenUtils',
  './AppStateManager',
  'esri/IdentityManager',
  'esri/config',
  'esri/urlUtils',
  'esri/arcgis/utils'
],
function (declare, lang, array, html, dojoConfig, cookie,
  Deferred, all, xhr, jimuUtils, WidgetManager, sharedUtils, tokenUtils,
   AppStateManager, IdentityManager, esriConfig, esriUrlUtils,
  arcgisUtils) {
  var instance = null, clazz;

  clazz = declare(null, {
    urlParams: null,
    appConfig: null,
    rawAppConfig: null,
    configFile: null,
    _configLoaded: false,
    portalSelf: null,

    constructor: function (urlParams, options) {
      this._removeHash(urlParams);
      this.urlParams = urlParams || {};
      this.widgetManager = WidgetManager.getInstance();
      lang.mixin(this, options);
    },

    /****************************************************
    * The app accept the following URL parameters:
    * ?config=<abc-config.json>, this is a config file url
    * ?id=<123>, the id is WAB app id, which is created from portal.
          URL has this parameter means open WAB app from portal.
    * ?appid=<123>, the appid is portal/AGOL app id, which is created from portal/AGOL template.
          The template is created from WAB's app.
          When URL has this parameter, we'll check whether the app is launched
          in portal/AGOL, or not in portal/AGOL.
          > IF in portal, we'll use the appid to get portal/AGOL template id and app data,
          then get WAB app id, then get WAB app config, then merge config;
          > IF NOT in portal, we'll use the appid to get app data, then merge the data
          to WAB app config.
        How to check whether the app is in portal?
          When try to load config file, if URL has no config or id parameter, we'll load
          <app>/config.json file. If the app is in XT, the portalUrl in config.json is not empty.
          If the app is in portal/AGOL, the app is stemapp indeed, which portalUrl is empty.
          So, if portal url is empty, we consider the app is in portal. However, the exception is
          launch stemapp directly. The solution is the XT builder will write "wab_portalurl" cookie
          for stemapp. So, if we find this cookie, we know the app is not in portal.
    * ?itemid=<itemid>, this webmap item will override the itemid in app config
    * ?mode=<config|preview>, this is for internal using purpose
    * ?URL parameters that affect map extent
    ********************************************************/
    loadConfig: function () {
      console.time('Load Config');
      return this._tryLoadConfig().then(lang.hitch(this, function(appConfig) {
        var err = this.checkConfig(appConfig);
        if (err) {
          throw err;
        }
        this.rawAppConfig = lang.clone(appConfig);
        AppStateManager.getInstance().setRawAppConfig(this.rawAppConfig);
        appConfig = this._upgradeAppConfig(appConfig);
        this._processAfterTryLoad(appConfig);
        this.appConfig = appConfig;

        return this.loadWidgetsManifest(appConfig).then(lang.hitch(this, function() {
          return this._upgradeAllWidgetsConfig(appConfig);
        })).then(lang.hitch(this, function() {
          this._configLoaded = true;
          if(appConfig.title){
              document.title = appConfig.title;
          }
          return this.getAppConfig();
        }));

      }), lang.hitch(this, function(err){
        this.showError(err);
      }));
    },

    getAppConfig: function(){
      var c = lang.clone(this.appConfig);
      c.getConfigElementById = function(id){
        return jimuUtils.getConfigElementById(this, id);
      };

      c.getConfigElementsByName = function(name){
        return jimuUtils.getConfigElementsByName(this, name);
      };

      c.visitElement = function(cb){
        jimuUtils.visitElement(this, cb);
      };

      this._addAuthorizedCrossOriginDomains(this.portalSelf, c);

      return c;
    },

    _addAuthorizedCrossOriginDomains: function(portalSelf, appConfig){
      // we read withCredentials domains(mostly web-tier) and put them into corsEnabledServers
      // tokenUtils.addAuthorizedCrossOriginDomains will ignore duplicated values
      if(portalSelf && portalSelf.authorizedCrossOriginDomains){
        tokenUtils.addAuthorizedCrossOriginDomains(portalSelf.authorizedCrossOriginDomains);
      }
      if(appConfig && appConfig.authorizedCrossOriginDomains){
        tokenUtils.addAuthorizedCrossOriginDomains(appConfig.authorizedCrossOriginDomains);
      }
    },

    checkConfig: function(config){
      var repeatedId = this._getRepeatedId(config);
      if(repeatedId){
        return 'repeated id:' + repeatedId;
      }
      return null;
    },

    processProxy: function(appConfig){
      esriConfig.defaults.io.alwaysUseProxy = appConfig.httpProxy &&
      appConfig.httpProxy.useProxy && appConfig.httpProxy.alwaysUseProxy;
      esriConfig.defaults.io.proxyUrl = "";
      esriConfig.defaults.io.proxyRules = [];

      if (appConfig.httpProxy && appConfig.httpProxy.useProxy && appConfig.httpProxy.url) {
        esriConfig.defaults.io.proxyUrl = appConfig.httpProxy.url;
      }
      if (appConfig.httpProxy && appConfig.httpProxy.useProxy && appConfig.httpProxy.rules) {
        array.forEach(appConfig.httpProxy.rules, function(rule) {
          esriUrlUtils.addProxyRule(rule);
        });
      }
    },

    addNeedValues: function(appConfig){
      this._processNoUriWidgets(appConfig);
      this._addElementId(appConfig);
      this._processWidgetJsons(appConfig);
    },

    showError: function(err){
      if(err && err.message){
        html.create('div', {
          'class': 'app-error',
          innerHTML: err.message
        }, document.body);
      }      
    },

    _tryLoadConfig: function() {
      if(this.urlParams.config) {
        this.configFile = this.urlParams.config;
        return xhr(this.configFile, {
          handleAs: 'json',
          headers: {
            "X-Requested-With": null
          }
        }).then(lang.hitch(this, function(appConfig){
          //tokenUtils.setPortalUrl(appConfig.portalUrl);

          if(this.urlParams.token){
            return tokenUtils.registerToken(this.urlParams.token).then(function(){
              return appConfig;
            });
          }else{
            return appConfig;
          }
        }));
      }  else{
        this.configFile = "config.json";
        return xhr(this.configFile, {handleAs: 'json'}).then(lang.hitch(this, function(appConfig){
          //tokenUtils.setPortalUrl(appConfig.portalUrl);

          if(this.urlParams.token){
            return tokenUtils.registerToken(this.urlParams.token).then(function(){
              return appConfig;
            });
          }else{
            return appConfig;
          }
        }));
      }
    },

    _upgradeAppConfig: function(appConfig){
      var appVersion = window.wabVersion;
      var configVersion = appConfig.wabVersion;
      var newConfig;

      if(appVersion === configVersion){
        return appConfig;
      }
      var configVersionIndex = this.versionManager.getVersionIndex(configVersion);
      var appVersionIndex = this.versionManager.getVersionIndex(appVersion);
      if(configVersionIndex > appVersionIndex){
        throw Error('Bad version number, ' + configVersion);
      }else{
        newConfig = this.versionManager.upgrade(appConfig, configVersion, appVersion);
        newConfig.wabVersion = appVersion;
        newConfig.isUpgraded = true;
        return newConfig;
      }
    },

    _upgradeAllWidgetsConfig: function(appConfig){
      var def = new Deferred(), defs = [];
      if(!appConfig.isUpgraded){
        //app is latest, all widgets are lastest.
        def.resolve(appConfig);
        return def;
      }

      delete appConfig.isUpgraded;
      sharedUtils.visitElement(appConfig, lang.hitch(this, function(e){
        if(!e.uri){
          return;
        }
        if(e.config){
          //if widget is configured, let's upgrade it
          var upgradeDef = this.widgetManager.tryLoadWidgetConfig(e);
          defs.push(upgradeDef);
        }else{
          e.version = e.manifest.version;
        }
      }));
      all(defs).then(lang.hitch(this, function(){
        def.resolve(appConfig);
      }), function(err){
        def.reject(err);
      });
      return def;
    },

    _processAfterTryLoad: function(appConfig){
      //this._setPortalUrl(appConfig);
      //this._tryUpdateAppConfigByLocationUrl(appConfig);
      this._processUrlParams(appConfig);

      this.addNeedValues(appConfig);
      this.processProxy(appConfig);

      IdentityManager.tokenValidity = 60 * 24 * 7;//token is valid in 7 days
      return appConfig;
    },

    _tryUpdateAppConfigByLocationUrl: function(appConfig){
      if(this.urlParams.config &&
        this.urlParams.config.indexOf('arcgis.com/sharing/rest/content/items/') > -1){

        //for load config from arcgis.com, for back compatibility test.
        return;
      }

      //app is hosted in portal
      //we process protalUrl specially because user in a group owned by two orgs should
      //open the app correctly if the app is shared to this kind of group.
      //so we need to keep main protalUrl consistent with portalUrl browser location.
      var portalUrlFromLocation = portalUrlUtils.getPortalUrlFromLocation();
      var processedPortalUrl = portalUrlUtils.getStandardPortalUrl(portalUrlFromLocation);

      if(portalUrlUtils.isOnline(processedPortalUrl)){
        processedPortalUrl = portalUrlUtils.updateUrlProtocolByOtherUrl(processedPortalUrl,
                                                                        appConfig.portalUrl);
        if(appConfig.map.portalUrl){
          if(portalUrlUtils.isSamePortalUrl(appConfig.portalUrl, appConfig.map.portalUrl)){
            appConfig.map.portalUrl = processedPortalUrl;
          }
        }
        appConfig.portalUrl = processedPortalUrl;

        //update proxy url
        if(appConfig.httpProxy && appConfig.httpProxy.url){
          appConfig.httpProxy.url = portalUrlUtils.getPortalProxyUrl(processedPortalUrl);
        }
      }
    },

    _processWidgetJsons: function(appConfig){
      sharedUtils.visitElement(appConfig, function(e, info){
        if(info.isWidget && e.uri){
          jimuUtils.processWidgetSetting(e);
        }
      });
    },

    _processNoUriWidgets: function(appConfig){
      var i = 0;
      sharedUtils.visitElement(appConfig, function(e, info){
        if(info.isWidget && !e.uri){
          i ++;
          e.placeholderIndex = i;
        }
      });
    },

    _addElementId: function (appConfig){
      var maxId = 0, i;

      sharedUtils.visitElement(appConfig, function(e){
        if(!e.id){
          return;
        }
        //fix element id
        e.id = e.id.replace(/\//g, '_');

        var li = e.id.lastIndexOf('_');
        if(li > -1){
          i = e.id.substr(li + 1);
          maxId = Math.max(maxId, i);
        }
      });

      sharedUtils.visitElement(appConfig, function(e){
        if(!e.id){
          maxId ++;
          e.id = e.uri? (e.uri.replace(/\//g, '_') + '_' + maxId): (''  + '_' + maxId);
        }
      });
    },

    _setPortalUrl: function(appConfig){
      if(appConfig.portalUrl){
        //we can judge the app is running in portal or not now.
        //we should consider this case: the app is running in arcgis.com and the app is shared to
        //an cross-org group and the member of another org of this group is opening this app.
        //In this case, appConfig.portalUrl is different with portalUrlByLocation, but the app is
        //running in portal(arcgis.com).
        var portalUrlByLocation = portalUrlUtils.getPortalUrlFromLocation();
        var isOnline = portalUrlUtils.isOnline(portalUrlByLocation);
        if(!portalUrlUtils.isSamePortalUrl(appConfig.portalUrl, portalUrlByLocation) && !isOnline){
          //app is deployed outside of portal
          window.appInfo.isRunInPortal = false;
        }
        return;
      }
      //if there is no portalUrl in appConfig, try to check whether the app
      //is launched from XT version builder
      if(window.isXT && cookie('wab_portalurl')){
        appConfig.portalUrl = cookie('wab_portalurl');
        return;
      }

      //if not launched from XT builder and has no portalUrl is set,
      //let's assume it's hosted in portal, use the browser location
      window.appInfo.isRunInPortal = true;
      appConfig.portalUrl = portalUrlUtils.getPortalUrlFromLocation();
      return;
    },

    _changePortalUrlProtocol: function(appConfig, protocol){
      //if browser uses https protocol, portalUrl should also use https
      appConfig.portalUrl = portalUrlUtils.setProtocol(appConfig.portalUrl, protocol);

      if(appConfig.map.portalUrl){
        appConfig.map.portalUrl = portalUrlUtils.setProtocol(appConfig.map.portalUrl, protocol);
      }

      if(appConfig.httpProxy){
        var httpProxyUrl = appConfig.httpProxy.url;

        appConfig.httpProxy.url = portalUrlUtils.setProtocol(httpProxyUrl, protocol);

        if(appConfig.httpProxy && appConfig.httpProxy.rules){
          array.forEach(appConfig.httpProxy.rules, lang.hitch(this, function(rule){
            rule.proxyUrl = portalUrlUtils.setProtocol(rule.proxyUrl, protocol);
          }));
        }
      }
    },

    _removeHash: function(urlParams){
      for(var p in urlParams){
        if(urlParams[p]){
          urlParams[p] = urlParams[p].replace('#', '');
        }
      }
    },

    loadWidgetsManifest: function(config){
      var defs = [], def = new Deferred();
      if(config._buildInfo && config._buildInfo.widgetManifestsMerged){
        this._loadMergedWidgetManifests().then(lang.hitch(this, function(manifests){
          sharedUtils.visitElement(config, lang.hitch(this, function(e){
            if(!e.widgets && e.uri){
              if(manifests[e.uri]){
                this._addNeedValuesForManifest(manifests[e.uri]);
                jimuUtils.addManifest2WidgetJson(e, manifests[e.uri]);
              }else{
                defs.push(this.widgetManager.loadWidgetManifest(e));
              }
            }
          }));
          all(defs).then(function(){
            def.resolve(config);
          });
        }));
      }else{
        sharedUtils.visitElement(config, lang.hitch(this, function(e){
          if(!e.widgets && e.uri){
            defs.push(this.widgetManager.loadWidgetManifest(e));
          }
        }));
        all(defs).then(function(){
          def.resolve(config);
        });
      }

      setTimeout(function(){
        if(!def.isResolved()){
          def.resolve(config);
        }
      }, 60 * 1000);
      return def;
    },

    _addNeedValuesForManifest: function(manifest){
      jimuUtils.addManifestProperies(manifest);
      jimuUtils.processManifestLabel(manifest, dojoConfig.locale);
    },

    _loadMergedWidgetManifests: function(){
      var file = window.appInfo.appPath + 'widgets/widgets-manifest.json';
      return xhr(file, {
        handleAs: 'json'
      });
    },

    _getRepeatedId: function(appConfig){
      var id = [], ret;
      sharedUtils.visitElement(appConfig, function(e){
        if(id.indexOf(e.id) > 0){
          ret = e.id;
          return true;
        }
        id.push(e.id);
      });
      return ret;
    },

    //we use URL parameters for the first loading.
    //After loaded, if user changes app config through builder,
    //we'll use the configuration in builder.
    _processUrlParams: function(appConfig){
      var urlWebmap = this.urlParams.itemid || this.urlParams.webmap;
      if(urlWebmap && appConfig.map.itemId !== urlWebmap){
        if(appConfig.map.mapOptions){
          jimuUtils.deleteMapOptions(appConfig.map.mapOptions);
        }
        appConfig.map.itemId = urlWebmap;
      }
      if(this.urlParams.mode){
        appConfig.mode = this.urlParams.mode;
      }
      if(!appConfig.map.mapOptions){
        appConfig.map.mapOptions = {};
      }

      if(this.urlParams.scale){
        appConfig.map.mapOptions.scale = this.urlParams.scale;
      }
      if(this.urlParams.level || this.urlParams.zoom){
        appConfig.map.mapOptions.zoom = this.urlParams.level || this.urlParams.zoom;
      }
    }
  });

  clazz.getInstance = function (urlParams, options) {
    if(instance === null) {
      instance = new clazz(urlParams, options);
    }else{
      instance.urlParams = urlParams;
      instance.options = options;
    }
    return instance;
  };

  return clazz;
});