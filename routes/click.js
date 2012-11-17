var _ = require("underscore")
  , Bin = require('../models/bin')

module.exports = function(app) {
  app.get('/_/click/bin/:binID/link/:linkID', function(req, res, next) {
    console.log('click path')
    var sessionID = req.sessionID
    , linkID = req.params.linkID
    , binID = req.params.binID
    console.log('bin id: ' + binID)
    console.log('link id: ' + linkID)
    Bin.findById(binID, function(err,bin){
      if(err) console.log('error voting on bin')
      if(err) return next(err)
      if(!bin){
        console.error('someone tried to vote for a link on a bin that didnt exist')
        return res.redirect('back')
      }
      console.log('vot on link')
      bin.voteOnLink(sessionID, linkID, function(err, link){
        if(err) console.log('error voting on bin')
        if(err) return next(err)
        console.log('voted on bin!')
        console.log('redirecting to link: ' + link.url)
        if(link) return res.redirect(link.url)
        else return next()
      })
    })
  })
}

// /_/heat/bin/50a6f96bb08995fea7000003/link/50a6f96bb08995fea7000002