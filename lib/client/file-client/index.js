var FileClient = require('./FileClient');
var manager;

/**
 *
 * Initialising the FileClient
 *
 * @param config
 * @returns {WorkflowMediatorService}
 */
module.exports = function(config, $fh) {
  
  //If there is already a manager, use this
  if (!manager) {
    manager = new FileClient(config, $fh);
  }
  
  return manager;
};