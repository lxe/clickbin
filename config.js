var config = {
  salt : 'example-salt'
  , server: {
    port: 3020
  }
  , domain : 'clickb.in' // used in the cookie
  , maxRequestSize : 2097152 /*2mb*/ // the max size of a piece of requested resource
  , userAgent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) '
    + 'AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
}

var argv = require('optimist')
  .default('port',config.port)
  .default('domain',config.domain)
  .argv

config.server.port = argv.port
config.domain = argv.domain

module.exports = config