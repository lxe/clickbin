
var _ = require('underscore')

/**
  * plus.google.com specific scraper
  */

module.exports = function(url,parts,$){
  // google plus page
  if(parts[0]==='plus'){
    var page = {}
    // try to get the best title from the page
    var fullname = $('span[guidedhelpid="profile_name"] span')
    if(fullname.length) page.title = fullname.first().text()
  
    page.desc = 'Google+'
  
    page.icon = $('div[guidedhelpid="profile_photo"] img')
    if(page.icon.length){
      page.icon = page.icon.first().attr('src') // could still be empty...
      if( page.icon.substr(0,2) === '//' ) page.icon = 'http://' + page.icon.substr(2)
    }else page.icon = null
  
    return page
  }else return null
}