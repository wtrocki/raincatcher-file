/**
* CONFIDENTIAL
* Copyright 2016 Red Hat, Inc. and/or its affiliates.
* This is unpublished proprietary source code of Red Hat.
**/
'use strict';

var express = require('express'),
    config = require('./config'),
    os = require('os'),
    tmp = os.tmpdir(),
    uuid = require('uuid-js'),
    q = require('q'),
    fs = require('fs'),
    base64 = require('base64-stream'),
    through = require('through2'),
    imageDir = os.tmpdir() + '/wfm';

fs.mkdir(imageDir, '0775', function(err) {
  if (err && err.code != 'EEXIST') {
    console.log(err);
    throw new Error(err);
  }
});

function writeStreamToFile(fileMeta, stream) {
  var deferred = q.defer();
  stream.on('end', function() {
    // console.log('File save complete:', filename);
    deferred.resolve(fileMeta);
  });
  stream.on('error', function(error) {
    deferred.reject(error);
  });
  var filename = imageDir + '/' + fileMeta.uid;
  stream.pipe(fs.createWriteStream(filename));
  return deferred.promise;
}

var parseBase64Stream = function(req) {
  var passthrough = false;
  var accumulation = '';
  var stream = req.pipe(through(function (chunk, enc, callback) {
      if (!passthrough) {
        accumulation += chunk;
        var test = ';base64,';
        var index = accumulation.indexOf(test);
        if (index > - 1) {
          passthrough = true;
          chunk = accumulation.substr(index + test.length);
        }
      }
      if (passthrough) {
        this.push(chunk);
      }
      callback();
    }))
    .pipe(base64.decode());
  return stream;
}


function initRouter(mediator) {
  var router = express.Router();
  router.route('/').get(function(req, res, next) {
    mediator.publish('wfm:file:list:load');
    mediator.once('done:wfm:file:list:load', function(workflows) {
      res.json(workflows);
    });
  });

  router.route('/upload/base64/:name').post(function(req, res, next) {
    var fileMeta = {
      name: req.params.name
      , uid: uuid.create().toString()
    };
    var stream = parseBase64Stream(req);
    writeStreamToFile(fileMeta, stream).then(function(fileMeta) {
      return mediator.request('wfm:file:create', fileMeta);
    })
    .then(function(fileMeta) {
      res.json(fileMeta);
    }, function(err) {
      console.log(err)
      next(err);
    });
  });

  router.route('/get/:filename').get(function(req, res, next) {
    var filename = req.params.filename;
    res.sendFile(os.tmpdir() + '/wfm/' + filename);
  });

  return router;
};

module.exports = function(mediator, app) {
  var router = initRouter(mediator);
  app.use(config.apiPath, router);
};
