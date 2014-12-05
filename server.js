// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express     = require('express'); 		// call express
var app         = express(); 				// define our app using express
var bodyParser  = require('body-parser');
var csv         = require('fast-csv');

// Our models
var Calibration = require('./app/models/calibration');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8081; 		// set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router(); 				// get an instance of the express Router

var sendResponsePayload = function(payload, res, format) {
  if(format === 'csv') {
    var output = csv.createWriteStream({headers:true});
    res.set({'Content-Type': 'text/csv'});
    // Include content-type header
    output.pipe(res);
    if(Array.isArray(payload)) {
      payload.forEach(function(element) { output.write(element); });
    } else {
      output.write(payload);
    }
    output.end();
  } else {
    res.json(payload);
  }
};

// Routes for our API will happen here
router.route('/calibrations/:calibration_id')
  .get(function(req, res) {
    Calibration.findById(req.params.calibration_id, function(err, calibration) {
      if (err) {
        res.send(err);
      } else {
        sendResponsePayload(calibration, res, req.query.hasOwnProperty('format') ? req.query.format : null);
      }
    });
  });

var getFormat = function(req) {
    if(req.query.hasOwnProperty('format')) {
      return req.query.format;
    } else {
      return null;
    }
};


router.route('/calibrations')
  .get(function(req, res) {
    Calibration.query(req.query, function(err, calibrations) {
      if (err) {
        res.send(err);
      } else {
        sendResponsePayload(calibrations, res, getFormat(req));
      }
    });
  });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api/v1', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Server listening on port ' + port);