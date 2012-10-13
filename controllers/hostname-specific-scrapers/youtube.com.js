
var _ = require('underscore')

/**
  * youtube specific scraper
  */

module.exports = function(url,$){
  // this scraper only works with video pages
  if( url.pathname.indexOf('/watch') === -1 ) return null
  var page = {}
  // try to get the best title from the page
  _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
    tag = $(tag)
    if(tag.length) page.title = tag.first().text()
    return page.title // stop if we found a title
  })
  // the video id
  if(url.query.v)
    page.icon = 'http://img.youtube.com/vi/' + url.query.v + '/default.jpg' 
  return page
}