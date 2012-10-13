/**
  * this is the default scraper to use, when on other known host types could be
  * found
  */

var _ = require('underscore')
  , node_url = require('url')

module.exports = function(url,$){
  var page = {}
  // try to get the best title from the page
  page.title = null
  _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
    tag = $(tag)
    if(tag) page.title = tag.text()
    return page.title // stop if we found a title
  })
  
  page.icon = $('link[rel="icon"]')
  if(page.icon){
    page.icon = page.icon.attr('href') // could still be empty...
    var icon_url = node_url.parse(page.icon)
    if(!icon_url.hostname) page.icon = url.protocol + '//' + url.hostname + icon_url.pathname
  }else page.icon = null
  
  return page
}