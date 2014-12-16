var mysql  = require('mysql');
var connectionParams = require('../../config/connectionParams');
var pool  = mysql.createPool(connectionParams);
var async = require('async');

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
        // TODO: tips
        // TODO: images
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

  function intersection_destructive(a, b)
  {
    var result = new Array();
    while( a.length > 0 && b.length > 0 )
    {
      if      (a[0] < b[0] ){ a.shift(); }
      else if (a[0] > b[0] ){ b.shift(); }
      else /* they're equal */
      {
        result.push(a.shift());
        b.shift();
      }
    }

    return result;
  }

  /*
    Calibrations can be searched by taxon/clade or age/geological period
   */
  this.query = function(params, callback) {
    // avoid closure conflicts
    var thisCalibration = this;

    // Convenience functions for ultimate success/failure
    var success = function(results) {
      callback(null, results);
    };

    var failed = function(err) {
      callback(err);
    };

    /*
     * The individual search methods will return IDs of calibration
     * objects in the database. These will be tracked in an array and intersected
     * as subsequent filters are added.
     * Initially this is null, to indicate uninitialized, rather than an empty array,
     * which would never intersect with anything.
     */
    var filteredCalibrationIds = null;

    /*
     Merge (destructively) onto the filteredCalibrationIds array
     first time this is called (when filteredCalibrationIds is null) it will
     replace the array. On subsequent calls, it will intersect it
     */
    var mergeCalibrationIds = function(calibrationIds) {
      // If first call, replace the array
      // This is different than an empty array!
      if(filteredCalibrationIds === null) {
        filteredCalibrationIds = calibrationIds;
      } else {
        filteredCalibrationIds = intersection_destructive(filteredCalibrationIds, calibrationIds);
      }
    };

     // convenience/refactored. Handles callback logic around merging
    var handleCalibrationIds = function(handleErr, calibrationIds, callback) {
      if(handleErr) {
        failed(handleErr);
      } else {
        mergeCalibrationIds(calibrationIds);
        callback();
      }
    };

    /*
     * Should be the last step in the chain. After all filters are applied, we'll
     * have an array of calibration IDs. turn these into full objects and call success.
     */
    var populateCalibrations = function() {
      thisCalibration.populateCalibrations(filteredCalibrationIds, function(err, calibrations) {
        if(err) {
          failed(err);
        } else {
          success(calibrations);
        }
      });
    };

    /*
     * Individual filters
     * 1. Age (min/max or geological time)
     * 2. Tree (clade or tipTaxa)
     * These will actually happen in reverse order, because callbacks have to be
     * written in reverse order
     */

    // 1. Age Search
    var ageSearchDone = function() {
      // age search is the last one, populate the calibrations and finish.
      populateCalibrations();
    };

    var handleAgeResults = function(ageErr, calibrationIds) {
      handleCalibrationIds(ageErr, calibrationIds, ageSearchDone);
    };

    // parse age search parameters. If no parameters (default case) we're done
    var doAgeSearch = function() {
      ageSearchDone();
    };

    // 'geologicalTime' and 'minAge/maxAge' are mutually exclusive
    if(params.hasOwnProperty('geologicalTime')) {
      doAgeSearch = function() {
        thisCalibration.findByGeologicalTime(params.geologicalTime, handleAgeResults)
      }
    } else if(params.hasOwnProperty('minAge') || params.hasOwnProperty('maxAge')) {
      doAgeSearch = function() {
        thisCalibration.findByMinMax(params.minAge, params.maxAge, handleAgeResults)
      }
    }

    // 2. Tree search
    var treeSearchDone = function() {
      // after tree search, do age search
      doAgeSearch();
    };

    var handleTreeResults = function(treeErr, calibrationIds) {
      handleCalibrationIds(treeErr, calibrationIds, treeSearchDone);
    };

    // parse tree search parameters. If no parameters (default case), we're done
    var doTreeSearch = function() {
      treeSearchDone(null);
    };

    // 'clade' and 'taxonA/taxonB' are mutually exclusive
    if(params.hasOwnProperty('clade')) {
      doTreeSearch = function() {
        thisCalibration.findByClade(params.clade, handleTreeResults);
      };
    } else if(params.hasOwnProperty('tipTaxa')) {
      doTreeSearch = function() {
        thisCalibration.findByTipTaxa(tipTaxa, handleTreeResults);
      };
    }

    // All callbacks in place, start!
    doTreeSearch();
  };

  // Call the database to populate all the calibrations in the array of ids
  this.populateCalibrations = function(calibrationIds, callback) {
    // MySQL results are always provided in callbacks. async.map executes a transform
    // function on each item in the array, and calls callback when done.
    async.map(calibrationIds, getCalibration, callback);
  };

  /* Age Search implementation */

  // Gets the calibration IDs in the range and passes along to the callback
  this.findByMinMax = function(minAge, maxAge, callback) {
    var success = function(result) {
      callback(null, result);
    };

    var failed = function(err) {
      callback(err);
    };

    // Must provide either minAge, maxAge, or both.
    var baseQueryString = 'SELECT CalibrationID FROM ' + TABLE_NAME + ' WHERE ';
    var clause = [];
    var params = [];
    if(minAge != null) {
      clause.push('(MinAge >= ? OR MinAge = 0) AND (MaxAge >= ? OR maxAge = 0)');
      params.push(minAge);
      params.push(minAge);
    }
    if(maxAge != null) {
      clause.push('(MinAge <= ? OR MinAge = 0) AND (MaxAge <= ? OR maxAge = 0)');
      params.push(maxAge);
      params.push(maxAge);
    }

    if(clause.length === 0) {
      failed({error:'Cannot find by age unless minAge or maxAge is specified'});
      return;
    }

    // Now join the clauses
    var joinedClause = clause.join(' AND ');
    var queryString = baseQueryString + joinedClause;

    // Get the calibrationIDs and call the callback with them
    query(queryString, params, function(err, results) {
      if(err) {
        failed(err);
        return;
      }
      var calibrationIDs = results.map(function(result) { return result['CalibrationID']; });
      success(calibrationIDs);
    });
  };

  this.findByGeologicalTime = function(geologicalTime, callback) {
    callback({error : 'find by geological time not yet implemented'});
  };

  /* Tree search implementation */
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

  // Callback is (err, calibrationIds)
  this.findByClade = function(taxonName, callback) {
    // Starts with a clade/taxon name
    fetchNCBITaxonId(taxonName, function(err, taxon) {
      // have a taxon id, now get the multi tree from the taxon
      if (err) {
        callback(err);
        return;
      }
      if(!taxon) {
        callback({error:'No node found for ' + taxonName});
        return;
      }
      fetchMultiTreeNodeId(taxon.source, taxon.taxonid, function(err, multiTreeNodeId) {
        if (err) {
          callback(err);
          return;
        }
        // have a multi tree, now see what calibrations are in it.
        var calibrationResults = [];
        fetchCalibrationIdsInCladeMultiTree(multiTreeNodeId, function(err, calibrationIds) {
          callback(err, calibrationIds);
        });
      });
    });
  };

  // Callback is (err, calibrationIds)
  this.findByTipTaxa = function(tipTaxa, callback) {
    callback({error:'find by tip taxa not yet implemented'});
  }
}

module.exports = new Calibrations();