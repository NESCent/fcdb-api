var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
function getConnection() {
  var connection = mysql.createConnection(connectionParams);
  return connection;
}

function Calibration(databaseRow) {
    for(var propertyName in databaseRow) {
        this[propertyName] = databaseRow[propertyName];
    }
}

function Calibrations() {
  function query(queryString, queryParams, callback) {
    var connection = getConnection();
    connection.connect();
    connection.query(queryString, queryParams, callback);
    connection.end()
  }

  this.findById = function(calibration_id, callback) {
    // callback is (calibration, err)
    // query the calibrations by id
    var queryString = 'SELECT * FROM calibrations WHERE CalibrationID = ?';
    query(queryString, [calibration_id], function(err, results) {
        if(err) {
          callback(null,err);
        } else {
          var calibrationResult = new Calibration(results[0]);
          callback(calibrationResult);
        }
      });
    };
  this.findByFilter = function(params, callback) {
    var queryString = 'SELECT * FROM calibrations WHERE minAge > ? AND maxAge < ?';
    query(queryString, [params.min, params.max], function(err, results) {
      if(err) {
        callback(null,err);
      } else {
        var calibrationResults = results.map(function(result) { return new Calibration(result)});
        callback(calibrationResults);
      }
    });
  };
}

module.exports = new Calibrations();