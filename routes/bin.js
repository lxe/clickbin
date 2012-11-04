/**
  * the route is for handling bin task, such as removing a link from a bin,
  * or removing the bin, itself
  * note: bin related requests begin with '/_/'
  */

var Bin = require('../models/bin')
  , User = require('../models/user')

module.exports = function(app){
  
  /**
    * remove a link from a bin
    */
  app.get('/_/bin/:binID/link/:linkID/remove',function(req,res,next){
    Bin.findById(req.params.binID, function(err,bin){
      if (err) return next(err)
      // bin doesn't exist
      if(!bin){
        req.session.flash.error = "Looks like you tried to remove a link from "
          + "a bin that no longer exists."
        return res.redirect('back')
      }
      // check permissions
      if (!bin.owner && req.sessionID !== bin.sessionID) 
        return deny()
      else if(bin.owner && (!req.session.user || req.session.user._id === bin.owner.toString() ) ) 
        return deny()
      // actually remove the link
      bin.removeLinkById(req.params.linkID).save(function(err){
        if(err) return next(err)
        else res.redirect('back')
      })
      // helper for reporting denial error
      function deny(){
        req.session.flash.error = "You dont have permission to remove links "
          + "from bins you don't own."
        return res.redirect('back')
      }
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
  
  /**
    * make a bin public or private
    */
  app.get('/_/bin/:binID/public',function(req,res,next){
    setBinAccess(true,req,res,next);
  });
  app.get('/_/bin/:binID/private',function(req,res,next){
    setBinAccess(false,req,res,next);
  });
  
  function setBinAccess(access,req,res,next){
    Bin.findById(req.params.binID,function(err, bin){
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
        req.session.flash.error = "That bin doesn't exist or is a private bin that you don't own."
        return res.redirect('back')
      }
    })
  }
  
}