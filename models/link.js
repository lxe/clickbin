var _ = require('underscore')
  , util = require('util')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')
  , LinkCache = require('./linkcache')

LinkSchema.statics.scrape = function(url,cb){
  LinkCache.scrape(url,cb)
}

LinkSchema.statics.getUserLinks = function(user, tags, cb){
  if(!cb){
    cb = tags
    tags = []
  }else if(!util.isArray(tags)) tags = [tags]
  else if(!tags) tags = []
  
  var query = Link.find() //.where('owner').equals(user._id)
  if(tags.length){
    query.and(
      _.map(tags, function(tag){
        return { tags : tag }
      })
    )
  }
  query.limit(20)
  query.sort('field -created')
  if(cb) query.exec(cb)
  else return query
}

var Link = module.exports = mongoose.model('Link', LinkSchema)