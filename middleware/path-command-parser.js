var node_path = require('path')
  , uri_regexp = /^((\/(?:[a-z\%A-Z0-9\-^\/]+(?:\/|$)))|\/)(\w+?:\/\/)?([^\/]+\..+)?/

/**
  * this middleware is responsible for parsing the `clickbin` style command 
  * from the url
  */
module.exports = function(req,res,next){
  
  var command = {}
    , url = req.url
    , subdomains = req.subdomains

  // a users bin 
  if(subdomains && subdomains.length) 
    command.username = subdomains.pop()
  
  // parse the url command
  var matches = uri_regexp.exec(url)
  if (!matches || matches.length === 0) return next(new Error('Invalid URL'))
  
  // use http if no protocol was specified
  var protocol = matches[matches.length - 2] || 'http://'
    , uri  = matches[matches.length - 1]
    , path = decodeURIComponent(matches[1])
  
  if(path){
    var newPath = node_path.normalize(path)
    if(newPath !== path){
      // we should redirect to the proper path
      if(!uri) return res.redirect(newPath)
      else return res.redirect(newPath + '/' + protocol + uri )
    }
  }
  
  // prevent bins from being added to the root path '/'
  if (path === '/') {
    path = undefined
    if (uri === undefined) 
      // no path and no uri? we should never get here.
      // the earlier '/' route should take precidence but just incase...
      return next(new Error("Cannot create bin. bins can only contain letters, "
        + "numbers, and dashes."))
  
  }else if (path[path.length - 1] === '/') 
    // remove the trailling '/'
    path = path.substring(0, path.length - 1)
  
  // check to make sure the protocol is valid
  if (!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
    return next(new Error('Invalid internet address.'))
  
  if(uri) command.uri = protocol + uri
  else command.uri = undefined
  command.path = path
  
  req.parsedPathCommand = command
  console.log('path command: ')
  console.log(command)
  return next()
}