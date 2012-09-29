/**
 * Link/bin routing
 */
var url      = require('url')
  , _        = require('underscore')
  , crypto   = require('crypto')
  , uuid     = require('node-uuid')
  , Bin      = require('../models/bin')
  , Link     = require('../models/link')
  , Counter  = require('../models/counter')
  , scraper = require('../controllers/scraper')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {

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
  app.get(uri_regexp, function (req, res, next) {
    function linkError(errStr) {
      req.session.flash.linkError = errStr
      return res.redirect('/')
    }

    var matches = uri_regexp.exec(req.url)
    if (!matches || matches.length === 0) 
        return linkError('Invalid URL')

    // use http if no protocol was specified
    var protocol = matches[matches.length - 2] || 'http://'
      , uri  = matches[matches.length - 1]
      , path = matches[1]

    // prevent bins from being added to the root path '/'
    if (path === '/') {
      path = undefined
      if (uri === undefined) 
        return next() // let another route handle this request
    }

    // remove the trailling '/'
    else if (path[path.length - 1] === '/') 
      path = path.substring(0, path.length - 1)

    if (!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
      return next(new Error('invalid protocol'))

    function render(bin) {
      // meanhile, in russia
      bin.getChildren(function(err,children){
        if(err) return next(err)
        return res.render('bin', {
          path: path
          , bin: bin
          , isOwner : bin.sessionID === req.sessionID
          , children : children
        })
      })
    }
    
    
    if (path) {
      // bin paths should start with a '/' but not end with one
      // requesting a just a bin
      Bin.findOne({
        path: path
      }, function (err, bin) {
        if (err) return next(err)
        // just show the bin
        else if (!bin) {
          // add a new bin (possibly recursively adding all the bins above it)
          var bins = path.substring(1).split('/')
          if(bins.length === 1) 
            return next(new Error("Only randomly top level bins can be "
              + "created"))
          // TODO: recursively check and create bins up until the give path
          // check to see if the root bin exists
            // if not, show error
            // else, check permissions
              // if not, show error
              // else, create the bin
              // then add link to current child bin
              // repeat last step until we reach the root bin
          else Bin.findOne({
            path : '/' + bins[0]
          }, function(err, bin) {
            if(err) return next(err)
            else if(!bin) return next(new Error("The root bin doesn't exist yet"
              + " and only random top level bins can be created"))
            else if(bin.sessionID !== req.sessionID) return next(new Error("You"
              + " dont own that root bin"))
            else{
              if(uri){
                scrape(protocol + uri, function(err,link){
                  if(err) return next(err)
                  saveNewBin(bins,[link])
                })
              }else saveNewBin(bins,[])
              
              function saveNewBin(bins,links){
                var bin = new Bin({
                  path : '/' + bins.join('/')
                  , sessionID : req.sessionID
                  , links : links
                })
                bin.save(function (err) {
                  if (err) return next(err)
                  // create sub bins
                  ensureBinsExistAlongPath(bins)
                  return res.redirect(bin.path)
                })
              }
            }
          })
        } else if(uri === undefined) return render(bin)
        else return addLinkToBin(path, protocol, uri, bin, function(err) {
          if(err) return next(err)
          else res.redirect(path)
        })
      })
    } else {
      // creating an anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      Counter.increment('anonymous-bin-counter', function (err, val) {
        if (err) return next(err)
        scrape(protocol + uri, function (err, link) {
          if (err) return next(err)
          // base 36 encode the counter's value
          bin = new Bin({
            path: '/' + val.toString(36)
            // when creating an anounymous bin, give it the sessionID of its
            // creator
            , sessionID : req.sessionID
            , links : [link]
          })
          bin.save(function (err) {
            if (err) return next(err)
            return res.redirect(bin.path)
          }) // end save bin
        })
      })
    }
    
    function addLinkToBin(path, protocol, uri, bin, cb){
      {
        // add a uri to an existing bin
        // TODO: eligently handle permission errors
        if (bin.sessionID !== req.sessionID) 
          return next(new Error("Permission Denied"))
        else scrape(protocol + uri, function (err, link) {
          if (err) return cb(err)
          if (bin.addLink(link)) return bin.save(cb)
          else return cb(new Error("This bin alrady has that same link"))
        })
      }
    }
    function ensureBinsExistAlongPath(bins){
      for(var i = bins.length; i > 1; i--){
        // go create the bins, if they dont exist yet
        var path = '/' + bins.slice(0,i).join('/')
        Bin.collection.findAndModify(
          { 
            path : path 
            , sessionID : req.sessionID
          }   // query
          , []                              // sort
          , {                               // update
            $set : { 
              path : path 
              , sessionID : req.sessionID
            }
          }
          , { upsert : true }               // options
        ,function(){}) // we dont need to wait for this callback. fire and forget
      }
    }
    
    function scrape(url, cb) {
      // this is sort of like a cache, for the scraper
      Link.findOne( { url : url }, function(err, link) {
        if(err) return cb(err)
        else if(link) return cb(null,link)
        // go, and _actually_ scrape the page
        else scraper.get(url,function(err,link){
          if(err) return cb(err)
          link = new Link(link)
          link.save(function(err){
            if(err) return cb(err)
            else return cb(null,link)
          })
        })
      })
    }
  }) // end GET /[bin-name]/[link]
  
  app.get('/_/bin/:binID/link/:linkID/remove',function(req,res,next){
    Bin.findById(req.params.binID,function(err,bin){
      if(err) return next(err)
      if(!bin) return next(new Error("That bin doesnt exist"))
      if(req.sessionID !== bin.sessionID) return next(new Error("You dont have permission to remove links from bins you dont own"))
      bin.removeLinkById(req.params.linkID).save(function(err){
        if(err) return next(err)
        else res.redirect(bin.path)
      })
    })
  })
  
  app.get('/_/bin/:binID/remove',function(req,res,next){
    Bin.findById(req.params.binID,function(err,bin){
      if(err) return next(err)
      if(!bin) return next(new Error("That bin doesnt exist"))
      if(req.sessionID !== bin.sessionID) return next(new Error("You dont have permission to remove bins you dont own"))
      bin.getChildren(function(err,children){
        if(err) return next(err)
        if(children.length>0) return next(new Error("You can only remove bins that are empty"))
        else{
          var parent = bin.parent;
          bin.remove(function(err){
            if(err) return next(err)
            else return res.redirect(parent)
          })
        }
      })
    })
  })
  
}