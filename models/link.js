var _ = require('underscore')
  , util = require('util')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')
  , LinkCache = require('./linkcache')

LinkSchema.statics.scrape = function(url,cb){
  LinkCache.scrape(url,cb)
}

LinkSchema.statics.getUserLinks = function(user, tags, includePrivate, cb){
  
  if(!util.isArray(tags)) tags = [tags]
  else if(!tags) tags = []
  
  var query = Link.find() //.where('owner').equals(user._id)
  if(tags.length){
    query.and(
      _.map(tags, function(tag){
        return { tags : tag }
      })
    )
  }
  query.where('owner',user._id)
  if(!includePrivate) query.where('public',true)
  //query.limit(100)
  query.sort('field -created')
  if(cb) query.exec(cb)
  else return query
}

LinkSchema.methods.save = function(cb){
  console.log('calling our custom save')
  if(cb){
    var old_cb = cb
    cb = function(err, doc){
      if(err && err.code === 11000) return cb(new Error("You already have that link"))
      else return old_cb(err,doc)
    }
  }
  return mongoose.Model.prototype.save.call(this,cb)
}

var Link = module.exports = mongoose.model('Link', LinkSchema)