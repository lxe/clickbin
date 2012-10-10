var config = {
  salt : 'example-salt'
  , server: {
    port: 3020
  }
  , domain : 'clickb.in' // used in the cookie
  , maxImageSize : 2097152 /*2mb*/
}

var argv = require('optimist')
  .default('port',config.port)
  .default('domain',config.domain)
  .argv

config.server.port = argv.port
config.domain = argv.domain

module.exports = config