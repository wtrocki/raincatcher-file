var gridfsStorage = require('./gridfsStorage');
var s3Storage = require('./awsStorage');
var tempStorage = require('./tempStorage');
var client;

/**
 *
 * Initialising the storage engine
 *
 * @param config
 * @returns {StorageEngine} storageObject
 *
 * function init(storageConfiguration)
 * function writeFile(namespace, fileName, fileLocation)
 * function streamFile(namespace, fileName)
 */
module.exports = function(config) {
  if (!client) {
    if (config.s3) {
      client = s3Storage;
      client.init(config.s3);
    } else if (config.gridFs) {
      client = gridfsStorage;
      client.init(config.gridFs);
    } else {
      client = tempStorage;
      client.init();
    }
  }
  return client;
};