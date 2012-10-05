var config = {
  salt : 'example-salt'
  , server: {
    port: 3020
  }
}

var argv = require('optimist')
  .default('port',config.port)
  .argv

config.server.port = argv.port

module.exports = config