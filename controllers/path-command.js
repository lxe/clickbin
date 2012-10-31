var node_path = require('path')
  , uri_regexp = /^((\/(?:[a-zA-Z0-9\-^\/]+(?:\/|$)))|\/)(\w+?:\/\/)?([^\/]+\..+)?/

module.exports = function(url,subdomains){
  var command = {}

  // a users bin 
  if(subdomains && subdomains.length) 
    command.username = subdomains.pop()
  
  // parse the url command
  var matches = uri_regexp.exec(url)
  if (!matches || matches.length === 0) return new Error('Invalid URL')
  
  // use http if no protocol was specified
  var protocol = matches[matches.length - 2] || 'http://'
    , uri  = matches[matches.length - 1]
    , path = matches[1]
  
  if(path) path = node_path.normalize(path)
  
  // prevent bins from being added to the root path '/'
  if (path === '/') {
    path = undefined
    if (uri === undefined) 
      // no path and no uri? we should never get here.
      // the earlier '/' route should take precidence but just incase...
      return new Error("Cannot create bin. bins can only contain letters, numbers, and dashes.")
  
  }else if (path[path.length - 1] === '/') 
    // remove the trailling '/'
    path = path.substring(0, path.length - 1)
  
  // check to make sure the protocol is valid
  if (!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
    return new Error('Invalid internet address.')
  
  if(uri) command.uri = protocol + uri
  else command.uri = undefined
  command.path = path
  
  return command
}