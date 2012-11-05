var node_path = require('path')
  , _ = require('underscore')
  , config = require('../config')
  /**
    * this breaks the requested url into its commands parts. namely: 
    * the bin `path`, the `uri` and the `protocol`
    * there's some overlap here with config.binNameRegexp. notice how the
    * part in this regexp also contains an extra `/` because we're matching
    * the entire bin `path` not just a single bin `name`
    */
  , uri_regexp = /^((\/(?:[a-zA-Z0-9]{1,}[a-z \%A-Z0-9\-\_\/]*(?:\/|$)))|\/)(\w+?:\/\/)?([^\/]+\..+)?/

function trim(str){
  if(!str) return str
  return str.replace(/^\s\s*/, '').replace(/\s\s*$/, '')
}

/**
  * this middleware is responsible for parsing the `clickbin` style command 
  * from the url
  */
module.exports = function(req,res,next){
  
  var command = {}
    , url = req.url
    , subdomains = req.subdomains
    , newPath = null
    , bins = []

  // a users bin 
  if(subdomains && subdomains.length) 
    command.username = subdomains.pop()
  
  // parse the url command
  var matches = uri_regexp.exec(url)
  if (!matches || matches.length === 0) return next(new Error('Invalid URL'))
  
  // use http if no protocol was specified
  var protocol = matches[matches.length - 2] || 'http://'
    , uri  = matches[matches.length - 1]
  
  
  // console.log('matches[1]: ' + matches[1])
  
  var path = decodeURIComponent(matches[1])
  
  // console.log('path: ' + path)
  
  if(path){
    newPath = node_path.normalize(path)
    newPath = _.map(newPath.split('/'),function(name){
      return trim(name)
    })
    // filter out empty bins
    newPath = _.filter(newPath,function(name){ return name !== '' })
    // make sure each bin name is valid
    var invalidBinName = _.find(newPath,function(name){
      // console.log('name: ' + name)
      return !name.match(config.binNameRegexp)
    })
    if(invalidBinName) return next(new Error("Invalid bin name for bin: " 
      + invalidBinName))
    
    // save the list to `bins`
    _.each(newPath,function(name){ bins.push(name) })
    if(bins.length > config.maxBinPathDepth) return next(new Error("now... don't "
      + "get crazy. 10 is the max number of bins inside of bins. any more then "
      + "that, and our head starts to hurt"))
    
    // url encode each bin
    newPath = _.map(newPath,function(name){
      return encodeURIComponent(name) 
    })
    
    newPath = '/' + newPath.join('/')
    // console.log('newPath: ' + newPath)
    if(!!uri) newPath += ((newPath!=='/') ? '/' : '') + protocol + uri
    // console.log('uri: ' + uri )
    // console.log('!!uri: ' + (!!uri) )
    // console.log('newPath: ' + newPath)
    // console.log('req.url: ' + req.url)
    if( newPath !== req.url) {
      // we had to make corrections to the url so redirect to the proper 
      // version
      return res.redirect(newPath)
    }
    newPath = decodeURIComponent(newPath)
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
  
  command.bins = bins
  
  req.parsedPathCommand = command
  console.log('path command: %j', command)
  return next()
}