/*
 * Controller for file-detail directive
 * @param $scope - the $scope injection
 * @param mediator - mediator service to publish file:close topic, client app can subscribe to this topic.
 */

function fileDetailController($scope, mediator){
  var self = this;
  self.file = $scope.file;
  self.options = $scope.displayOptions || {};
  //publish mediator message to close the file
  self.closeFile = function(event) {
    mediator.publish('wfm:file:detail:close');
    event.preventDefault();
    event.stopPropagation();
  };
}

angular.module('wfm.file.directives').controller('fileDetailController', ['$scope','mediator', fileDetailController]);

module.exports = 'wfm.file.directives.fileDetailController';