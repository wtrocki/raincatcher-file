var q = require('q');
var s3 = require('s3');
var path = require('path');
var CONSTANTS = require('../../constants');

var config;
var awsClient;

/**
 * Storage engine using AWS S3 api to store files
 * @type {{init: init, writeFile: writeFile, streamFile: streamFile}}
 */
var awsStorage = {
  init: init,
  writeFile: writeFile,
  streamFile: streamFile
};

/**
 * Init module
 *
 * @param storageConfiguration configuration that should be passed from client
 *
 * Example:
 *   {
 *    s3Options: {
 *       accessKeyId: process.env.AWS_S3_ACCESS_KEY,
 *       secretAccessKey: process.env.AWS_S3_ACCESS_KEY_SECRET,
 *       region: process.env.AWS_S3_REGION
 *     },
 *     bucket: "raincatcher-files"
 *   }
 */
function init(storageConfiguration) {
  config = storageConfiguration;
  validateConfig();
  awsClient = s3.createClient(config);
}
/**
 * Write file to the storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 * @param {string} fileLocation - local filesystem location to the file
 */
function writeFile(namespace, fileName, fileLocation) {
  var file;
  if (namespace) {
    file = path.join(namespace, fileName);
  } else {
    file = fileName;
  }
  var params = {
    localFile: fileLocation,
    ACL: CONSTANTS.AWS_BUCKET_PERMISSIONS,
    s3Params: {
      Bucket: config.bucket,
      Key: file
    }
  };
  var deferred = q.defer();
  var uploader = awsClient.uploadFile(params);
  uploader.on('error', function(err) {
    console.log(err);
    deferred.reject(err.stack);
  });
  uploader.on('end', function() {
    deferred.resolve(fileName);
  });
  return deferred.promise;
}

/**
 * Retrieve file stream from storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 *
 */
function streamFile(namespace, fileName) {
  var file;
  if (namespace) {
    file = path.join(namespace, fileName);
  } else {
    file = fileName;
  }
  var deferred = q.defer();
  var paramsStream = {
    Bucket: config.bucket,
    Key: file
  };
  try {
    var stream = awsClient.downloadStream(paramsStream);
    deferred.resolve(stream);
  } catch (error) {
    console.log(error);
    deferred.reject(error);
  }
  return deferred.promise;
}

function validateConfig() {
  if (!config.bucket) {
    throw Error("Invalid configuration for s3 storage: Please specify bucket name");
  }
  if (!config.s3Options) {
    throw Error("Invalid configuration for s3 storage");
  }
  if (!config.s3Options.accessKeyId) {
    throw Error("Invalid configuration for s3 storage: Access Key missing");
  }
  if (!config.s3Options.secretAccessKey) {
    throw Error("Invalid configuration for s3 storage: secretAccessKeymissing");
  }
  if (!config.s3Options.region) {
    throw Error("Invalid configuration for s3 storage: region missing");
  }
}

/**
 * Implements storage interface for AWS S3 storage
 *
 * @type {{init: function, writeFile: function, streamFile: function}}
 */
module.exports = awsStorage;
