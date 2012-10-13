
var node_url = require('url')
  , fs = require('fs')
  , _ = require('underscore')
  , scrapers = {}
  , defaultScraper = require('./default')

var files = fs.readdirSync(__dirname)
_.each(files,function(file){
  console.log('filename: '+file)
  var hostname = file.replace('.js','')
  scrapers[hostname] = require('./' + file)
})


module.exports = function(url,$){
  var page = {}
  // TODO: check for errors? try catch, maybe? or is that never gonna happen?
  // the `true` bellow forces the query parameters to be parsed
  url = node_url.parse(url,true)
  
  // default scrapers
  var hostname = url.hostname
  
  hostname = hostname.split('.')
  
  if(hostname.length > 1) hostname = hostname.slice(-2).join('.')
  else hostname = hostname[0]
  url.hostname = hostname
  console.log('url.hostname: '+url.hostname)
  var scraper = scrapers[url.hostname]
  if(scraper) return scraper(url,$)
  else return defaultScraper(url,$)
}