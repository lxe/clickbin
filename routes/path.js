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
  , pathCommand = require('../middleware/path-command')

/**
 * [sendJSONP description]
 * @param  {[type]} res [description]
 * @param  {[type]} obj [description]
 * @return {[type]}     [description]
 */
function sendJSONP(res, obj) {
   res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate"); // HTTP 1.1.
   res.setHeader("Pragma", "no-cache"); // HTTP 1.0.
   res.setHeader("Expires", 0); // Proxies.
   res.setHeader("Content-type", "application/x-javascript");
   return res.send('jsonp(' + JSON.stringify(obj) + ')');
}

/**
 * [exports description]
 * @param  {[type]} app [description]
 * @return {[type]}     [description]
 */
module.exports = function (app) {
  
  app.get('/*', pathCommand, function (req, res, next) {
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
    // TODO: move this code its own file called `anonymous`
    // 
    
    var path = command.path || req.session.bookmarkletPath
      , uri = command.uri
    
    if (path) {
      // bin paths should start with a '/' but not end with one
      // requesting a just a bin
      Bin.findOne({ path : path}, function (err, bin) {
        if (err) return next(err)
        var isOwner = bin && bin.sessionID === req.sessionID
        // if the user accessing the bin isn't the owner and the bin isn't 
        // public
        if(bin && !isOwner && !bin.public) return errorTopLevelBin(req,res)

        // show the bin
        if(bin && uri === undefined){
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
        else if(bin) return addLinkToBin(path, uri, bin, command.jsonp, res)
        
        // dont allow anonymous users to create their own top level bins
        var bins = path.substring(1).split('/')
        if(bins.length === 1) return errorNameBin(req,res)
        else if(bins.length > 10) return errorMaxBinPath(req,res)
        
        // before we create the bin, make sure it has a root bin.
        Bin.findOne({
          path : '/' + bins[0]
        }, function(err, bin) {
          if(err) return next(err)
          else if(!bin) return errorTopLevelBin(req,res)
          var isOwner = bin.sessionID === req.sessionID
          // there is a bin there, but the use is not the owner
          if(!isOwner){
             // and the bin is not a public bin
            if(!bin.public) return errorTopLevelBin(req,res)
            else return errorNotRootBinOwner(req,res)
          } else {
            if(uri){
              Link.scrape(uri, function(err,link){
                if(err) return next(err)
                saveNewBin(bins,[link])
              })
            } else saveNewBin(bins,[])
            
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
                if (command.jsonp) return sendJSONP(res, { path: bin.path })
                return res.redirect(bin.path + '/')
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
          bin = new Bin({
            path: '/' + val.toString(36)
            // when creating an anounymous bin, give it the sessionID of its
            // creator
            , sessionID : req.sessionID
            , links : [link]
          })
          bin.save(function (err, data) {
            if (err) return next(err)
            if (command.jsonp) return sendJSONP(res, { path: bin.path })

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
    function addLinkToBin(path, uri, bin, jsonp, res) {

      if (bin.sessionID !== req.sessionID) {
        var errorString = 'You can\'t add links to this bin.'

       if (jsonp) return sendJSONP(res, { error: errorString })
    
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
          if (jsonp) return sendJSONP(res, { path: path })
          return res.redirect(path)
        })
        
        if (jsonp) return sendJSONP(res, { path: path, alreadyPresent: true })
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