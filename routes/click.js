var _ = require("underscore")

module.exports = function(app) {
  app.get('/_/click/link/:linkID', function(req, res, next) {
    var sessionID = req.sessionID
    , linkID = req.params.linkID
    throw new Error("lin click not implemented")
  })
}

// /_/heat/bin/50a6f96bb08995fea7000003/link/50a6f96bb08995fea7000002