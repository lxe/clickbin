var pathCommand = require('../controllers/path-command-parser')
  , _ = require('underscore')

/**
  * lets define the possible new command types
  * ----------#1-----------
  * /tag1/tag2/         # query for tag1 AND for tag2
  * ----------#2----------
  * /:tag1/:tag2/       # query for tag1 AND for tag2
  * /:tag1&tag2/        # (same as above)
  * /tag1|tag2/         # query for tag1 or tag2
  */

/**
  * this middleware is responsible for parsing the `clickbin` style command 
  * from the url
  */
module.exports = function(req, res, next){
  
  var command = {}
    , url = req.url
    , subdomains = req.subdomains

  // a users path 
  if(subdomains && subdomains.length) 
    command.username = subdomains.pop()
  
  try{
    _.extend(command,pathCommand(url))
  }catch(e){ 
    return next(e) 
  }
  
  if(command.redirect) 
    return res.redirect(command.redirect)
  
  req.parsedPathCommand = command
  return next()
}