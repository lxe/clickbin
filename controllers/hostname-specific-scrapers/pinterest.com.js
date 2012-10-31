
var _ = require('underscore')

/**
  * lockerz specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  console.log('pinterest specific scraper')
  page.icon = $('img#pinCloseupImage')
  console.log('page icon: '+page.icon)
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}