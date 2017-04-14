/**
 * Check if internet connection is available and cloud app can be reached
 *
 * @param cb
 */
var canConnectToCloud = function($fh, cb) {
  $fh.cloud({
    method: 'GET',
    path: 'sys/info/ping'
  }, function(res) {
    if (res === "OK") {
      return cb(true);
    } else {
      return cb(false);
    }
  }, function() {
    return cb(false);
  });
};

module.exports = {
  canConnectToCloud: canConnectToCloud
};