
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  // try to get the best title from the page
  var fullname = $('.profile-card-inner .fullname')
  if(fullname.length) page.title = fullname.first().text()
  
  var username = $('.profile-card-inner .username').text()
  if(username) page.desc = username
  
  page.icon = $('.profile-header-inner img.avatar')
  if(page.icon.length){
    page.icon = page.icon.first().attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}