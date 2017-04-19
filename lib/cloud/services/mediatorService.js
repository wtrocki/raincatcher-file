var CONSTANTS = require('../../constants');
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
  this.filesDataTopics = new MediatorTopicUtility(mediator).prefix(this.config.cloudDataTopicPrefix).entity(this.config.datasetId);
}

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