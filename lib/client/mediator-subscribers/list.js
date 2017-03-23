var CONSTANTS = require('../../constants');

/**
 * Initialising a subscriber for listing files.
 *
 * @param {object} fileEntityTopics
 * @param fileClient
 */
module.exports = function listFileSubscriber(fileEntityTopics, fileClient) {

  /**
   *
   * Handling the listing of files
   *
   * @param {object} parameters
   * @param {string/number} parameters.topicUid  - (Optional)  A unique ID to be used to publish completion / error topics.
   * @returns {*}
   */
  return function handleListFilesTopic(parameters) {
    var self = this;
    parameters = parameters || {};
    var fileListErrorTopic = fileEntityTopics.getTopic(CONSTANTS.TOPICS.LIST, CONSTANTS.ERROR_PREFIX, parameters.topicUid);

    var fileListDoneTopic = fileEntityTopics.getTopic(CONSTANTS.TOPICS.LIST, CONSTANTS.DONE_PREFIX, parameters.topicUid);

    fileClient.list(parameters.userId)
    .then(function(arrayOfFiles) {
      self.mediator.publish(fileListDoneTopic, arrayOfFiles);
    }).catch(function(error) {
      self.mediator.publish(fileListErrorTopic, error);
    });
  };
};