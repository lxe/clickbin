/**
 * Scraper module - scrapes icons from web pages
 */
// TODO: in the event the <title> is available, pull the first <h1> tag
// TODO: check for a /favicon.ico if found then download, parse, resize it
var request = require('request')
  , jsdom   = require("jsdom")

module.exports = {
  
  /**
   * [get description]
   * @param  {[type]}   url [description]
   * @param  {Function} cb  [description]
   * @return {[type]}       [description]
   */
  get : function(url, cb){
    jsdom.env(url, [
      // TODO: stop using google cdn
      'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
    ], function(err, window){
      if (err) return cb(err)
      cb(null, {
          icon  : window.$('link[rel="icon"]').attr('href')
        , title : window.$('title').text()
        , url   : url
      })
    })
  }
}