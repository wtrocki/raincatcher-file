var config = require('../../config');


angular.module('wfm.file.directives').directive('wfmImg', function($q) {
  function init() {
    var deferred = $q.defer();
    $fh.on('fhinit', function(error) {
      if (error) {
        deferred.reject(new Error(error));
        return;
      }
      var cloudUrl = $fh.getCloudURL();
      deferred.resolve(cloudUrl);
    });

    return deferred.promise;
  }

  var initPromise = init();

  return {
    restrict: 'A',
    scope: {
      uid: '='
    },
    link: function(scope, element) {
      scope.$watch('uid', function(uid) {
        initPromise.then(function(cloudUrl) {
          element[0].src = cloudUrl + config.apiPath + '/get/' + uid;
        });
      });
    }
  };
});