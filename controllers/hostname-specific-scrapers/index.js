
var node_url        = require('url')
  , fs              = require('fs')
  , _               = require('underscore')
  , scrapers        = {}
  , defaultScraper  = require('./default')
  , cheerio         = require("cheerio")


var files = fs.readdirSync(__dirname)
_.each(files,function(file){
  var hostname = file.replace('.js','')
  scrapers[hostname] = require('./' + file)
})


module.exports = function(url,body){
  var $ = cheerio.load(body.toString())
  var page = null
  // TODO: check for errors? try catch, maybe? or is that never gonna happen?
  // the `true` bellow forces the query parameters to be parsed
  
  // default scrapers
  var hostname = url.hostname
  parts = hostname.split('.')
  
  
  if(parts.length > 1) hostname = parts.slice(-2).join('.')
  else hostname = parts[0]
  url.hostname = hostname
  var scraper = scrapers[url.hostname]
  // we pass along the parts incase subdomain specific actions are required. 
  // (ie., do something special for `plus.google.com` but not `google.com` )
  if(scraper) page = scraper(url,parts,$)
  else{
    // check fo rhte posterous style `generator` meta tag
    var generator = $('meta[name=generator]').attr('content')
    if(generator && generator.toLowerCase() === 'posterous'){
      page = scrapers['posterous.com'](url,parts,$)
    }
  }
  return defaultScraper(page,url,parts,$)
}