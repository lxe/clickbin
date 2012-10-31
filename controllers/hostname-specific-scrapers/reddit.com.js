
var _ = require('underscore')

/**
  * instagram specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  if($('body.comments-page').length){
    // we're on a thread
    page.icon = $('.thumbnail img')
    if(page.icon.length){
      page.icon = page.icon.first().attr('src') // could still be empty...
    }else page.icon = null
  }
  
  return page
}