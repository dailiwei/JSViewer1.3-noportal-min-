define(['dojo/_base/lang',
    'dojo/_base/array',
    'dojo/on',
    'dojo/aspect',
    'dojo/Deferred',
    'dojo/cookie',
    'dojo/json',
    'dojo/topic',
    'dojo/sniff',
    'dojo/_base/url',
    'dojo/io-query'
],

function (lang, array, on, aspect, Deferred, cookie, json, topic, sniff, Url, ioquery) {
    var AppCommon = {};
    //根目录的服务地址
    AppCommon.webRoot =window.javaUrl;
    AppCommon.getWtCloudPic =   window.javaUrl+ "weather/getWtCloudPic.action?wcr.filename=";


    return AppCommon;
});