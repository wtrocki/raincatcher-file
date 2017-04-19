'use strict';

var express = require('express');
var config = require('../config');
var uuid = require('uuid-js');
var fileService = require('./services/fileService');
var StorageEngine = require("./storage/index");

/**
 * Create router for fileService
 *
 * @param {Object} mediatorService  mediator singleton
 * @param {Object} storageConfiguration  configuration for file storage
 * @returns router instance of express router
 */
function initRouter(mediatorService, storageConfiguration) {
  var router = express.Router();
  var storageEngine = StorageEngine(storageConfiguration);
  router.route('/all').get(function(req, res, next) {
    mediatorService.listFilesMetadata().then(function(fileList) {
      res.json(fileList);
    }).catch(function(err) {
      console.log("Cannot retrieve metadata", err);
      next(err);
    });
  });
  
  router.route('/owner/:owner').get(function(req, res, next) {
    var owner = req.params.owner;
    mediatorService.listFilesMetadata(owner).then(function(fileList) {
      res.json(fileList);
    }).catch(function(err) {
      console.log("Cannot retrieve metadata", err);
      next(err);
    });
  });
  
  router.route('/owner/:owner/upload/base64/:filename').post(function(req, res, next) {
    var uid = uuid.create().toString();
    var fileMeta = {
      owner: req.params.owner,
      name: req.params.filename,
      namespace: req.params.namespace,
      uid: uid,
      id: uid
    };
    var stream = fileService.parseBase64Stream(req);
    fileService.writeStreamToFile(fileMeta, stream).then(function() {
      var location = fileService.filePath(fileMeta.uid);
      return storageEngine.writeFile(fileMeta.namespace, fileMeta.uid, location);
    }).then(function() {
      return mediatorService.createFileMetadata(fileMeta);
    }).then(function() {
      res.json(fileMeta);
    }).catch(function(err) {
      console.log(err);
      next(err);
    });
  });
  
  var binaryUploadInitMiddleware = function(req, res, next) {
    req.fileMeta = {};
    req.fileMeta.id = uuid.create().toString();
    req.fileMeta.uid = req.fileMeta.id;
    req.fileMeta.name = req.body.fileName;
    req.fileMeta.namespace = req.body.namespace;
    req.fileMeta.owner = req.body.ownerId;
    req.fileMeta.mimetype = req.file.mimetype;
    next();
  };
  
  router.route('/upload/binary').post(binaryUploadInitMiddleware, fileService.mutlerMiddleware,
    function(req, res, next) {
      var fileMeta = req.fileMeta;
      var location = fileService.filePath(fileMeta.uid);
      storageEngine.writeFile(fileMeta.namespace, fileMeta.uid, location).then(function() {
        return mediatorService.createFileMetadata(fileMeta);
      }).then(function() {
        res.json(fileMeta);
      }).catch(function(err) {
        console.log(err);
        next(err);
      });
    });
  
  router.route('/get/:filename').get(function(req, res) {
    var fileName = req.params.filename;
    var namespace = req.params.namespace;
    storageEngine.streamFile(namespace, fileName).then(function(buffer) {
      if (buffer) {
        buffer.pipe(res);
      } else {
        res.sendFile(fileService.filePath(fileName));
      }
    });
  });
  return router;
}
/**
 * Main router module. Inits express routes and mount them into router.
 *
 * @param mediator
 * @param app - express app router
 * @param externalConfig - configuration passed from application
 */
module.exports = function(mediator, app, externalConfig) {
  fileService.createTemporaryStorageFolder();
  var MediatorService = require("./services/mediatorService.js");
  var mediatorService = new MediatorService(mediator, config);
  var router = initRouter(mediatorService, externalConfig);
  app.use(config.apiPath, router);
};