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
  // old regex
  //var uri_regexp = /^\/((?:[^\/]+\/)+?)(\w+?:\/\/)?([^\/]+\..+)?$/
  var uri_regexp = /^((\/(?:[a-zA-Z0-9\-^\/]+(?:\/|$)))|\/)(\w+?:\/\/)?([^\/]+\..+)?/
  
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
    console.log('matches')
    console.log(matches)
    var protocol = matches[matches.length - 2] || 'http://'
      , uri     = matches[matches.length - 1]
      , path      = matches[1]
    
    // prevent bins from being added to the root path '/'
    if(path==='/'){
      path = undefined
      if(uri===undefined) return next() // let another route handle this request
    }
    // remove the trailling '/'
    else if(path[path.length-1]==='/') path = path.substring(0,path.length-1)
    
    if(!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
      return next(new Error('invalid protocol'))
    
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
      // requesting a just a bin
      Bin.findOne({path:path}, function(err, bin){
        if(err) return next(err)
        else if(!bin) return next(new Error("No bin exists with that name"))
        else if(uri===undefined){
          // just show the bin
          return render(bin)
        }else{
          // add a uri to an existing bin
          // TODO: check permissions
          scrapper.get(protocol + uri, function(err,link){
            if(err) return next(err)
            if(bin.addLink(link)){
              // successfully added a `new` link to the bin
              bin.save(function(err){
                if(err) return next(err)
                else return res.redirect(path)
              })
            }else{
              console.log('unable to add link')
              console.log(link)
              // TODO: report that the link is already in the bin
              return res.redirect(path)
            }
          })
        }
      })
    }else{
      // creating an anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      Counter.increment('anonymous-bin-counter', function(err, val){
        if(err) return next(err)
        scrapper.get(protocol + uri, function(err,link){
          if(err) return next(err)
          // base 36 encode the counter's value
          bin = new Bin({ path : '/' + val.toString(36) })
          bin.addLink(link)
          bin.save(function(err) {
            if (err) return next(err)
            return res.redirect(bin.path)
          }) // end save bin
        })
      })
    }
  }) // end GET /[bin-name]/[link]
}
