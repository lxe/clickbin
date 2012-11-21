
var config = require('../config')
  , path = require('path')
  , node_url = require('url')
  , _ = require('underscore')
  , sanitize = require('validator').sanitize
  , uri_regexp = config.commandRegexp

module.exports = function(url){
  var matches = uri_regexp.exec(url)
  if(!matches || matches.length === 0) 
    return null
  // console.log('--------matches--------')
  // console.log(matches)
  
  // use http if no protocol was specified
  var tags = []
    , protocol = matches[matches.length - 2] || 'http://'
    , uri  = matches[matches.length - 1]
    , tag_part = matches[1]
    , alt_tag_part
  
  // console.log('matches')
  // console.log(matches)
  
  if(tag_part){
    if( tag_part.length > 1 && tag_part[tag_part.length-1]==='/') 
      tag_part = tag_part.slice(0,-1)
    alt_tag_part = path.normalize(tag_part)
    alt_tag_part = _.map(alt_tag_part.split('/'), function(tag){
      return decodeURIComponent(sanitize(tag).trim())
    })
    // console.log('alt_tag_parts: ')
    // console.log(alt_tag_part)
    alt_tag_part = _.uniq(alt_tag_part)
    alt_tag_part.sort()
    // console.log(alt_tag_part)
    
    // filter out empty tag
    alt_tag_part = _.filter(alt_tag_part, function(tag) {
      return tag !== '' 
    })
    
    // make sure each tag is valid
    var invalidTag = _.find(alt_tag_part, function(tag) {
      return !tag.match(config.tagNameRegexp)
    })
    if(invalidTag) throw new Error("Invalid tag name for tag: " 
      + invalidTag)
    
    // limit the number of tags
    _.each(alt_tag_part, function(tag){ tags.push(tag) })
    if(tags.length > config.maxNumTags){
      throw new Error("now... don't get crazy. 10 is the max number of "
        + "tags inside for a link. any more then that, and our head starts to "
        + "hurt!")
    }
    
    // url encode each tag
    alt_tag_part = _.map(alt_tag_part, function(tag){
      return encodeURIComponent(tag)
    })
    alt_tag_part = '/' + alt_tag_part.join('/')
    if(uri){
      if(tag_part !== '/')
        url = alt_tag_part + '/' + protocol + uri
      else
        url = '/' + protocol + uri
    }
    
    // if cleaned up version of the command isn't the original provided, 
    // redirect to the proper version
    
    // console.log('alt_tag_part: ' + alt_tag_part)
    // console.log('tag_part: ' + tag_part)
    
    if( tag_part !== '/' && alt_tag_part !== tag_part){
      var redirect = alt_tag_part
      if(uri) redirect += '/' + protocol + uri
      // console.log('redirect: ' + redirect)
      return { redirect : redirect }
    }
  }
  
  // check to make sure the protocol is valid
  if (!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
    throw new Error('Invalid internet address.')
  
  var command = {
    tags : tags
    , path : url
  }
  if(uri){
    command.link = {
      protocol : protocol
      , uri : uri
      , href : protocol + uri
    }
  }
  return command
}