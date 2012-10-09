var _ = require('underscore')
  , mongoose = require('mongoose')
  , scraper = require('../controllers/scraper')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')

LinkSchema.statics.scrape = function(url,cb){
  // this is sort of like a cache, for the scraper
  Link.findOne( { url : url }, function(err, link) {
    if(err) return cb(err)
    else if(link) return cb(null,link)
    // go, and _actually_ scrape the page
    else scraper.get(url,function(err,link){
      if(err) link = { url : url }
      link = new Link(link)
      link.save(function(err){
        if(err) return cb(err)
        else return cb(null,link)
      })
    })
  })
}

var Link = module.exports = mongoose.model('Link', LinkSchema)