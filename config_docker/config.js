// Default config values, can be overridden by ENV vars
var config = {};

config.multipleStatements = true;
config.host = process.env.DB_PORT_3306_TCP_ADDR;
config.port = process.env.DB_PORT_3306_TCP_PORT
config.database = process.env.FCDB_MYSQL_DB || 'FossilCalibration';
config.user =  process.env.FCDB_MYSQL_USER || 'api';
config.password =  process.env.FCDB_MYSQL_PASSWORD || '';

module.exports = config;
