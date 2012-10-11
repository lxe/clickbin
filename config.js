var config = {
  salt : 'example-salt'
  , server: {
    port: 3020
  }
  , domain : 'clickb.in' // used in the cookie
  , maxRequestSize : 2097152 /*2mb*/ // the max size of a piece of requested resource
}

var argv = require('optimist')
  .default('port',config.port)
  .default('domain',config.domain)
  .argv

config.server.port = argv.port
config.domain = argv.domain

module.exports = config