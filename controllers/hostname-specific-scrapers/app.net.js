
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  // try to get the best title from the page
  var fullname = $('h1 small')
  if(fullname.length) page.title = fullname.first().text()
  else{
    _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
      tag = $(tag)
      if(tag.length) page.title = tag.first().text()
      return page.title // stop if we found a title
    })
  }
  
  var username = '@' + $('.username').first().text()
  if(username) page.desc = username
  
  page.icon = $('.avatar.large')
  if(page.icon.length){
    page.icon = page.icon.first().attr('style')
    if(page.icon) page.icon = page.icon.match(/url\((.*)\)/)[1]
  }else page.icon = null
  
  return page
}