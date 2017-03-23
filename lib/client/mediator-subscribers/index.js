var _ = require('lodash');
var topicHandlers = {
  create: require('./create'),
  list: require('./list'),
};
var CONSTANTS = require('../../constants');

var MediatorTopicUtility = require('fh-wfm-mediator/lib/topics');

var fileSubscribers;

module.exports = {
  /**
   * Initialisation of all the topics that this module is interested in.
   * @param {Mediator}                   mediator
   * @param {FileMediatorService}    fileClient
   * @returns {Topics|exports|module.exports|*}
   */
  init: function(mediator, fileClient) {
    //If there is already a set of subscribers set up, then don't subscribe again.
    if (fileSubscribers) {
      return fileSubscribers;
    }

    fileSubscribers = new MediatorTopicUtility(mediator);
    fileSubscribers.prefix(CONSTANTS.TOPIC_PREFIX).entity(CONSTANTS.FILES_ENTITY_NAME);

    //Setting up subscribers to the file topics.
    _.each(CONSTANTS.TOPICS, function(topicName) {
      if (topicHandlers[topicName]) {
        fileSubscribers.on(topicName, topicHandlers[topicName](fileSubscribers, fileClient));
      }
    });
    return fileSubscribers;
  },
  tearDown: function() {
    if (fileSubscribers) {
      fileSubscribers.unsubscribeAll();
      fileSubscribers = null;
    }
  }
};