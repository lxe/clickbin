var _ = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , scraper = require('../controllers/scraper')

var LinkCacheSchema = new Schema({
  title : {
    type : String
    , required : false
  }
  , desc : {
    type : String
    , required : false
  }
  // the path to the image (local or absolute)
  , icon : {
    type : String
    , required : false
    , default : null
  }
  , url : {
    type : String
    , required : true
    , index : true
    , unique : true
  }
  , mime : {
    type : String
    , required : false
  }
  , created : {
    type : Date
    , default : Date.now
    , index : true
  }
},{strict: true})

LinkCacheSchema.statics.scrape = function(url,cb){
  // this is sort of like a cache, for the scraper
  LinkCache.findOne( { url : url }, function(err, link) {
    if(err) return cb(err)
    // first, try to see if the link already exists.
    // if it does, just return it
    else if(link) return cb(null,link)
    // if not, go and _actually_ scrape the page
    else scraper.get(url, function(err, link){
      if(err) link = { url : url }
      link = new LinkCache(link)
      link.save(function(err){
        if(err) return cb(err)
        else return cb(null,link)
      })
    })
  })
}

var LinkCache = module.exports = mongoose.model('LinkCache', LinkCacheSchema)