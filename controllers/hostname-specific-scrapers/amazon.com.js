
var _ = require('underscore')

/**
  * instagram specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('img#main-image')
  if(!page.icon.length) page.icon = $('.main-image-inner-wrapper img')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}