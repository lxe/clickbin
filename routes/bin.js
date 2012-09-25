/**
 * Link/bin routing
 */

var url     = require('url')
  , _       = require('underscore')
  , crypto  = require('crypto')
  , uuid    = require('node-uuid')
  , Bin     = require('../models/bin')
  , Counter = require('../models/counter')
  , scrapper = require('../controllers/scrapper')

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
      return res.redirect('/')
    }
    
    var matches = uri_regexp.exec(req.url)
    if (!matches || matches.length === 0) return linkError('Invalid URL')
    
    // use http if no protocol was specified
    var protocol = matches[matches.length - 2] || 'http://'
      , uri     = matches[matches.length - 1]
      , path      = matches[1]
    
    // if the uri is there and the path isn't, then really.. the path is there
    // but not the uri.....?
    if(uri!==undefined && uri!==null && uri.indexOf('.')===-1 && path == undefined){
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
    console.log('path: '+path)
    console.log('uri: '+uri)
    if(path){
      // bin paths should start with a '/' but not end with one
      if(path[0]!=='/') path = '/' + path
      if(path[path.length-1]==='/') path = path.substring(0,path.length-1)
        // requesting a just a bin
        Bin.findOne({path:path}, function(err, bin){
          if(err) return next(err)
          if(!bin) return next(404)
          if(!uri){
            // just show the bin
            return render(bin)
          }else{
            // add a uri to an existing bin
            // TODO: check permissions
            scrapper.get(protocol + '://' + uri, function(err,link){
              if(err) return next(err)
              if(bin.addLink(link)){
                // successfully added a `new` link to the bin
                bin.save(function(err){
                  if(err) return next(err)
                  else return render(bin)
                })
              }else
                // TODO: report that the link is already in the bin
                return render(bin)
            })
          }
        })
    }else{
      // creating an anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      Counter.increment('anonymous-bin-counter', function(err, val){
        if(err) return next(err)
        scrapper.get(protocol + '://' + uri, function(err,link){
          if(err) return next(err)
          bin = new Bin({
            path : '/' + val.toString(36) // base 36 encode the counter
            , links : [ link ]
          })
          bin.save(function(err) {
            if (err) return next(err)
            return res.redirect(bin.path)
          }) // end save bin
        })
      })
    }
  }) // end GET /[bin-name]/[link]
}
