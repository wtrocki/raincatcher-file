var angular = require('angular');
var should = require('should');
var sinon = require('sinon');
require('angular-mocks');

var initModule = require('../../../test/initModule');

describe('File file-detail Controller', function() {
  before(function() {
    initModule();

    require('../fileDirectives');
    //file detail controller is the controller under test.
    require('./fileDetailController')
  });

  beforeEach(inject(function(_$controller_) {
    this.$controller = _$controller_;
  }));

  it("The file should be set from the parent scope", inject(function($rootScope) {
    //Setting up a new mock $scope.
    var $scope = $rootScope.$new();
    //
    // //Setting a mock field
    $scope.file = {
      id: "somefile_id",
      name: "photo.png",
      owner: "unittest",
      uid: "somefile_uid"
    };
    //
    var controller = this.$controller('FileDetailController', { $scope: $scope});

    //The field from the parent scope should be bound to the controller scope.
    should(controller.file).equal($scope.file);
  }));
});