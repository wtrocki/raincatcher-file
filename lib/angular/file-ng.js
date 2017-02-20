'use strict';

var client = require('../file'),
  _ = require('lodash');

module.exports = 'wfm.file.service';

angular.module('wfm.file.service', [
  require('./fileDirectives')
])

.factory('fileClient', function($q) {
  var fileClient = {};

  _.forOwn(client, function(value, key) {
    if (typeof value  === 'function') {
      fileClient[key] = function() {
        return $q.when(client[key].apply(client, arguments));
      };
    } else {
      fileClient[key] = value;
    }
  });

  return fileClient;
})
;
