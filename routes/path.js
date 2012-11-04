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
  , pathCommandParser = require('../middleware/path-command-parser')
  , config = require('../config')

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
  
  app.get('/*', pathCommandParser, function (req, res, next) {
    var command = req.parsedPathCommand
    // TODO: put this inside an error handler middleware
    // if(opts instanceof Error){
    //   req.session.flash.error = opts.message
    //   return res.redirect('/')
    // }
    
    // the user 'route' but it's a little different then a regular route 
    // because it's actually just a subdomain. that's why the code looks
    // a little gross compared to the other routes.
    if(command.username) return user(req,res,next,command)
    
    // else, the user is anonymous...
    // TODO: all of this code needs to be put in a controller
    
    var path = command.path 
      , uri = command.uri

    if (path) {
      // the command contains a `path` component
      req.session.bookmarkletPath = path;
      // bin paths should start with a '/' but not end with one
      // requesting a just a bin
      Bin.getByPath(path, function(err , bin, bins ) {
        if (err) return next(err)
        var isOwner = bin && bin.sessionID === req.sessionID
        // if the user accessing the bin isn't the owner and the bin isn't 
        // public
        if(bin && !isOwner && !bin.public) return errorTopLevelBin(req,res)
        
        var realPath = ''
        _.each(bins, function(bin){ realPath += '/' + bin.prettyName })
        
        // show the bin
        if(bin && uri === undefined){
          if(path !== realPath) return res.redirect(realPath)
          return bin.getChildren(function(err,children){
            if(err) return next(err)
            return res.render('bin', {
              path: path
              , bin: bin
              , isOwner : isOwner
              , children : children
            })
          })
        }
        
        // add a link to an existing bin
        if(bin) return addLinkToBin(realPath, uri, bin, res)
        
        // dont allow anonymous users to create their own top level bins
        var bins = path.substring(1).split('/')
        if(bins.length === 1) return errorNameBin(req,res)
        else if(bins.length > config.maxBinPathDepth) return errorMaxBinPath(req,res)
        
        // get the root bin
        Bin.getByPath( '/' + bins[0], function(err, bin) {
          if(err) return next(err)
          else if(!bin) return errorTopLevelBin(req,res)
          // check that we're the owner
          var isOwner = bin.sessionID === req.sessionID
          // there is a bin there, but the use is not the owner
          if(!isOwner){
             // and the bin is not a public bin
            if(!bin.public) return errorTopLevelBin(req,res)
            else return errorNotRootBinOwner(req,res)
          } else {
            // adding a link to a new bin
            if(uri){
              Link.scrape(uri, function(err,link){
                if(err) return next(err)
                saveNewBin(path, [link])
              })
            // creating a new bin
            } else saveNewBin(path)
            
            function saveNewBin(path,links){
              if(!links) links = []
              Bin.ensureExists({
                sessionID : req.sessionID
                , links : links
              }, path, function(err, bin, bins){
                if(err) return next(err)
                var realPath = ''
                _.each(bins, function(bin){ realPath += '/' + bin.prettyName })
                return res.redirect(realPath)
              })
            }
          }
        })
      })
    } else {
      // creating an new anounomous bin. ie., 
      // a request of the form: clickb.in/google.com
      Counter.increment('anonymous-bin-counter', function (err, val) {
        if (err) return next(err)
        Link.scrape(uri, function (err, link) {
          if (err) return next(err)
          // base 36 encode the counter's value
          var name =  val.toString(36)
          bin = new Bin({
            name : name 
            // when creating an anounymous bin, give it the sessionID of its
            // creator
            , sessionID : req.sessionID
            , links : [link]
          })
          bin.save(function (err, data) {
            if (err) return next(err)
            req.session.flash.success = "You have just created a new clickbin! "
              + "You can now add or remove links and create new bins here."
            console.log('path: /' + name)
            return res.redirect('/' + name)
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
    function addLinkToBin(path, uri, bin, res) {

      if (bin.sessionID !== req.sessionID) {
        var errorString = 'You can\'t add links to this bin.'
    
        req.session.flash.error = errorString
        // TODO: ask permission feature should only be available for 
        // non-anounymous bins (which dont exist. (yet))
        // + '<a href="ask">Ask for permission</a>'
        return res.redirect(path)
      }

      else Link.scrape(uri, function (err, link) {
        if (err) return next(err)
        
        if (bin.addLink(link)) return bin.save(function(err) {
          if (err) return next(err)
          return res.redirect(path)
        })
        req.session.flash.error = 'Bin already has this link'
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



function errorTopLevelBin(req, res){
  req.session.flash.error = "Sorry. We couldn not find the clickbin you requested."
  return res.redirect('/')
}

function errorNotRootBinOwner(req, res){
  req.session.flash.error = "Sorry. You cannot access the clickbin you requested."
  return res.redirect('/')
}

function errorMaxBinPath(req, res){
  // make sure bins dont get crazy...
  req.session.flash.error = "Too many levels of bins!"
    + "paths."
  return res.redirect('back')
}

function errorNameBin(req, res){
  req.session.flash.error = "You must <a href=\"/_/login\">register or sign "
    + "in</a> to name your bins. "
  return res.redirect('back')
}