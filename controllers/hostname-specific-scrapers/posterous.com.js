
var _ = require('underscore')

/**
  * instagram specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('link[rel=image_src]')
  if(page.icon.length)
    page.icon = page.icon.first().attr('href') // could still be empty...
  else{
    page.icon = $('.user-info img.avtr')
    if(page.icon.length) page.icon = page.icon.first().attr('src')
    else page.icon = null
  }
  return page
}