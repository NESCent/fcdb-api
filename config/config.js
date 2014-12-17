// Default config values, can be overridden by ENV vars
var config = {};

config.multipleStatements = true;
config.host = process.env.FCDB_MYSQL_HOST || '127.0.0.1';
config.port = process.env.FCDB_MYSQL_PORT || 3306;
config.database = process.env.FCDB_MYSQL_DB || 'FossilCalibration';
config.user =  process.env.FCDB_MYSQL_USER || 'api';
config.password =  process.env.FCDB_MYSQL_PASSWORD || '';

module.exports = config;
