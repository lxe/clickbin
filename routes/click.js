var _ = require("underscore")
  , Link = require('../models/link')
  , Heat = require('../models/Heat')

module.exports = function(app) {
  app.get('/_/click/link/:linkID', function(req, res, next) {
    var sessionID = req.sessionID
    , linkID = req.params.linkID
    
    Link.findOne({
      _id : linkID
    }, function(err, link){
      if(err) return next(err)
      if(!link) return next(new Error("That link no longer exists"))
      res.redirect(link.url)
      Heat.vote(req.sessionID, link._id, function(err,heat){
        if(err || !heat){
          console.error('error updating heat for link: ' + link._id + 'and sessionID: ' + req.sessionID)
          return
        }
        if(heat.votes === 1){
          link.votes ++
        }
        link.clicks ++
        link.save()
      })
    })
  })
}

// /_/heat/bin/50a6f96bb08995fea7000003/link/50a6f96bb08995fea7000002