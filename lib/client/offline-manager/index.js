'use strict';

var queue = require('./queue');
var _ = require("lodash");
var QUEUE_NAME = "wfm-file-uploads";

var FileQueueManager = function($fh, fileClient) {
  this.$fh = $fh;
  this.uploadQueue = new queue(QUEUE_NAME);
  this.fileClient = fileClient;
  // Start processing uploads on startup
  this.startProcessingUploads();
  // Listen when client becomes online for uploads
  document.addEventListener("online", this.startProcessingUploads);
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
      // TODO queue uploads after they finished using promises.
      self.fileClient.createFile(item).then(function(createdFile) {
        self.removeFromQueue(item);
        console.log("File saved", createdFile);
      }).catch(function(err) {
        console.log("Failed saving item", item, err);
      });
    });
  } else {
    console.log("Queue is empty");
  }
};

module.exports = FileQueueManager;