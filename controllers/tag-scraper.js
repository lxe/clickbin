var request = require('request')
  , _ = require('underscore')
  , config = require('../config')
module.exports = function(page, cb){
  if(page.tags) return cb(page.tags)
  if(!page.__package_json) return cb([])
  request.get(page.__package_json, function(err, res, body){
    if(err || !body) return cb([])
    try{
      body = JSON.parse(body)
    }catch(e){
      console.error('error parsing body from github package.json')
      if(e) return cb([])
    }
    if(!body.keywords) return cb([])
    var tags = _.filter(body.keywords, function(tag){
      return tag.match(config.tagNameRegexp)
    })
    return cb(tags)
  })
}