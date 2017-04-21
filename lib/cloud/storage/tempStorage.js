var q = require('q');

/**
 * Interface for storage engines used when no persistent storage configuration is passed from client
 * @type {{init: init, writeFile: writeFile, streamFile: streamFile}}
 */
var tempStorageInterface = {
  init: init,
  writeFile: writeFile,
  streamFile: streamFile
};


/**
 * Init module
 */
function init() {
}

/**
 * Write file to the storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 * @param {string} fileLocation - local filesystem location to the file
 */
function writeFile(namespace, fileName, fileLocation) {
  var deferred = q.defer();
  // File is already written by middleware
  deferred.resolve(fileLocation);
  return deferred.promise;
}

/**
 * Retrieve file stream from storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 */
function streamFile() {
  var deferred = q.defer();
  deferred.resolve();
  return deferred.promise;
}

module.exports = tempStorageInterface;
