/**
  * this is the default scraper to use, when on other known host types could be
  * found
  */

var _ = require('underscore')
  , node_url = require('url')

module.exports = function(page,url,parts,$){
  if(!page) page = {}
  if(!page.title){
    // try to get the best title from the page
    page.title = null
    _.any(['title','h1','h2','h3','h4','h5','h6'],function(tag){
      tag = $(tag)
      if(tag.length) page.title = tag.first().text()
      return page.title // stop if we found a title
    })
  }
  // try to get the thumbnail, if there isn't one alrady
  if(!page.icon){
    page.icon = $('link[rel="apple-touch-icon-precomposed"]')
    if(page.icon.length && page.icon.length > 1){
      var max_size = -1
      var largest_icon = null
      _.each(page.icon,function(icon){
        var $icon = $(icon)
        var size = $icon.attr('sizes')
        console.log('size: '+size)
        if(size){
          size = size.split('x')[0]
          if(size) size = Number(size)
          else size = 0
        }else size = 0
        if(size > max_size){
          max_size = size
          largest_icon = $icon
          console.log('largest icon: ' + largest_icon.first().attr('href'))
        }
      })
      page.icon = largest_icon
    }
    if(!page.icon.length) page.icon = $('link[rel="apple-touch-icon"]')
    if(!page.icon.length) page.icon = $('link[rel="icon"]')
    if(page.icon.length){
      page.icon = page.icon.first().attr('href') // could still be empty...
      var icon_url = node_url.parse(page.icon)
      if(icon_url.pathname[0]!=='/') icon_url.pathname = '/' + icon_url.pathname
      if(!icon_url.hostname) page.icon = url.protocol + '//' + url.hostname + icon_url.pathname
    }else page.icon = null
  }
  
  return page
}