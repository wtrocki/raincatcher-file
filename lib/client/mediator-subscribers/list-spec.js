var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var q = require('q');
var _ = require('lodash');
var CONSTANTS = require('../../constants');
var expect = chai.expect;

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');
var FileClient = require('../file-client');

var mockFile = {
  id: "fileid",
  name: "This is a mock file"
};

// File client mock
var fileClient = new FileClient(mediator);
fileClient.init = function() {
  // Intentionally empty
};

fileClient.list = function(){
  var deferred = q.defer();
  var promise = deferred.promise;
  deferred.resolve([mockFile, mockFile]);
  return promise;
};

describe("File List Mediator Topic", function() {



  var files = [_.clone(mockFile), _.clone(mockFile)];

  var listTopic = "wfm:files:list";
  var doneListTopic = "done:wfm:files:list";

  var fileSubscribers = new MediatorTopicUtility(mediator);
  fileSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.FILES_ENTITY_NAME);

  beforeEach(function() {
    this.subscribers = {};
    fileSubscribers.on(CONSTANTS.TOPICS.LIST, require('./list')(fileSubscribers, fileClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    fileSubscribers.unsubscribeAll();
  });

  it('should list files', function() {
    this.subscribers[listTopic] = mediator.subscribe(listTopic, function() {
      mediator.publish(doneListTopic, files);
    });

    var donePromise = mediator.promise(doneListTopic);

    mediator.publish(listTopic);

    return donePromise.then(function(arrayOfFiles) {
      expect(arrayOfFiles).to.deep.equal(files);
    });
  });
});