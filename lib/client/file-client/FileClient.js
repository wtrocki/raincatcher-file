'use strict';

var config = require('../../config'),
  q = require('q');

var $fh;

/**
 * A FileClient service that will be responsible for file data management
 *
 * @param {object} config
 * @param {object} fhSdk
 * @constructor
 */
var FileClient = function FileClient(config, fhSdk){
  $fh = fhSdk;
};

FileClient.prototype.init = function() {
  var deferredFhinit = q.defer();
  $fh.on('fhinit', function(error) {
    if (error) {
      deferredFhinit.reject(new Error(error));
      return;
    }
    this.cloudUrl = $fh.getCloudURL();
    deferredFhinit.resolve();
  });

  var deferredReady = q.defer();
  if (window.cordova) {
    document.addEventListener("deviceready", function cameraReady() {
      deferredReady.resolve();
    }, false);
  } else {
    deferredReady.resolve();
  }

  this.initPromise = q.all([deferredFhinit.promise, deferredReady.promise]);
  return this.initPromise;
};


/***
 * List files for particular user. If user parameter is not provided returns list of all files
 *
 * @param userId
 */
FileClient.prototype.list = function(userId) {
  var url = !userId ? config.apiPath + '/all' : config.apiPath + '/owner/' + userId;
  var deferred = q.defer();
  $fh.cloud({
      path: url,
      method: 'get'
    },
    function(res) {
      deferred.resolve(res);
    },
    function(message, props) {
      var e = new Error(message);
      e.props = props;
      deferred.reject(e);
    }
  );
  return deferred.promise;
};

/**
 * Upload file to server.
 * Function would choose right method depending on parameters.
 *
 * @param file {userId, fileURI, options, dataUrl}
 * @returns {*}
 */
FileClient.prototype.createFile = function(file){
  if(file.fileURI && file.options){
    return this.uploadFile(file.userId, file.fileURI, file.options)
  }else if(file.dataUrl){
    return this.uploadDataUrl(file.userId, file.dataUrl)
  }else{
    return q.reject('Missing required fields for file object ', file);
  }
};


/**
 * Upload file using local file URI. Used for uploads on mobile devices (cordova based)
 *
 * @param userId
 * @param fileURI
 * @param options
 * @returns {*}
 */
FileClient.prototype.uploadFile = function(userId, fileURI, options) {
  if (arguments.length < 2) {
    return q.reject('userId and fileURI parameters are required.');
  } else {
    options = options || {};
    var fileUploadOptions = new FileUploadOptions();
    fileUploadOptions.fileKey = options.fileKey || 'binaryfile';
    fileUploadOptions.fileName = options.fileName;
    fileUploadOptions.mimeType = options.mimeType || 'image/jpeg';
    fileUploadOptions.params = {
      ownerId: userId,
      fileName: options.fileName
    };
    var timeout = options.timeout || 2000;
    var retries = options.retries || 1;
    return this.initPromise.then(function() {
      var serverURI = window.encodeURI(this.cloudUrl + config.apiPath + '/upload/binary');
      return fileUploadRetry(fileURI, serverURI, fileUploadOptions, timeout, retries);
    });
  }
};

/**
 * Upload file using dataUrl.
 * Used by local desktop camera when app running on non mobile environments
 *
 * @param userId
 * @param dataUrl
 */
FileClient.prototype.uploadDataUrl = function(userId, dataUrl) {
  var deferred = q.defer();
  if (arguments.length < 2) {
    deferred.reject('Both userId and a dataUrl parameters are required.');
  } else {
    $fh.cloud({
      path: config.apiPath + '/owner/'+userId+'/upload/base64/photo.png',
      method: 'post',
      data: dataUrl
    },
    function(res) {
      deferred.resolve(res);
    },
    function(message, props) {
      var e = new Error(message);
      e.props = props;
      deferred.reject(e);
    });
  }
  return deferred.promise;
};

// Handling file upload to server
function fileUpload(fileURI, serverURI, fileUploadOptions) {
  var deferred = q.defer();
  var transfer = new FileTransfer();
  transfer.upload(fileURI, serverURI, function uploadSuccess(response) {
    deferred.resolve(response);
  }, function uploadFailure(error) {
    deferred.reject(error);
  }, fileUploadOptions);
  return deferred.promise;
}

// Handling retry mechanism of the file upload.
function fileUploadRetry(fileURI, serverURI, fileUploadOptions, timeout, retries) {
  return fileUpload(fileURI, serverURI, fileUploadOptions)
  .then(function(response) {
    return response;
  }, function() {
    if (retries === 0) {
      throw new Error("Can't upload to " + JSON.stringify(serverURI));
    }
    return q.delay(timeout)
    .then(function() {
      return fileUploadRetry(fileURI, serverURI, fileUploadOptions, timeout, retries - 1);
    });
  });
}

module.exports = FileClient;
