var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
var pool  = mysql.createPool(connectionParams);

/*
  Creates a Fossil object from a database row
 */

function Fossil(databaseRow) {
  // From Link_CalibrationFossil and View_Fossils
  this.id = databaseRow['FossilID'];
  this.collection = databaseRow['CollectionAcro'];
  this.collectionNumber = databaseRow['CollectionNumber'];
  this.shortReference = databaseRow['ShortName'];
  this.fullReference = databaseRow['FullReference'];
  this.stratUnit = databaseRow['Stratum'];
  this.maxAge = databaseRow['MaxAge'];
  this.maxAgeType = databaseRow['MaxAgeType'];
  this.maxAgeTypeDetails = databaseRow['MaxAgeTypeOtherDetails'];
  this.minAge = databaseRow['MinAge'];
  this.minAgeType = databaseRow['MinAgeType'];
  this.minAgeTypeDetails = databaseRow['MinAgeTypeOtherDetails'];
  this.locationRelativeToNode= databaseRow['FossilLocationRelativeToNode'];
}

/*
  Creates a TipPair object from a database row
 */

function TipPair(databaseRow) {

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
  this.fossils = [];
  // fossils
  this.tipPairs = [];
  // tip_pairs
    // Tip 1 Name
    // Tip 2 Name
    // “Distance” of root from tip(s)?
}

function Calibrations() {
  var TABLE_NAME = 'View_Calibrations';
  function query(queryString, queryParams, callback) {
    return pool.query(queryString, queryParams, callback);
  }

  // Fetches a calibration and populates its fossils
  function getCalibration(calibrationId, callback) {
    fetchCalibration(calibrationId, function(calibration, err) {
      if(err) {
        callback(null, err);
      } else {
        // attach fossils
        fetchFossils(calibrationId, function (fossils, err) {
          if (err) {
            callback(null, err);
          } else {
            calibration.fossils = fossils;
            callback(calibration);
          }
        });
        // tips
      }
    });
  }

  // Fetch a single calibration from the database by ID and produce a single object
  function fetchCalibration(calibrationId, callback) {
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

  // Fetch Fossils for a calibration from the database and produce a list of fossils
  function fetchFossils(calibrationId, callback) {
    var queryString = 'SELECT F.*, L.* from Link_CalibrationFossil L, View_Fossils F WHERE L.CalibrationId = ? AND L.FossilID = F.FossilID';
    query(queryString, [calibrationId], function(err, results) {
      if(err) {
        callback(null,err);
      } else {
        var fossilResults = results.map(function(result) { return new Fossil(result); });
        callback(fossilResults);
      }
    });
  }

  this.findById = function(calibrationId, callback) {
    getCalibration(calibrationId, callback);
  };

  this.findByFilter = function(params, callback) {
    var queryString = 'SELECT CalibrationID FROM ' + TABLE_NAME + ' WHERE minAge > ? AND maxAge < ?';
    var calibrationResults = [];
    var success = function(result) {
      callback(result);
    };

    var failed = function(err) {
      callback(null, err);
    };

    query(queryString, [params.min, params.max], function(err, results) {
      if(err) {
        failed(err);
        return;
      }
      results.forEach(function(result, index, array) {
      var calibrationId = result['CalibrationID'];
        getCalibration(calibrationId, function(calibration, err) {
          if(err) {
            failed(err);
            return;
          }
          calibrationResults.push(calibration);
          // If this is the last one, finish everything up
          // This is done because mysql results are async
          // Could use the async node module to help a little bit, but this works for now
          if(index == array.length - 1) {
            success(calibrationResults);
            return;
          }
        });
      });
    });
  };
}

module.exports = new Calibrations();