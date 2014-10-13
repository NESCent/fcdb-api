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
  if(!databaseRow) {
    return;
  }
  // Properties to fill
  this.id = databaseRow['CalibrationID'];
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
  // this callback is err, rows, fields
  function query(queryString, queryParams, callback) {
    return pool.query(queryString, queryParams, callback);
  }

  // Fetches a calibration and populates its fossils
  function getCalibration(calibrationId, callback) {
    fetchCalibration(calibrationId, function(err, calibration) {
      if(err) {
        callback(err);
      } else {
        // attach fossils
        fetchFossils(calibrationId, function (err, fossils) {
          if (err) {
            callback(err);
          } else {
            calibration.fossils = fossils;
            callback(null, calibration);
          }
        });
        // tips
        // images
      }
    });
  }

  // Fetch a single calibration from the database by ID and produce a single object
  function fetchCalibration(calibrationId, callback) {
    var queryString = 'SELECT * FROM ' + TABLE_NAME + ' WHERE CalibrationID = ? LIMIT 1';
    query(queryString, [calibrationId], function(err, results) {
      if(err) {
        callback(err);
      } else if(results.length == 0) {
        callback({'error': 'Calibration with id ' + calibrationId + ' not found'});
      } else {
        var calibrationResult = new Calibration(results[0]);
        callback(null, calibrationResult);
      }
    });
  }

  // Fetch Fossils for a calibration from the database and produce a list of fossils
  function fetchFossils(calibrationId, callback) {
    var queryString = 'SELECT F.*, L.* from Link_CalibrationFossil L, View_Fossils F WHERE L.CalibrationId = ? AND L.FossilID = F.FossilID';
    query(queryString, [calibrationId], function(err, results) {
      if(err) {
        callback(err);
      } else {
        var fossilResults = results.map(function(result) { return new Fossil(result); });
        callback(null, fossilResults);
      }
    });
  }

  this.findById = function(calibrationId, callback) {
    getCalibration(calibrationId, function(err, calibration) {
      if (err) {
        callback(err);
      } else {
        callback(null, calibration);
      }
    });
  };

  this.findByFilter = function(params, callback) {
    var queryString = 'SELECT CalibrationID FROM ' + TABLE_NAME + ' WHERE minAge > ? AND maxAge < ?';
    var calibrationResults = [];
    var success = function(result) {
      callback(null, result);
    };

    var failed = function(err) {
      callback(err);
    };

    query(queryString, [params.min, params.max], function(err, results) {
      if(err) {
        failed(err);
        return;
      }
      results.forEach(function(result, index, array) {
      var calibrationId = result['CalibrationID'];
        getCalibration(calibrationId, function(err, calibration) {
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

  // Calls callback with something like {'source':'NCBI', 'taxonid': 4}:
  function fetchNCBITaxonId(ncbiTaxonName, callback) {
    var queryString = 'SELECT taxonid, \'NCBI\' AS source FROM NCBI_names WHERE '
      + 'name LIKE ? OR uniquename LIKE ? LIMIT 1';
    query(queryString, [ncbiTaxonName, ncbiTaxonName], function(err, results) {
      if (err) {
        callback(err);
      } else {
        callback(null, results.length > 0 ? results[0] : null);
      }
    });
    // php code will fall back to FCD names
  }

  function fetchMultiTreeNodeId(source, taxonId, callback) {
    var queryString = 'SELECT getMultiTreeNodeID(?,?) AS node_id';
    query(queryString, [source, taxonId], function (err, results) {
      if (err) {
        callback(err);
      } else {
        // Results resemble this:
        // getMultiTreeNodeID('FCD-116',241); -> [{'node_id' : -1}]
        callback(null, results.length > 0 ? results[0].node_id : null);
      }
    });
  }

  function fetchCalibrationIdsInCladeMultiTree(multiTreeNodeId, callback) {
    var queryString = 'SELECT DISTINCT calibration_id FROM calibrations_by_NCBI_clade WHERE clade_root_multitree_id = ?';
    query(queryString, [multiTreeNodeId], function(err, results) {
      if (err) {
        callback(err);
      } else {
        var extractedIds = results.map(function(result) { return result['calibration_id']; });
        callback(null, extractedIds);
      }
    });
  }

  this.findByClade = function(params, callback) {
    // Search by clade.
    // Starts with a clade/taxon name
    var success = function(result) {
      callback(null, result);
    };

    var failed = function(err) {
      callback(err);
    };

    var taxonName = params.clade;
    fetchNCBITaxonId(taxonName, function(err, taxon) {
      // have a taxon id, now get the multi tree from the taxon
      if (err) {
        failed(err);
        return;
      }
      if(!taxon) {
        failed({error:'No node found for ' + taxonName});
        return;
      }
      fetchMultiTreeNodeId(taxon.source, taxon.taxonid, function(err, multiTreeNodeId) {
        if (err) {
          failed(err);
          return;
        }
        // have a multi tree, now see what calibrations are in it.
        var calibrationResults = [];
        fetchCalibrationIdsInCladeMultiTree(multiTreeNodeId, function(err, calibrationIds) {
          calibrationIds.forEach(function(calibrationId, index, array) {
            getCalibration(calibrationId, function(err, calibration) {
              if(err) {
                failed(err);
                return;
              }
              calibrationResults.push(calibration);
              if(index == array.length - 1) {
                success(calibrationResults);
                return;
              }
            });
          });
        });
      });

    });
    // Current algorithm in PHP:
    // calls nameToMultitreeID to get the multi tree ID from a clade name
      // calls nameToSourceNodeInfo with the taxon name
      // returns a multiTreeID. Prefixes this with 'mID:' and saves it in nodeValues
    // calls getAllCalibrationsInClade with the multitree id
    // adds calibrations to a result array

  };
}

module.exports = new Calibrations();