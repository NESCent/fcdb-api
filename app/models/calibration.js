var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
var pool  = mysql.createPool(connectionParams);

/*
  Creates a Fossil object from a database row
 */

function Fossil(databaseRow) {
  this.fossilNumber = '1234';
  // Fossil Number
  // Fossil Name
  // Fossil Strat Unit
  // Fossil Max
  // Fossil Min
  // Fossil Position
  // Fossil Reference
}

/*
  Creates a calibration object from a database row
 */
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
  var TABLE_NAME = 'View_Calibrations';
  function query(queryString, queryParams, callback) {
    pool.query(queryString, queryParams, callback);
  }

  function getCalibrationWithId(calibrationId, callback) {
    var queryString = 'SELECT * FROM ' + TABLE_NAME + ' WHERE CalibrationID = ?';
    query(queryString, [calibrationId], function(err, results) {
      if(err) {
        callback(null,err);
      } else {
        var calibrationResult = new Calibration(results[0]);
        callback(calibrationResult);
      }
    });
  }

  function getFossilsForCalibrationId(calibrationId, callback) {
    callback([new Fossil({})]);
  }

  this.findById = function(calibration_id, callback) {
    getCalibrationWithId(calibration_id, function(calibration, err) {
        if(err) {
           callback(null, err);
        } else {
          // attach fossils
          getFossilsForCalibrationId(calibration_id, function (fossils, err) {
            if (err) {
              callback(null, err);
            } else {
              calibration.fossils = fossils;
              callback(calibration);
            }
          });
          // tops
        }
      }
    );
  };
  this.findByFilter = function(params, callback) {
    var queryString = 'SELECT CalibrationID FROM ' + TABLE_NAME + ' WHERE minAge > ? AND maxAge < ?';
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