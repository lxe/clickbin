/**
 * Scraper module - scrapes icons from web pages
 */

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
      'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
    ], function(err, window){
      if (err) return cb(err)
      cb(null, {
          icon  : window.$('link[rel="shortcut icon"]').attr('href')
        , title : window.$('title').text()
        , url   : url
      })
    })
  }
}