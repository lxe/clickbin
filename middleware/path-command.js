var pathCommand = require('../controllers/path-command')

/**
  * this middleware is responsible for parsing the `clickbin` style command 
  * from the url
  */
module.exports = function(req,res,next){
  var parsedCommand = pathCommand(req.url,req.subdomains)
  if(parsedCommand instanceof Error)
    return next(parsedCommand)
  req.parsedPathCommand = parsedCommand
  return next()
}