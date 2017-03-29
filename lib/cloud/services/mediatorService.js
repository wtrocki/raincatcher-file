var CONSTANTS = require('../../constants');
var q = require('q');
var shortid = require('shortid');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

// TODO use Damien's changes

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
 * List all files metadata
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.listFilesMetadada = function() {
  var deferred = q.defer();
  // TODO support failures
  // TODO replace with actions constants
  mediator.publish(this.config.cloudDataTopicPrefix + this.config.datasetId + ':list');
  mediator.once(CONSTANTS.DONE_PREFIX + CONSTANTS.TOPIC_SEPARATOR + this.config.cloudDataTopicPrefix + this.config.datasetId + ':list', function(files) {
    deferred.resolve(files);
  });
  return deferred.promise;
};

/**
 * List all files metadata
 *
 * @param userId {String} - id of the user used to filter results
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.listFilesMetadadaForUser = function(userId) {
  var deferred = q.defer();
  // TODO list with filter support
  // TODO merge into single method with listFilesMetadada
  // TODO replace with actions constants
  mediator.publish(this.config.cloudDataTopicPrefix + this.config.datasetId + ':list');
  mediator.once(CONSTANTS.DONE_PREFIX + CONSTANTS.TOPIC_SEPARATOR +  this.config.cloudDataTopicPrefix + this.config.datasetId + ':list', function(files) {
    // TODO send filter to storage engine directly instead of filtering large results in code
    // Requires change in
    var filtered = files.filter(function(file) {
      return String(file.owner) === String(userId);
    });
    deferred.resolve(filtered);
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
  // TODO replace with actions constants
  // TODO support failures
  mediator.request(this.config.cloudDataTopicPrefix + this.config.datasetId + ':create', fileMeta, {uid: fileMeta.id});
  mediator.once(CONSTANTS.DONE_PREFIX + CONSTANTS.TOPIC_SEPARATOR +  this.config.cloudDataTopicPrefix + this.config.datasetId + ':create', function(result) {
    deferred.resolve(result);
  });
  return deferred.promise;
};

module.exports = FileMediatorService;