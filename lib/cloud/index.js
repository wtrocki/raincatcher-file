'use strict';

var express = require('express');
var config = require('../config');
var uuid = require('uuid-js');
var fileService = require('./services/fileService');

function initRouter(mediatorService) {
  var router = express.Router()
  
  router.route('/all').get(function(req, res) {
    mediatorService.listFilesMetadata(null).then(function(fileList) {
      res.json(fileList);
    });
  });
  
  router.route('/owner/:owner').get(function(req, res) {
    var owner = req.params.owner;
    mediatorService.listFilesMetadata(owner).then(function(fileList) {
      res.json(fileList);
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
    var promise = fileService.writeStreamToFile(fileMeta, stream);
    if (config.usePersistentStorage) {
      promise = promise.then(function() {
        var location = fileService.filePath(fileMeta.uid);
        return mediatorService.saveFileToStorage(fileMeta.namespace, fileMeta.uid, location);
      });
    }
    promise.then(function() {
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
    req.fileMeta.uid = req.fileMeta.id = uuid.create().toString();
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
      var promise;
      if (config.usePersistentStorage) {
        promise = mediatorService.saveFileToStorage(fileMeta.namespace, fileMeta.uid, location).then(function() {
          return mediatorService.createFileMetadata(fileMeta);
        });
      } else {
        promise = mediatorService.createFileMetadata(fileMeta);
      }
      return promise.then(function() {
        res.json(fileMeta);
      }).catch(function(err) {
        console.log(err);
        next(err);
      });
    });
  
  router.route('/get/:filename').get(function(req, res) {
    var fileName = req.params.filename;
    if (config.usePersistentStorage) {
      var namespace = req.params.namespace;
      mediatorService.fetchFileFromStorage(namespace, fileName).then(function(buffer) {
        buffer.pipe(res);
      });
    } else {
      res.sendFile(fileService.filePath(fileName));
    }
  });
  return router;
}

module.exports = function(mediator, app) {
  fileService.createTemporaryStorageFolder();
  var MediatorService = require("./services/mediatorService.js");
  var mediatorService = new MediatorService(mediator, config);
  var router = initRouter(mediatorService);
  app.use(config.apiPath, router);
};
