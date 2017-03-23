var mediator = require("fh-wfm-mediator/lib/mediator");
var chai = require('chai');
var q = require('q');
var _ = require('lodash');
var CONSTANTS = require('../../constants');
var FileClient = require('../file-client/FileClient');

var expect = chai.expect;

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

// File client mock
var fileClient = new FileClient(mediator);
fileClient.init = function() {
  // Intentionally empty
};

fileClient.uploadFile = function(){
  var deferred = q.defer();
  var promise = deferred.promise;
  deferred.resolve({});
  return promise;
};

describe("File Create Mediator Topic", function() {

  var mockFileToCreate = {
    userId: "user1",
    fileURI: "file://host/path",
    options: {fileName: "test"},
    dataUrl: undefined
  };

  var expectedCreatedFile =  _.extend({_localuid: "createdFileLocalId"}, mockFileToCreate);

  var topicUid = 'testtopicuid1';

  var createTopic = "wfm:files:create";
  var doneCreateTopic = "done:wfm:files:create:testtopicuid1";
  var errorCreateTopic = "error:wfm:files:create:testtopicuid1";

  var fileSubscribers = new MediatorTopicUtility(mediator);
  fileSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.FILES_ENTITY_NAME);

  
  beforeEach(function() {
    this.subscribers = {};
    fileSubscribers.on(CONSTANTS.TOPICS.CREATE, require('./create')(fileSubscribers, fileClient));
  });

  afterEach(function() {
    _.each(this.subscribers, function(subscriber, topic) {
      mediator.remove(topic, subscriber.id);
    });

    fileSubscribers.unsubscribeAll();
  });

  it('should create a file', function() {
    this.subscribers[createTopic] = mediator.subscribe(createTopic, function(parameters) {
      expect(parameters.fileToCreate).to.deep.equal(mockFileToCreate);
      expect(parameters.topicUid).to.be.a('string');

      mediator.publish(doneCreateTopic + ":" + parameters.topicUid, expectedCreatedFile);
    });

    var donePromise = mediator.promise(doneCreateTopic);

    mediator.publish(createTopic, {
      fileToCreate: mockFileToCreate,
      topicUid: topicUid
    });

    return donePromise.then(function(response) {
      expect(response).to.not.be.undefined
    });
  });

  it('should publish an error', function() {
    var errorPromise = mediator.promise(errorCreateTopic);

    mediator.publish(createTopic, {
      topicUid: topicUid
    });

    return errorPromise.then(function(error) {
      expect(error.message).to.have.string("Invalid Data");
    });
  });
});