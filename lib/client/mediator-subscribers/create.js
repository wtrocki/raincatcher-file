var _ = require('lodash');
var CONSTANTS = require('../../constants');


/**
 * Initialising a subscriber for creating a file.
 *
 * @param {object} fileEntityTopics
 * @param fileClient
 */
module.exports = function createFileSubscriber(fileEntityTopics, fileClient) {

  /**
   * Handling the creation of a file
   *
   * @param {object} parameters
   * @param {object} parameters.fileToCreate   - The file item to create
   * @param {string/number} parameters.topicUid     - (Optional)  A unique ID to be used to publish completion / error topics.
   * @returns {*}
   */
  return function handleCreateFileTopic(parameters) {
    var self = this;
    parameters = parameters || {};
    var fileCreateErrorTopic = fileEntityTopics.getTopic(CONSTANTS.TOPICS.CREATE, CONSTANTS.ERROR_PREFIX, parameters.topicUid);

    var fileToCreate = parameters.fileToCreate;

    //If no file is passed, can't create one
    if (!_.isPlainObject(fileToCreate)) {
      return self.mediator.publish(fileCreateErrorTopic, new Error("Invalid Data To Create A File."));
    }

    fileClient.createFile(fileToCreate)
    .then(function(response) {
      self.mediator.publish(fileEntityTopics.getTopic(CONSTANTS.TOPICS.CREATE, CONSTANTS.DONE_PREFIX, parameters.topicUid), response);
    }).catch(function(error) {
      self.mediator.publish(fileCreateErrorTopic, error);
    });
  };
};