
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,$){
  var page = {}
  // try to get the best title from the page
  var fullname = $('.profile-card-inner .fullname').text()
  if(fullname) page.title = fullname
  else{
    _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
      tag = $(tag)
      if(tag) page.title = tag.text()
      return page.title // stop if we found a title
    })
  }
  
  var username = $('.profile-card-inner .username').text()
  if(username) page.desc = username
  
  page.icon = $('.profile-header-inner img.avatar')
  console.log('page.icon: '+page.icon)
  if(page.icon){
    page.icon = page.icon.attr('src') // could still be empty...
  }else page.icon = null
  
  return page
}