var CONSTANTS = require('../../constants');
var shortid = require('shortid');
var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

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
 * Get file Stream from storage
 *
 * @param namespace {String} - namespace used to catalog files in different folders/locations.
 * @param fileName {String} - name of the file
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.fetchFileFromStorage = function(namespace, fileName) {
  var topicUid = shortid.generate();
  return this.filesStorageTopics.request(CONSTANTS.STORAGE_TOPICS.GET, {
    namespace: namespace,
    fileName: fileName,
    topicUid: topicUid
  }, {uid: topicUid})
    .timeout(this.config.topicTimeout || CONSTANTS.TOPIC_TIMEOUT);
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
  return this.filesStorageTopics.request(CONSTANTS.STORAGE_TOPICS.CREATE, {
    namespace: namespace,
    fileName: fileName,
    location: location,
    topicUid: topicUid
  }, {uid: topicUid})
    .timeout(this.config.topicTimeout || CONSTANTS.TOPIC_TIMEOUT);
};

/**
 * List files metadata for user
 *
 * @param userId {String} - id of the user used to filter results
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.listFilesMetadata = function(userId) {
  return this.filesDataTopics
    .request(CONSTANTS.TOPICS.LIST)
    .then(function(files) {
      // TODO send filter to storage engine directly instead of filtering large results in code
      // TODO support query limits
      if (files && userId) {
        var filtered = files.filter(function(file) {
          return String(file.owner) === String(userId);
        });
        return filtered;
      }
      return files;
    });
};

/**
 * Create file metadata
 *
 * @param fileMeta {Object} - file metadata including name
 *
 * @returns {Promise} promise
 */
FileMediatorService.prototype.createFileMetadata = function(fileMeta) {
  return this.filesDataTopics
    .request(CONSTANTS.TOPICS.CREATE, fileMeta);
};

module.exports = FileMediatorService;