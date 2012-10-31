
var _ = require('underscore')

/**
  * youtube specific scraper
  */

module.exports = function(url,parts,$){
  // this scraper only works with video pages
  if( url.pathname.indexOf('/watch') === -1 ) return null
  var page = {}
  // the video id
  if(url.query.v) 
    page.icon = 'http://img.youtube.com/vi/' + url.query.v + '/default.jpg' 
  return page
}