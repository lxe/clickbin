var request = require('request')
  , jsdom = require("jsdom")

module.exports = {
  get : function(url,cb){
    jsdom.env(url, [
      'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'
    ], function(err, window){
      cb(null,{
        icon : window.$('link[rel="shortcut icon"]').attr('href')
        , title : window.$('title').text()
        , url : url
      })
    })
  }
}