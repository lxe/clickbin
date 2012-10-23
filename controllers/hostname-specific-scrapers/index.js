
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
  url = node_url.parse(url,true)
  
  // default scrapers
  var hostname = url.hostname
  parts = hostname.split('.')
  
  console.log('hostname parts: ')
  console.log(parts)
  
  if(parts.length > 1) hostname = parts.slice(-2).join('.')
  else hostname = parts[0]
  url.hostname = hostname
  var scraper = scrapers[url.hostname]
  if(scraper) page = scraper(url,parts,$)
  if(page) return page
  else return defaultScraper(url,parts,$)
}