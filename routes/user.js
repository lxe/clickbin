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
    , bins = (path) ? path.substr(1).split('/') : null
  
  function isBinOwner(bin){
    return req.session 
      && req.session.user 
      // we're the user for this subdomain
      && req.session.user.username === username 
      && bin
      // and we own the bin
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
  
  if(path === '/' && !uri) {
    
    // show the user `root` bin. aka, their profile page
    Bin.getByPath(username, '/', function(err, bin) {
      var isOwner = isBinOwner(bin)
      if(err) return next(err)
      else if(!bin) {
        req.session.flash.error = "Could not locate bin."
        return res.redirectToLanding()
      } else if(!isOwner && !bin.public) {
        // req.session.flash.error = "That user's root bin is private"
        // return res.redirectToLanding()
        // return res.redirect('/_/signin')
        return res.retirectToSignIn();
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
    Bin.getByPath(username, path, function(err, bin) {
      if(err) return next(err)
      var isOwner = isBinOwner(bin)
      if(!bin) {
        console.log('bin doesnt exist for user ' + username)
        console.log('and path: ' + path)
        // the bin doesnt exist but we own the root
        if(isBinRootOwner()) {
          Bin.ensureExists({
            owner : req.session.user._id
          }, path, function(err, bin){
            if(err) return next(err)
            return render(bin)
          })
        } else {
          // we're not the owner of this bin and the bin doesnt exist yet
          req.session.flash.error = "You can't add links to bins you don't "
            + "own."
          return res.redirect('back')
        }
      } else {
        // show the bin
        if(!isOwner && !bin.public) return errorUserNoBin(req,res)
        else return render(bin)
      }
    })
  } else if(uri) {
    // add a link to a users bin
    Bin.getByPath(username, path, function(err, bin) {
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
            }, path, function(err, bin){
              if(err) return next(err)
              else return render(bin)
            })
          })
        } else {
          // the bin already exists, so add the link to it
          return addLinkToUserBin(path, uri, bin)
        }
      }
    })
  }

  // show the user bin page


  function render(bin) {
    // meanhile, in russia
    bin.getChildren(function(err, children) {
      if(err) return next(err)
      var isOwner = isBinRootOwner()
      return res.render('user', {
        isOwner : isOwner
        , path : path
        , title : username + '.' + config.domain + path
        , bin : bin
        , children: _.filter(children, function(child){
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
