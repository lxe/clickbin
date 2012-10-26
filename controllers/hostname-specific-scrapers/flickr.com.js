
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  // try to get the best title from the page
  _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
    tag = $(tag)
    if(tag.length) page.title = tag.first().text()
    return page.title // stop if we found a title
  })
  
  page.icon = $('#photo img')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}