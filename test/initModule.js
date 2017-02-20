var angular = require('angular');


module.exports = function initModule() {
  try {
    angular.module('wfm.file.service');
  } catch (e) {
    angular.module('wfm.file.service', []);
  }
};