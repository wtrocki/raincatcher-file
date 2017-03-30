var CONSTANTS = require('../../constants');
var q = require('q');
var shortid = require('shortid');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

/**
 * Getting Promises for done and error topics.
 * This will resolve or reject the returned promise depending on the topic published.
 *
 * TODO: This may be of more use in fh-wfm-mediator...
 *
 * @param doneTopicPromise  - A promise for the done topic.
 * @param errorTopicPromise - A promise for the error topic.
 * @returns {Promise} promise
 */
function getTopicPromises(doneTopicPromise, errorTopicPromise) {
  var deferred = q.defer();
  
  doneTopicPromise.then(function(response) {
    deferred.resolve(response);
  });
  
  errorTopicPromise.then(function(error) {
    deferred.reject(error);
  });
  return deferred.promise;
}

/**
 * A mediator service that will publish and subscribe to topics to be able to render file data.
 *
 * @param {Mediator} mediator
 * @param {object}   config
 * @constructor
 */
function FileMediatorService(mediator, config) {
  this.mediator = mediator;
  this.config = config || {};
  
  this.filesStorageTopics = new MediatorTopicUtility(mediator).prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.FILES_STORAGE_ENTITY_NAME);
  this.filesDataTopics = new MediatorTopicUtility(mediator).prefix(this.config.cloudDataTopicPrefix).entity(this.config.datasetId);
}

/**
 *
 * Getting Promises for the done and error topics.
 *
 * TODO: This may be of more use in fh-wfm-mediator...
 *
 * @param {MediatorTopicUtility} topicGenerator
 * @param {string} topicName   - The name of the topic to generate
 * @param {string} [topicUid]  - A topic UID if required.
 * @returns {Promise} - A promise for the topic.
 */
FileMediatorService.prototype.getErrorAndDoneTopicPromises = function getErrorAndDoneTopicPromises(topicGenerator, topicName, topicUid) {
  var doneTopic = topicGenerator.getTopic(topicName, CONSTANTS.DONE_PREFIX, topicUid);
  var errorTopic = topicGenerator.getTopic(topicName, CONSTANTS.ERROR_PREFIX, topicUid);
  
  var doneTopicPromise = topicGenerator.mediator.promise(doneTopic);
  var errorTopicPromise = topicGenerator.mediator.promise(errorTopic);
  
  var timeoutDefer = q.defer();
  
  setTimeout(function() {
    timeoutDefer.reject(new Error("Timeout For Topic: " + doneTopic));
  }, this.config.topicTimeout || CONSTANTS.TOPIC_TIMEOUT);
  
  //Either one of these promises resolves/rejects or it will time out.
  return q.race([getTopicPromises(doneTopicPromise, errorTopicPromise), timeoutDefer.promise]);
};

/**
 * Get file Stream from storage
 *
 * @param namespace {String} - namespace used to catalog files in different folders/locations.
 * @param fileName {String} - name of the file
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.fetchFileFromStorage = function(namespace, fileName) {
  var topicUid = shortid.generate();
  var promise = this.getErrorAndDoneTopicPromises(this.filesStorageTopics, CONSTANTS.STORAGE_TOPICS.GET, topicUid);
  this.mediator.publish(this.filesStorageTopics.getTopic(CONSTANTS.STORAGE_TOPICS.GET), {
    namespace: namespace,
    fileName: fileName,
    topicUid: topicUid
  });
  return promise;
};

/**
 * Store single file in configured storage
 *
 * @param namespace {String} - namespace used to catalog files in different folders/locations.
 * @param fileName {String} - name of the file
 * @param location {String} - location to the file in local filesystem
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.saveFileToStorage = function(namespace, fileName, location) {
  var topicUid = shortid.generate();
  var promise = this.getErrorAndDoneTopicPromises(this.filesStorageTopics, CONSTANTS.STORAGE_TOPICS.CREATE, topicUid);
  this.mediator.publish(this.filesStorageTopics.getTopic(CONSTANTS.STORAGE_TOPICS.CREATE), {
    namespace: namespace,
    fileName: fileName,
    location: location,
    topicUid: topicUid
  });
  return promise;
};

/**
 * List files metadata for user
 *
 * @param userId {String} - id of the user used to filter results
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.listFilesMetadata = function(userId) {
  var deferred = q.defer();
  this.mediator.publish(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.LIST));
  this.mediator.once(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.LIST, CONSTANTS.DONE_PREFIX), function(files) {
    // TODO send filter to storage engine directly instead of filtering large results in code
    // TODO support query limits
    if (userId) {
      var filtered = files.filter(function(file) {
        return String(file.owner) === String(userId);
      });
      deferred.resolve(filtered);
      return;
    }
    deferred.resolve(files);
  });
  this.mediator.once(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.LIST, CONSTANTS.ERROR_PREFIX), function(error) {
    deferred.reject(error);
  });
  return deferred.promise;
};

/**
 * Create file metadata
 *
 * @param fileMeta {Object} - file metadata including name
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.createFileMetadata = function(fileMeta) {
  var deferred = q.defer();
  this.mediator.request(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.CREATE), fileMeta);
  this.mediator.once(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.CREATE, CONSTANTS.DONE_PREFIX), function(result) {
    deferred.resolve(result);
  });
  this.mediator.once(this.filesDataTopics.getTopic(CONSTANTS.TOPICS.CREATE, CONSTANTS.ERROR_PREFIX), function(error) {
    deferred.reject(error);
  });
  return deferred.promise;
};

module.exports = FileMediatorService;