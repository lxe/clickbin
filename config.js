var config = {
  salt : 'example-salt'
  , server: {
    port: 3020
  }
  , domain : 'clickb.in' // used in the cookie
  , maxRequestSize : 2097152 /*2mb*/ // the max size of a piece of requested resource
  , userAgent : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) '
    + 'AppleWebKit/537.4 (KHTML, like Gecko) Chrome/22.0.1229.94 Safari/537.4'
  , logging : true
}

// "In an extreme view, the world can be seen as only connections, nothing 
// else. We think of a dictionary as the repository of meaning, but it defines 
// words only in terms of other words. I liked the idea that a piece of 
// information is really defined only by what it's related to, and how it's 
// related. There really is little else to meaning. The structure is 
// everything. There are billions of neurons in our brains, but what are 
// neurons? Just cells. The brain has no knowledge until connections are made 
// between neurons. All that we know, all that we are, comes from the way our 
// neurons are connected."
//                             - Tim Berners-Lee, inventor of the world wide web

var argv = require('optimist')
  .default('port',config.port)
  .default('domain',config.domain)
  .default('logging',config.logging)
  .argv

config.server.port = argv.port
config.domain = argv.domain
config.logging = argv.logging

module.exports = config