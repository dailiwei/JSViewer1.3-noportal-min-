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
    'dojo/dom-class',
    'dojo/_base/window',
    'dojo/window',
    'dojo/query',
    'dojo/on',
    //'dojo/topic',
    'dojo/Deferred',
    'jimu/BaseWidget',
    'jimu/WidgetManager',
    'jimu/LayoutManager',
    'jimu/utils',
    'dojo/NodeList-dom',
    'dojo/NodeList-manipulate'
  ],
  function(declare, lang, array, html, domClass, winBase, win, query, on,
    Deferred, BaseWidget, WidgetManager, LayoutManager, utils) {
    /* global jimuConfig */
    /*jshint scripturl:true*/
    var clazz = declare([BaseWidget], {

      baseClass: 'jimu-widget-header jimu-main-background',
      name: 'Header',

      switchableElements: {},
      _boxSizes: null,

      moveTopOnActive: false,

      constructor: function() {
        this.height = this.getHeaderHeight() + 'px';
        this.widgetManager = WidgetManager.getInstance();
        this.LayoutManager = LayoutManager.getInstance();
      },

      postCreate: function() {
        this.inherited(arguments);

        this.own(on(this.widgetManager, 'widget-created', lang.hitch(this, function(widget) {
          if(widget.name === 'Search') {
            var searchWidget = this.widgetManager.getWidgetsByName('Search')[0];
            html.addClass(searchWidget.domNode, 'has-transition');
            // check if the search dijit has been parsed within the search widget
            // if not, wait until it is ready, and then call resize()
            if(searchWidget && !searchWidget.searchDijit) {
              this._searchDijitDomReady(searchWidget).then(lang.hitch(this, function(){
                this.resize();
              }));
            }else{
              this.resize();
            }
          }
        })));

        var logoW = this.getLogoWidth() + 'px';

        if (this.position && this.position.height) {
          this.height = this.position.height;
        }

        this.switchableElements.logo = query('.logo', this.domNode);
        this.switchableElements.title = query('.jimu-title', this.domNode);
        //this.switchableElements.links = query('.links', this.domNode);
        this.switchableElements.subtitle = query('.jimu-subtitle', this.domNode);

        this.switchableElements.logo.style({
          height: logoW
        });

        this._setElementsSize();
      },

      startup: function() {
        this.inherited(arguments);

        // Update UI:
        // Logo
        if (this.appConfig && this.appConfig.logo) {
          this.logoNode.src = this.appConfig.logo;
          html.removeClass(this.logoWrapperNode, 'hide-logo');
        } else {
          this.logoNode.src = "";
          html.addClass(this.logoWrapperNode, 'hide-logo');
        }
        // Title
        this.switchableElements.title.innerHTML(
          utils.sanitizeHTML(this.appConfig.title ? this.appConfig.title : '')
        );
        // Subtitle
        this.switchableElements.subtitle.innerHTML(
          utils.sanitizeHTML(this.appConfig.subtitle ? this.appConfig.subtitle : '')
        );
        // Links
        this._createDynamicLinks(this.appConfig.links);
        // About
        if (this.appConfig.about) {
          html.setStyle(this.aboutNode, 'display', '');
        } else {
          html.setStyle(this.aboutNode, 'display', 'none');
        }

        // Show links placeholder button (if needed)
        this._determineLinksButtonVisibility(this.appConfig.links);

        this._updateBoxsizes();
        this.resize();
      },

      _searchDijitDomReady: function(searchWidget) {
        var timeCounter = 0;
        var def = new Deferred();
        // Check if searchDijit has been initialized within the search widget every 200 ms
        var checkSearchDijitTimer = setInterval(lang.hitch(this, function(){
          if(timeCounter > 5000 || searchWidget.searchDijit) {
            // stop watching and resize UI
            clearInterval(checkSearchDijitTimer);
            def.resolve();
          }else {
            timeCounter += 200;
          }
        }), 200);
        return def;
      },

      onAppConfigChanged: function(appConfig, reason, changedData) {
        switch (reason) {
        case 'attributeChange':
          this._onAttributeChange(appConfig, changedData);
          this._updateBoxsizes();
          this.resize();
          break;
        case 'widgetChange':
          if(changedData.name === 'Search'){
            this.resize();
          }
          break;
        default:
          return;
        }
        this.appConfig = appConfig;
      },

      _onAttributeChange: function(appConfig, changedData) {
        /*jshint unused: false*/
        if ('title' in changedData && changedData.title !== this.appConfig.title) {
          this.switchableElements.title.innerHTML(utils.sanitizeHTML(changedData.title));
        }
        if ('subtitle' in changedData && changedData.subtitle !== this.appConfig.subtitle) {
          this.switchableElements.subtitle.innerHTML(utils.sanitizeHTML(changedData.subtitle));
        }
        if ('logo' in changedData && changedData.logo !== this.appConfig.logo) {
          if(changedData.logo){
            html.setAttr(this.logoNode, 'src', changedData.logo);
            html.removeClass(this.logoWrapperNode, 'hide-logo');
          }else{
            html.removeAttr(this.logoNode, 'src');
            html.addClass(this.logoWrapperNode, 'hide-logo');
          }
        }
        if ('links' in changedData) {
          this._createDynamicLinks(changedData.links);
          this._determineLinksButtonVisibility(changedData.links);
        }
      },

      _setElementsSize: function() {
        // Logo
        html.setStyle(this.logoNode, {
          height: '30px',
          marginTop: ((this.getLogoWidth() - 30) / 2) + 'px'
        });
        // Title
        html.setStyle(this.titleNode, {
          lineHeight: this.height + 'px'
        });
        // Subtitle
        html.setStyle(this.subtitleNode, {
          lineHeight: this.height + 'px'
        });
      },

      _createDynamicLinks: function(links) {
        html.empty(this.dynamicLinksNode);
        array.forEach(links, function(link) {
          html.create('a', {
            href: link.url,
            target: '_blank',
            innerHTML: utils.sanitizeHTML(link.label),
            'class': "link"
          }, this.dynamicLinksNode);
        }, this);
      },

      _determineLinksButtonVisibility: function(links) {
        if(links.length || this.appConfig.about) {
          this._showLinksIcon();
        }else {
          this._hideLinksIcon();
        }
      },

      _showLinksIcon: function() {
        html.setAttr(this.linksIconImageNode, 'src', this.folderUrl + 'images/link_icon.png');
        html.setStyle(this.linksIconNode, 'display', 'block');
        html.addClass(winBase.body(), 'header-has-links');
        var newHeaderWidth = this.domNode.clientWidth + this.getLinksWidth();
        html.setStyle(this.domNode, 'width', newHeaderWidth + 'px');

        if(!this.linksIconClicked) {
          this.linksIconClicked = on(this.linksIconNode, 'click', lang.hitch(this, function() {
            this._toggleLinksMenu();
          }));
        }
      },

      _hideLinksIcon: function() {
        html.setStyle(this.linksIconNode, 'display', 'none');
        html.removeClass(winBase.body(), 'header-has-links');
      },

      _toggleLinksMenu: function() {
        html.toggleClass(this.linksNode, 'hidden');
      },

      _onAboutClick: function() {
        var widgetConfig = {
          id: this.appConfig.about + '_1',
          uri: this.appConfig.about,
          label: 'About'
        };
        this.widgetManager.loadWidget(widgetConfig).then(lang.hitch(this, function(widget) {
          html.place(widget.domNode, jimuConfig.layoutId);
          widget.startup();
        }));
      },

      _updateBoxsizes: function() {
        var logoBox = html.getMarginSize(this.logoWrapperNode);
        var titleBox = {
          w: 0,
          h: 0
        };
        if(this.switchableElements.title.innerHTML()){
          titleBox = html.getMarginSize(this.titleNode);
          domClass.add(this.subtitleNode, 'jimu-leading-margin2');
        }else{
          domClass.remove(this.subtitleNode, 'jimu-leading-margin2');
        }

        var subTitleBox = {
          w: 0,
          h: 0
        };
        if(this.switchableElements.subtitle.innerHTML()){
          subTitleBox = html.getMarginSize(this.subtitleNode);
        }
        var searchWidgetBox = {l: 0, t: 0, w: 0, h: 0};
        var LinksIconBox = {l: 0, t: 0, w: 10, h: 0}; // "w:10": leave some space to the edge
        if(this.linksIconNode.style.display !== 'none') {
          LinksIconBox = html.getMarginSize(this.linksIconNode);
        }
        this._boxSizes = {
          logoBox: logoBox,
          titleBox: titleBox,
          subTitleBox: subTitleBox,
          searchWidgetBox: searchWidgetBox,
          LinksIconBox: LinksIconBox
        };
      },

      setPosition: function(position, containerNode){
        //For on-screen off-panel widget, layout manager will call this function
        //to set widget's position after load widget. If your widget will position by itself,
        //please override this function.
        this.position = position;
        var style = utils.getPositionStyle(this.position);
        style.position = 'absolute';

        if(!containerNode){
          if(position.relativeTo === 'map'){
            containerNode = this.map.id;
          }else{
            containerNode = window.jimuConfig.layoutId;
          }
        }

        html.place(this.domNode, containerNode);
        html.setStyle(this.domNode, style);
        if(this.started){
          setTimeout(lang.hitch(this, this.resize), 200);
        }
      },

      resize: function() {
        var boxSizes = this._boxSizes;
        // whether the app is in mobile mode
        if(window.appInfo.isRunInMobile){
          html.addClass(winBase.body(), 'is-mobile');
        }else {
          html.removeClass(winBase.body(), 'is-mobile');

          // Space reserved to show off screen widget icons to the right of the header
          var winBox = win.getBox();
          var offsetRight = 250;
          var searchWidget = this.widgetManager.getWidgetsByName('Search')[0];
          if(searchWidget){
            boxSizes.searchWidgetBox = html.getMarginSize(searchWidget.domNode);
          }
          // Total width of the content in the header
          var contentWidth = boxSizes.logoBox.w + boxSizes.titleBox.w + boxSizes.subTitleBox.w +
              20 + boxSizes.searchWidgetBox.w + boxSizes.LinksIconBox.w;
          if(15 + contentWidth + offsetRight < winBox.w) {  // enough space to show everything
            this.domNode.style.width = contentWidth + 'px';
            var paddingLeft = 20;
            if(boxSizes.titleBox.w + boxSizes.subTitleBox.w === 0){
              paddingLeft = 15;
            }
            if(searchWidget) {
              if(window.isRTL){
                searchWidget.domNode.style.right = boxSizes.logoBox.w +
                  boxSizes.titleBox.w + boxSizes.subTitleBox.w + 15 + paddingLeft + 'px';
              }else{
                searchWidget.domNode.style.left = boxSizes.logoBox.w +
                  boxSizes.titleBox.w + boxSizes.subTitleBox.w + 15 + paddingLeft + 'px';
              }
            }
            this.titlesNode.style.visibility = 'visible';
            this.subtitleNode.style.visibility = 'visible';
          } else {
            var newHeaderWidth;
            if(15 + contentWidth - boxSizes.subTitleBox.w + offsetRight < winBox.w) {
              // not enough space to show subtitle
              newHeaderWidth = boxSizes.logoBox.w + 10 + boxSizes.searchWidgetBox.w +
                boxSizes.titleBox.w + boxSizes.LinksIconBox.w;
              this.domNode.style.width = newHeaderWidth + 'px';
              if(searchWidget){
                var newOffsetLeft = 15 + newHeaderWidth - boxSizes.LinksIconBox.w -
                    boxSizes.searchWidgetBox.w;
                if(window.isRTL){
                  searchWidget.domNode.style.right = newOffsetLeft + 10 + 'px';
                }else{
                  searchWidget.domNode.style.left = newOffsetLeft + 10 + 'px';
                }
              }
              this.titlesNode.style.visibility = 'visible';
              this.subtitleNode.style.visibility = 'hidden';
            } else { // not enough space to show tile and subtitle
              newHeaderWidth = boxSizes.logoBox.w + 10 + boxSizes.searchWidgetBox.w +
                boxSizes.LinksIconBox.w;
              this.domNode.style.width = newHeaderWidth + 'px';
              if(searchWidget) {
                if(window.isRTL){
                  searchWidget.domNode.style.right = 15 + boxSizes.logoBox.w + 10 + 'px';
                }else{
                  searchWidget.domNode.style.left = 15 + boxSizes.logoBox.w + 10 + 'px';
                }
              }
              this.titlesNode.style.visibility = 'hidden';
              this.subtitleNode.style.visibility = 'hidden';
            }
          }
        }
      },

      getHeaderHeight: function() {
        return 44;
      },

      getLogoWidth: function() {
        return 50;
      },

      getLinksWidth: function() {
        return 36;
      },

      destroy: function() {
        this.inherited(arguments);
      }
    });
    return clazz;
  });
