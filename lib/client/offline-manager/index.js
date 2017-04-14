'use strict';

var queue = require('./queue');
var _ = require("lodash");
var networkUtil = require("./network-util");

var QUEUE_NAME = "wfm-file-uploads";

var FileQueueManager = function($fh, fileClient) {
  this.$fh = $fh;
  this.uploadQueue = new queue(QUEUE_NAME);
  this.fileClient = fileClient;
  this.startPooling();
};

// FIXME CRITICAL use cordova plugin to detect network state
FileQueueManager.prototype.startPooling = function() {
  if (!this.pollingInterval) {
    var self = this;
    var poolingTime = 10000;
    this.pollingInterval = window.setInterval(function() {
      self.initFileTransfers();
    }, poolingTime);
  }
};

FileQueueManager.prototype.removeFromQueue = function(object) {
  return this.uploadQueue.removeItem(object);
};

FileQueueManager.prototype.addQueueItem = function(object) {
  return this.uploadQueue.addItem(object);
};

FileQueueManager.prototype.startProcessingUploads = function() {
  var self = this;
  var queueItems = this.uploadQueue.restoreData().getItemList();
  if (queueItems && queueItems.length > 0) {
    _.each(queueItems, function(item) {
      self.fileClient.createFile(item).then(function(createdFile) {
        self.removeFromQueue(item);
        console.log("File saved", createdFile);
      }).catch(function(err) {
        console.log("Failed saving item", item, err);
      });
    });
  } else {
    console.log("queue is empty");
    window.cleanInterval(this.pollingInterval);
    this.pollingInterval = null;
  }
};

FileQueueManager.prototype.stopProcessingUploads = function() {
  // TODO save
};

FileQueueManager.prototype.initFileTransfers = function() {
  var self = this;
  networkUtil.canConnectToCloud(this.$fh, function(isOnline) {
    if (isOnline) {
      self.startProcessingUploads();
    } else {
      self.stopProcessingUploads();
    }
  });
};

module.exports = FileQueueManager;