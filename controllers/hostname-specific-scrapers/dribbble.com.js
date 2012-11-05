var _ = require('underscore')

/**
  * dribble specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  
  page.icon = $('.single-img img')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  console.log('calling dribble: ' + page.icon)
  return page
}