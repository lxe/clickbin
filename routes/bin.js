/**
  * the route is for handling bin task, such as removing a link from a bin,
  * or removing the bin, itself
  * note: bin related requests begin with '/_/'
  */

var Bin = require('../models/bin')
  , User = require('../models/user')
  , config = require('../config')


function userDoesntOwnBin(bin,req){
  return (
    // does the user own the this anounymous bin?
    !bin.owner && req.sessionID !== bin.sessionID
    // or does the loggedin user own this user bin?
    || (
      bin.owner 
      && (
        !req.session.user 
        || req.session.user._id !== bin.owner.toString() 
      )
    )
  )
}

module.exports = function(app){
  
  /**
    * remove a link from a bin
    */
  app.get('/_/bin/:binID/link/:linkID/remove', function(req, res, next) {
    Bin.findById(req.params.binID, function(err, bin) {
      if (err) return next(err)
      // bin doesn't exist
      if(!bin){
        req.session.flash.error = "Looks like you tried to remove a link from "
          + "a bin that no longer exists."
        return res.redirect('back')
      }
      // check permissions
      if( userDoesntOwnBin(bin,req) ){
        req.session.flash.error = "You dont have permission to remove links "
          + "from bins you don't own."
        return res.redirect('back')
      }
      
      // actually remove the link
      bin.removeLinkById(req.params.linkID).save(function(err) {
        if(err) return next(err)
        else res.redirect('back')
      })
    })
  })
  
  app.get('/_/bin/:binID/link/:linkID/rename', function(req, res, next){
    if(!req.query.name) return next(new Error('missing query param `name`'))
    Bin.findById(req.params.binID, function(err, bin){
      if(err) return next(err)
      if(!bin){
        req.session.flash.error = "looks like you tried to rename a link on a "
          + "bin that no longer exists."
        return res.redirect('back')
      }
      // check permissions
      if( userDoesntOwnBin(bin,req) ){
        req.session.flash.error = "You don't have permission to rename links "
          + "you don't own."
        return res.redirect('back')
      }
      bin.renameLinkById(req.params.linkID,req.query.name).save(function(err){
        if(err) return next(err)
        else res.redirect('back')
      })
    })
  })
  
  /**
    * remove a bin. checks permissions. then, if the bin has children, an 
    * error is thrown preventing the bin from being removed until the child 
    * bins are removed. However, bins can be removed if they have child links.
    * NOTE: maybe a bin shouldn't be allowed to be removed if it has links?
    */
  app.get('/_/bin/:binID/remove',function(req, res, next){
    Bin.findById(req.params.binID,function(err, bin){
      if (err) return next(err)
      // bin doesn't exit
      else if (!bin){
        req.session.flash.error = "That bin doesn't exist"
        return res.redirect('back')
      }
      // check permissions
      else if (
        req.sessionID !== bin.sessionID 
        && (!req.session.user || req.session.user._id !== bin.owner.toString() ) 
      ){
        req.session.flash.error = "You dont have permission to remove bins you "
          + "don't own"
        return res.redirect('back')
      }
      // check to see if this bin has children before removing it
      bin.getChildren(function(err, children){
        var parent = bin.parent
        var username = bin.owner
        if (err) return next(err)
        else if (children.length > 0){
          req.session.flash.error = "You can only remove bins that are empty."
          if(parent) return res.redirect('back')
          else if(username) return res.redirect(User.getURI(req,username))
        }
        bin.remove(function(err){
          if(err) return next(err)
          else if(parent) return res.redirect('back')
          else res.redirect(User.getURI(req,username))
        })
      })
    })
  })
  
  app.get('/_/bin/:binID/rename', function(req, res, next){
    Bin.findById(req.params.binID, function(err,bin){
      if(err) return next(err)
      if(
        bin
        && req.session
        && (
          // if this user is logged in and owns this bin
          req.session.user
          && req.session.user.loggedIn
          && req.session.user._id === bin.owner.toString()
          // or this is an anounymous bin and the current user owns it
          || !bin.owner
          && req.sessionID === bin.sessionID
        )
      ) {
        if(!bin.name) {
          req.session.flash.error = "This bin is not renameable"
          return res.redirect('back')
        }
        var name = decodeURIComponent(req.query.name)
        console.log('name: ' + name)
        if(!name || !name.match(config.binNameRegexp)){
          req.session.flash.error = "Invalid bin name"
          return res.redirect('back')
        }
        console.log('bin name is valid: ' + name)
        bin.name = name
        bin.save(function(err){
          if(err && err.code === 11001){
            req.session.flash.error = "there's already a bin with that name here"
            return res.redirect('back')
          }
          if(err) return next(err)
          return res.redirect(decodeURIComponent(req.query.redirect))
        })
      } else {
        req.session.flash.error = "you don't have permission to rename that bin"
        return res.redirect('back')
      }
    })
  })
  
  /**
    * make a bin public or private
    */
  app.get('/_/bin/:binID/public',function(req, res, next) {
    setBinAccess(true,req,res,next)
  });
  app.get('/_/bin/:binID/private',function(req, res, next) {
    setBinAccess(false,req,res,next)
  });
  
  function setBinAccess(access,req,res,next) {
    Bin.findById(req.params.binID, function(err, bin){
      if(err) return next(err)
      if(
        // the bin exists
        bin
        // the user has a session
        && req.session 
        && ( 
          // the user is logged in and owns this bin
          req.session.user 
            && req.session.user.loggedIn 
            && req.session.user._id === bin.owner.toString()
          // if we wanted to enable anounymous bins the option to be private...
          // the user is loggedout but owns the bin, and the bin is an anounymous 
          // bin
          // || !bin.owner
          //   && req.sessionID === bin.sessionID
        )
      ){
        // make the bin public or private
        bin.public = access
        bin.save(function(err){
          if(err) return next(err)
          return res.redirect('back')
        })
      }else{
        req.session.flash.error = "you dont have permission to change the "
          + "privacy of this bin"
        return res.redirect('back')
      }
    })
  }
  
}