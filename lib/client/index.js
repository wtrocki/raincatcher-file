var mediatorSubscribers = require('./mediator-subscribers');
var FileClient = require('./file-client');

/**
 * Initialisation of the file module.
 * @param {Mediator} mediator
 * @param {object}  config -  module configuration
 * @param {object}  $fh - feedhenry sdk
 */
module.exports = function(mediator, config, $fh) {

  //Initialising the subscribers to topics that the module is interested in.
  var fileClient = FileClient(config, $fh);
  return mediatorSubscribers.init(mediator, fileClient);
};