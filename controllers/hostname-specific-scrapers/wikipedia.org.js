
var _ = require('underscore')

/**
  * twitter specific scraper
  */

module.exports = function(url,parts,$){
  var page = {}
  // try to get the best title from the page
  _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
    tag = $(tag)
    if(tag.length) page.title = tag.first().text()
    return page.title // stop if we found a title
  })
  
  page.icon = $('#mw-content-text a.image img')
  if(page.icon.length && page.icon.attr('width') >= 200){
    page.icon = page.icon.first().attr('src') // could still be empty...
    // wikipedia's got some weird image links... missing protocol
    if(page.icon && page.icon.length > 2 && page.icon.substr(0,2) === '//' )
      page.icon = 'http:' + page.icon
  }else{
    page.icon = '/_/images/thumbs/hostnames/wikipedia.org.png'
    // just use the url we pass in directly. dont go and scrape it
    page.__dont_scrape_icon = true
  }
  return page
}