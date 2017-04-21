'use strict';
var _ = require('lodash');

/**
 * Simple queue implementation backed by browser persistent storage
 *
 * @param name
 */
var queue = function(name) {
  this.queueName = name;
  this.queueData = [];
};

/**
 * Persist queue items to local storage;
 * @return queue
 */
queue.prototype.saveData = function() {
  var toSave = JSON.stringify({
    queue: this.queueData
  });
  localStorage.setItem(this.queueName, toSave);
  return this;
};

/**
 * Read queue items from local storage
 * @return queue
 */
queue.prototype.restoreData = function() {
  var queueDataString = localStorage.getItem(this.queueName);
  if (queueDataString) {
    var queueData = JSON.parse(queueDataString);
    this.queueData = queueData.queue;
  } else {
    this.queueData = [];
  }
  return this;
};

/**
 * @param {object} item meta data model
 * @return {Array} queue items
 */
queue.prototype.getItemList = function() {
  return this.queueData;
};

/**
 * @param {object} item meta data model
 */
queue.prototype.addItem = function(item) {
  this.queueData.push(item);
  // TODO save queue as array of items
  this.saveData();
};

/**
 * @param {object} item meta data model
 */
queue.prototype.removeItem = function(item) {
  _.remove(this.queueData, item);
  this.saveData();
};

/**
 * @param {object} item meta data model
 */
queue.prototype.readItem = function(id) {
  return _.find(this.queueData, function(item) {
    return item.id === id;
  });
};

module.exports = queue;