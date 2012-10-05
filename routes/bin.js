
var Bin = require('../models/bin')

/**
  * non bin related requests begin with '/_/'
  */

module.exports = function(app){
  
  // Bin Commands
  
  // remove a link from a bin
  
  app.get('/_/bin/:binID/link/:linkID/remove',function(req,res,next){
    Bin.findById(req.params.binID, function(err,bin){
      if (err) return next(err)
      if(!bin){
        req.session.flash.error = "Looks like you tried to remove a link from "
          + "a bin that no longer exists."
        return res.redirect('back')
      }
      if (req.sessionID !== bin.sessionID){
        req.session.flash.error = "You dont have permission to remove links "
          + "from bins you don't own."
        return res.redirect(bin.path)
      }
      bin.removeLinkById(req.params.linkID).save(function(err){
        if(err) return next(err)
        else res.redirect(bin.path)
      })
    })
  }) // end GET /_/:binID/link/:linkID/remove
  
  // remove a bin
  
  app.get('/_/bin/:binID/remove',function(req, res, next){
    Bin.findById(req.params.binID,function(err, bin){
      if (err) return next(err)
      else if (!bin){
        req.session.flash.error = "That bin doesn't exist"
        return res.redirect('back')
      }
      else if (req.sessionID !== bin.sessionID){
        req.session.flash.error = "You dont have permission to remove bins you "
          + "don't own"
        return res.redirect('back')
      }

      bin.getChildren(function(err, children){
        var parent = bin.parent
        if (err) return next(err)
        else if (children.length > 0){
          req.session.flash.error = "You can only remove bins that are empty."
          return res.redirect(parent)
        }
        bin.remove(function(err){
          if(err) return next(err)
          else return res.redirect(parent)
        })
      })
    })
  })
}