/**
* CONFIDENTIAL
* Copyright 2016 Red Hat, Inc. and/or its affiliates.
* This is unpublished proprietary source code of Red Hat.
**/
'use strict';

var config = require('./config'),
    q = require('q');

var client = {};

client.uploadDataUrl = function(dataUrl) {
  var deferred = q.defer();
  $fh.cloud({
      path: config.apiPath + '/upload/base64/photo.png',
      method: 'post',
      data: dataUrl
    },
    function(res) {
      deferred.resolve(res);
    },
    function(message, props) {
      var e = new Error(message);
      e.props = props;
      deferred.reject(e);
    }
  );
  return deferred.promise;
}

client.list = function() {
  var deferred = q.defer();
  $fh.cloud({
      path: config.apiPath,
      method: 'get'
    },
    function(res) {
      deferred.resolve(res);
    },
    function(message, props) {
      var e = new Error(message);
      e.props = props;
      deferred.reject(e);
    }
  );
  return deferred.promise;
};

module.exports = client;
