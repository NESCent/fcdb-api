var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
function getConnection() {
  var connection = mysql.createConnection(connectionParams);
  return connection;
}

function Fossil(databaseRow) {
  // Fossil Number
  // Fossil Name
  // Fossil Strat Unit
  // Fossil Max
  // Fossil Min
  // Fossil Position
  // Fossil Reference
}

function Calibration(databaseRow) {
  // Properties to fill
  this.nodeName = databaseRow['NodeName'];
  this.nodeMinAge = databaseRow['MinAge'];
  this.nodeMaxAge = databaseRow['MaxAge'];
  this.calibrationReference = databaseRow['FullReference'];
  var calibrationId = databaseRow['']
  this.fossils = [];
  // fossils
  // TODO: make fossil objects

  this.tipPairs = [];
  // tip_pairs
    // Tip 1 Name
    // Tip 2 Name
    // “Distance” of root from tip(s)?
}

function Calibrations() {
  function query(queryString, queryParams, callback) {
    var connection = getConnection();
    connection.connect();
    connection.query(queryString, queryParams, callback);
    connection.end()
  }

  var TABLE_NAME = 'View_Calibrations';
  this.findById = function(calibration_id, callback) {
    // callback is (calibration, err)
    // query the calibrations by id
    var queryString = 'SELECT * FROM ' + TABLE_NAME + ' WHERE CalibrationID = ?';
    // TODO: write a method that takes a calibration Id and makes a calibration
    // populating its fossils too
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
    var queryString = 'SELECT * FROM ' + TABLE_NAME + ' WHERE minAge > ? AND maxAge < ?';
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