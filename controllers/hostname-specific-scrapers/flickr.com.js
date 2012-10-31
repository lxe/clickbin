
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('#photo img')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}