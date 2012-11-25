// https://github.com/mikeal/request

var _ = require('underscore')

/**
  * github specific scraper
  */

module.exports = function(url,parts,$){
  // this scraper only works with video pages
  var page = {}
  var package_json = $('a[title="package.json"]').first().attr('href')
  if(package_json){
    console.log(url)
    if(package_json) page.__package_json = 'https://raw.github.com' + url.pathname + '/master/package.json'
  }
  return page
}