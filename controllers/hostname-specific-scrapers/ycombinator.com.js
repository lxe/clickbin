
var _ = require('underscore')

/**
  * ycombinator specific scraper
  */

module.exports = function(url,parts,$){
  // this scraper only works with video pages
  var page = {}
  page.icon = '/_/images/thumbs/hostnames/ycombinator.com.png'
  // just use the url we pass in directly. dont go and scrape it
  page.__dont_scrape_icon = true
  return page
}