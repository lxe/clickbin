/**
 * for processing requests for user subdomains.
 * ie., `username.clickb.in`
 */

var Bin = require('../models/bin')
  , Link = require('../models/link')
  , config = require('../config')
  , _ = require('underscore')


module.exports = function(req, res, next, opts) {
  // this route is called from the `path` route. the path route first parses out
  // the following parameters and gives it to us via the `opts` object above
  var username = opts.username
    , path = opts.path || '/'
    , uri  = opts.uri
    , bins = opts.bins
  
  function isBinOwner(bin){
    return req.session 
      && req.session.user 
      // we're the user for this subdomain
      && req.session.user.username === username 
      && bin
      // and we own the bin
      && bin.owner
      && bin.owner.toString() === req.session.user._id
  }
  
  function isBinRootOwner(){
    return req.session
      && req.session.user 
      && req.session.user.username === username
  }
  
  function errorUserNoBin(req,res){
    req.session.flash.error = username + " doesn't have a bin with "
      + "that name."
    return res.redirectToProfile(username)
  }
  
  // show the user `root` bin. aka, their profile page
  if(path === '/' && !uri) {
    Bin.getByPath(username, '/', function(err, bin) {
      var isOwner = isBinOwner(bin)
      if(err) return next(err)
      else if(!bin) {
        req.session.flash.error = "Could not locate bin."
        return res.redirectToLanding()
      } else if(!isOwner && !bin.public) {
        return res.redirectToSignIn();
      }
      bin.getChildren(function(err, children) {
        if(err) return next(err)
        else return res.render('user', {
          title : username + '.' + config.domain
          , isOwner : isOwner
          , path : path
          , profile : {
            username : username
          }
          , bin : bin
          , children: _.filter(children, function(child){
            return isOwner || child.public
          })
        })
      })
    })
  } else if(!uri) {
    // create/show a bin
    Bin.getByPath(username, path, function(err, bin, bins) {
      if(err) return next(err)
      var isOwner = isBinOwner(bin)
      if(!bin) {
        // the bin doesnt exist
        if(isBinRootOwner()) {
          // but we own the root bin
          console.log(' adding new bin: ')
          if(bins.length > config.maxBinPathDepth) 
            return errorMaxBinPath(req,res)
          console.log( 'bins: length: ' + bins.length )
          Bin.ensureExists({
            owner : req.session.user._id
          }, path, function(err, bin, bins){
            if(err) return next(err)
            return render(bin, realPath(bins) )
          })
        } else {
          // we're not the owner of this bin and the bin doesnt exist yet
          req.session.flash.error = "You can't add bins inside of bins you don't own."
          return res.redirect('back')
        }
      } else {
        // show the bin
        if(!isOwner && !bin.public) return errorUserNoBin(req,res)
        var rPath = realPath(bins)
        if(path !== rPath) return res.redirect(rPath)
        else return render(bin, realPath(bins) )
      }
    })
  } else if(uri) {
    // add a link to a users bin
    Bin.getByPath(username, path, function(err, bin, bins) {
      if(err) return next(err)
      // check permissions
      if(!req.session.user || req.session.user.username !== username) {
        // access denied
        req.session.flash.error = 'You can\'t add links to bins you don\'t own.'
        return res.redirect(path)
      } else {
        // access granted
        if(!bin) {
          // we need to create the bin
          Link.scrape(uri, function(err, link) {
            if(err) return next(err)
            Bin.ensureExists({
              owner : req.session.user._id
              , links : [link]
            }, path, function(err, bin, bins){
              
              if(err) return next(err)
              else return render(bin)
            })
          })
        } else {
          // the bin already exists, so add the link to it
          return addLinkToUserBin( realPath(bins), uri, bin)
        }
      }
    })
  }

  // show the user bin page

  function render(bin, realPath) {
    // meanhile, in russia
    bin.getChildren(function(err, children) {
      if(err) return next(err)
      var isOwner = isBinRootOwner()
      return res.render('user', {
        isOwner : isOwner
        , path : (realPath) ? realPath : path
        , title : username + '.' + config.domain + path
        , bin : bin
        , children : _.filter(children, function(child){
          return isOwner || child.public
        })
        , profile : {
          username : username
        }
      })
    })
  }

  // add the link to a user bin

  function addLinkToUserBin(path, uri, bin) {
    Link.scrape(uri, function(err, link) {
      if(err) return cb(err)
      if(bin.addLink(link)) return bin.save(function(err) {
        if(err) return next(err)
        return res.redirect(path)
      })
      else {
        // the link already exists
        req.session.flash.error = 'This bin already has that link'
        return res.redirect(path)
      }
    })
  }
}

function realPath(bins){
  var path = ''
  _.each(bins, function(bin){ path += '/' + bin.prettyName })
  return path
}

function errorMaxBinPath(req, res){
  // make sure bins dont get crazy...
  req.session.flash.error = "Too many levels of bins!"
    + "paths."
  return res.redirect('back')
}