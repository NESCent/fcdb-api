var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
var pool  = mysql.createPool(connectionParams);

/*
  Creates a Fossil object from a database row
 */

function Fossil(databaseRow) {
  /*
  // fields available
   FossilID 101
   CollectionAcro MNHNFr
   CollectionNumber Av.4134
   FossilPub 161
   LocalityID 50
   LocalityName CrÃ©chy, France
   Country France
   LocalityNotes
   Stratum Saint-GÃ©rand-le-Puy
   StratumMinAge 0
   StratumMaxAge 0
   PBDBCollectionNum
   Age Chattian
   Epoch Oligocene
   Period Paleogene
   System Cenozoic
   StartAge 28.5
   EndAge 23.8
   ShortName GSA 1999
   FullReference 1999 Geological Time Scale, The Geological Society of America. Product code CTS004.  Compilers: A. R. Palmer and J. Geissman.
   */
  this.id = databaseRow['FossilID'];
  this.collection = databaseRow['CollectionAcro'];
  this.collectionNumber = databaseRow['CollectionNumber'];
  this.shortReference = databaseRow['ShortName'];
  this.fullReference = databaseRow['FullReference'];

  // Fossil Strat Unit
  // Fossil Max
  // Fossil Min
  // Fossil Position
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
    var queryString = 'SELECT F.* from Link_CalibrationFossil L, View_Fossils F WHERE L.CalibrationId = ? AND L.FossilID = F.FossilID';
    query(queryString, [calibrationId], function(err, results) {
      if(err) {
        callback(null,err);
      } else {
        var fossilResults = results.map(function(result) { return new Fossil(result); });
        callback(fossilResults);
      }
    });
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
          // tips
        }
      }
    );
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
        getCalibrationWithId(calibrationId, function(calibration, err) {
          if(err) {
            failed(err);
            return;
          }
          getFossilsForCalibrationId(calibrationId, function(fossils, err) {
            if(err) {
              failed(err);
              return;
            }
            calibration.fossils = fossils;
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
    });
  };
}

module.exports = new Calibrations();