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
  if(!page.icon || !page.icon.length){
    page.icon = getBestIcon($,url)
    if(!page.icon){
      page.icon = url.protocol + '//' + url.host + '/apple-touch-icon.png'
    }
  }
  
  if(!page.url){
    page.url = $('meta[property="og:url"]')
    if(!page.url.length) page.url = null
    else{
      page.url = page.url.first().attr('content')
      if(page.url === 'null' ) page.url = null
    }
  }
  if(!page.url) page.url = url.href
  
  return page
}

function getBestIcon($,url){
    var icon = null
    
    // try to get the open graph icon
    icon = $('meta[property="og:image"]')
    // google uses this: <meta itemprop="image" content="/images/google_favicon_128.png">
    if(!icon.length) icon = $('meta[itemprop="image"]')
    if(icon.length){
      icon = icon.first().attr('content')
    }else icon = null
    
    // apple style icon
    if(!icon){
      // try finding the largest apple touch icon
      icon = $('link[rel="apple-touch-icon-precomposed"]')
      if(icon.length && icon.length > 1){
        var max_size = -1
        var largest_icon = null
        _.each(icon,function(icon){
          var $icon = $(icon)
          var size = $icon.attr('sizes')
          if(size){
            size = size.split('x')[0]
            if(size) size = Number(size)
            else size = 0
          }else size = 0
          if(size > max_size){
            max_size = size
            largest_icon = $icon
          }
        })
      }
      if(!icon.length) icon = $('link[rel="apple-touch-icon"]')
      // we have to do all these extra checks because the previous check could 
      // return a string instead of jquery instance object
      if(!icon.length) icon = $('link[rel="icon"]')
      
      if(icon.length) icon = icon.first().attr('href')
      else icon = null
    }
    
    if(icon){
      var icon_url = node_url.parse(icon)
      // for relative image references
      if(icon_url.pathname[0]!=='/') 
        icon_url.pathname = '/' + icon_url.pathname
      
      if(!icon_url.hostname) icon_url.hostname = url.hostname
      if(!icon_url.protocol) icon_url.protocol = url.protocol
      
      icon = icon_url.protocol + '//' + icon_url.hostname + icon_url.pathname
    }
    
    return icon
}
