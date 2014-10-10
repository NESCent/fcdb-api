// server.js

// BASE SETUP
// =============================================================================

// call the packages we need
var express     = require('express'); 		// call express
var app         = express(); 				// define our app using express
var bodyParser  = require('body-parser');

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

// Routes for our API will happen here
router.route('/calibrations/:calibration_id')
  .get(function(req, res) {
    Calibration.findById(req.params.calibration_id, function(err, calibration) {
      if (err) {
        res.send(err);
      } else {
        res.json(calibration);
      }
    });
  });

router.route('/calibrations')
  .get(function(req, res) {
    if(req.query.hasOwnProperty('filter')) {
      Calibration.findByFilter(req.query, function(err, calibrations) {
        if (err) {
          res.send(err);
        } else {
          res.json(calibrations);
        }
      });
    } else if(req.query.hasOwnProperty('clade')) {
      Calibration.findByClade(req.query, function(err, calibrations) {
        if (err) {
          res.send(err);
        } else {
          res.json(calibrations);
        }
      });
    }
  });

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Server listening on port ' + port);