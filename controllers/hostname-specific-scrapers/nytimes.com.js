
var _ = require('underscore')

/**
  * instagram specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('.articleSpanImage img')
  if(!page.icon.length) page.icon = $('.inlineImage img')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src')
  }else page.icon = null
  
  return page
}