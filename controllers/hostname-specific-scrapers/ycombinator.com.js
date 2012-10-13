
var _ = require('underscore')

/**
  * ycombinator specific scraper
  */

module.exports = function(url,$){
  // this scraper only works with video pages
  var page = {}
  // try to get the best title from the page
  _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
    tag = $(tag)
    if(tag.length) page.title = tag.first().text()
    return page.title // stop if we found a title
  })
  page.icon = '/_/images/thumbs/hostnames/ycombinator.com.png'
  // just use the url we pass in directly. dont go and scrape it
  page.__dont_scrape_icon = true
  return page
}