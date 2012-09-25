/**
 * Link/bin routing
 */

var url    = require('url')
  , _      = require('underscore')
  , crypto = require('crypto')
  , uuid   = require('node-uuid')
  , Bin    = require('../models/bin')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function(app) {

  /**
   * [uri_regexp description]
   * @type {RegExp}
   */
  var uri_regexp = /^\/((?:[^\/]+\/?)+?)(\w+?:\/\/)?([^\/]+\..+)?$/
  
  
  /**
   * GET /[bin-name]/[link]
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.get(uri_regexp, function(req, res, next) {
    function linkError(errStr) {
      req.session.flash.linkError = errStr
      console.log('link error: '+errStr)
      return res.redirect('/')
    }
    
    var matches = uri_regexp.exec(req.url)
    if (!matches || matches.length === 0) return linkError('Invalid URL')
    
    // use http if no protocol was specified
    var protocol = matches[matches.length - 2] || 'http://'
      , path     = matches[matches.length - 1]
      , uri      = matches[1]
    
    // if the uri is there and the path isn't, then really.. the path is there
    // but not the uri.....?
    if(uri!==undefined && uri!==null && uri.indexOf('.')===-1){
      path = uri
      uri = undefined
    }
    
    protocol = protocol.split(':')[0]
    if(!/ftp|http|https|mailto|file/.test(protocol)) 
      return linkError('Invalid Protocol')
    
    function render(bin) {
      // meanhile, in russia
      return res.render('bin', {
        path : path 
        , bin : bin
      })
    }
    
    if(path){
      // bin paths should start with a '/' but not end with one
      if(path[0]!=='/') path = '/' + path
      if(path[path.length-1]==='/') path = path.substring(0,path.length-1)
      if(!uri){
        // requesting a just a bin
        Bin.find({path:path}, function(err, bin){
          if(err) return linkError('Internal Error')
          // no existing bin found
          if(!bin) return linkError('Not Implemnted')
          else return render(bin)
        })
      }else{
        // add the url to an existing bin
        // TODO: check to see if the current (logged out) user is the owner of 
        // this bin
      }
    }else{
      // creating an anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      bin = new Bin({
        path : '/' + uuid.v4() // TODO: Use the counter instead of this :)
        , links : [ { title : 'Test' , url : protocol + '://' + uri } ]
      })
      bin.save(function(err) {
        if (err) return linkError('Crazy server error')
        return res.redirect(bin.path)
      }) // end save bin
    }
  }) // end GET /[bin-name]/[link]
}
