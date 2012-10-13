/**
 * Link/bin routing
 */
var url      = require('url')
  , _        = require('underscore')
  , crypto   = require('crypto')
  , Bin      = require('../models/bin')
  , Link     = require('../models/link')
  , Counter  = require('../models/counter')
  , user = require('./user')
  , node_path = require('path')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
  
  
  function parsePathCommand(url,subdomains){
    var opts = {}
    // a users bin 
    if(subdomains.length) opts.username = subdomains.pop()
    
    // parse the url command
    var matches = uri_regexp.exec(url)
    if (!matches || matches.length === 0) return new Error('Invalid URL')
    
    // use http if no protocol was specified
    var protocol = matches[matches.length - 2] || 'http://'
      , uri  = matches[matches.length - 1]
      , path = matches[1]
    
    if(path) path = node_path.normalize(path)
    
    // prevent bins from being added to the root path '/'
    if (path === '/') {
      path = undefined
      if (uri === undefined) 
        // no path and no uri? we should never get here.
        // the earlier '/' route should take precidence but just incase...
        return new Error("Invalid clickbin path.")
    
    }else if (path[path.length - 1] === '/') 
      // remove the trailling '/'
      path = path.substring(0, path.length - 1)
    
    // check to make sure the protocol is valid
    if (!/ftp|http|https|mailto|file/.test(protocol.split(':')[0])) 
      return new Error('Invalid protocol')
    
    if(uri) opts.uri = protocol + uri
    else opts.uri = undefined
    opts.path = path
    
    return opts
  }
  
  var uri_regexp = /^((\/(?:[a-zA-Z0-9\-^\/]+(?:\/|$)))|\/)(\w+?:\/\/)?([^\/]+\..+)?/
  
  app.get(uri_regexp, function (req, res, next) {
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
    opts = parsePathCommand(req.url,req.subdomains)
    if(opts instanceof Error){
      req.session.flash.error = opts.message
      return res.redirect('/')
    }
    
    // the user 'route' but it's a little different then a regular route 
    // because it's actually just a subdomain. that's why the code looks
    // a little gross compared to the other routes.
    if(opts.username) return user(req,res,next,opts)
    
    // else, the user is anonymous
    
    var path = opts.path
      , uri = opts.uri
    
    if (path) {
      // bin paths should start with a '/' but not end with one
      // requesting a just a bin
      Bin.findOne({ path : path}, function (err, bin) {
        if (err) return next(err)
        // show the bin
        if(bin && uri === undefined) return render(bin)
        // add a link th an existing bin
        if(bin) return addLinkToBin(path, uri, bin)
        
        // whatever it is we want to do, we've got to create a bin for it first
        
        // dont allow anonymous users create their own top level bins
        var bins = path.substring(1).split('/')
        if(bins.length === 1){
          req.session.flash.error = "Only random top level bins can be "
            + "created"
          return res.redirect('back')
        }else if(bins.length > 20){
          // make sure bins dont get crazy...
          req.session.flash.error = "Sorry! There's a max depth of 20 on all bin paths."
          return res.redirect('back')
        }
        // for we create the bin, make sure it has a root bin.
        Bin.findOne({
          path : '/' + bins[0]
        }, function(err, bin) {
          if(err) return next(err)
          else if(!bin){
            req.session.flash.error = "That root bin doesn't exist yet"
            + " and only random top level bins can be created"
            return res.redirect('/')
          }else if(bin.sessionID !== req.sessionID){
            req.session.flash.error = "You dont own that root bin"
            return res.redirect('/')
          }else{
            if(uri){
              Link.scrape(uri, function(err,link){
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
                return res.redirect(bin.path + '/')
              })
            }
          }
        })
      })
    } else {
      // creating an anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      Counter.increment('anonymous-bin-counter', function (err, val) {
        if (err) return next(err)
        Link.scrape(uri, function (err, link) {
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
            req.session.flash.success = "You have just created a new clickbin! "
              + "You can now add or remove links and create new bins here."
            return res.redirect(bin.path)
          }) // end save bin
        })
      })
    }
    
    /**
     * Add an URI to an existing bin
     * @param {[type]} path     [description]
     * @param {[type]} protocol [description]
     * @param {[type]} uri      [description]
     * @param {[type]} bin      [description]
     */
    function addLinkToBin(path, uri, bin) {

      if (bin.sessionID !== req.sessionID) {
        req.session.flash.error = 'You can\'t add links to this bin. '
          // TODO: ask permission feature should only be available for 
          // non-anounymous bins (which dont exist. (yet))
          // + '<a href="ask">Ask for permission</a>'
        return res.redirect(path)
      }

      else Link.scrape(uri, function (err, link) {
        if (err) return next(err)
        
        if (bin.addLink(link)) return bin.save(function(err) {
          if(err) return next(err)
          return res.redirect(path)
        })
        
        req.session.flash.error = 'This bin already has that link'
        return res.redirect(path)
      })
    }

    /**
     * [ensureBinsExistAlongPath description]
     * @param  {[type]} bins [description]
     * @return {[type]}      [description]
     */
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
        // we dont need to wait for this callback. fire and forget
        , function(){})
      }
    }
  }) // end GET /path/[link]
  
}