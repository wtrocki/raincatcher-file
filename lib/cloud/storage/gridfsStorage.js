var q = require('q');
var fs = require('fs');
var mongo = require('mongodb');
var Grid = require('gridfs-stream');
var MongoClient = require('mongodb').MongoClient;

var gfsPromise;

/**
 * Storage engine that utilizes gridfs mongodb connection to store files
 */
var gridFsStorage = {
  init: init,
  writeFile: writeFile,
  streamFile: streamFile
};

/**
 * Init module
 *
 * @param storageConfiguration configuration that should be passed from client
 * Example:
 *  {
 *    mongoUrl: "mongodb://localhost:27017/files"
 *  }
 */
function init(storageConfiguration) {
  var config = storageConfiguration;
  if (!config || !config.mongoUrl) {
    throw Error("Missing mongoUrl parameter for GridFs storage");
  }
  var deferred = q.defer();
  MongoClient.connect(config.mongoUrl, function(err, connection) {
    if (err) {
      console.log("Cannot connect to mongodb server. Gridfs storage will be disabled");
      return deferred.reject(err);
    }
    var gfs = Grid(connection, mongo);
    deferred.resolve(gfs);
  });
  gfsPromise = deferred.promise;
}

/**
 * Write file to the storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 * @param {string} fileLocation - local filesystem location to the file
 */
function writeFile(namespace, fileName, fileLocation) {
  if (!gfsPromise) {
    return;
  }
  return gfsPromise.then(function(gfs) {
    var deferred = q.defer();
    var options = {
      filename: fileName
    };
    if (namespace) {
      options.root = namespace;
    }
    var writeStream = gfs.createWriteStream(options);
    writeStream.on('error', function(err) {
      console.log('An error occurred!', err);
      deferred.reject(err);
    });
    writeStream.on('close', function(file) {
      deferred.resolve(file);
    });
    fs.createReadStream(fileLocation).pipe(writeStream);
    return deferred.promise;
  });
}

/**
 * Retrieve file stream from storage
 *
 * @param {string} namespace - location (folder) used to place saved file.
 * @param {string} fileName - filename that should be unique within namespace
 *
 */
function streamFile(namespace, fileName) {
  return gfsPromise.then(function(gfs) {
    var deferred = q.defer();
    var options = {
      filename: fileName
    };
    if (namespace) {
      options.root = namespace;
    }
    var readstream = gfs.createReadStream(options);
    readstream.on('error', function(err) {
      console.log('An error occurred when reading file from gridfs!', err);
    });
    deferred.resolve(readstream);
    return deferred.promise;
  });
}

module.exports = gridFsStorage;
