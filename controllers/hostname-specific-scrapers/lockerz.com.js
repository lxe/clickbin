
var _ = require('underscore')

/**
  * lockerz specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('img#photo')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}