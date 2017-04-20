var FileClient = require('./file-client');

/**
 * Initialisation of the file module.
 * @param {object}  config -  module configuration
 * @param {object}  $fh - feedhenry sdk
 */
module.exports = function(config, $fh) {
  //Initialising the subscribers to topics that the module is interested in.
  var fileClient = FileClient(config, $fh);
  
  // OPTION 1 initialize global directly in module
  if (window.modrain && !window.modrain.file) {
    window.modrain.file = fileClient;
  }
  return fileClient;
};