/**
 * Link/bin routing
 */
var _        = require('underscore')
  , crypto   = require('crypto')
  , user = require('./user')
  , anonymous = require('./anonymous')
  , pathCommandParser = require('../middleware/path-command-parser')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
  
  app.get(/^\/[^_]{1}.*/, pathCommandParser, function (req, res, next) {
    var command = req.parsedPathCommand
    
    if(command.username || req.loggedIn ){
      return user(req, res, next, command)
    }
    
    // else, the user is anonymous...
    if( req.url === '/' ) return next()
    return anonymous(req, res, next, command)
      
  }) // end GET /path/[link]
  
}