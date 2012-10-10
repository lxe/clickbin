var _ = require("underscore")

module.exports = function(app) {
  app.get('/_/logout', function(req, res, next) {
    req.session.user = { loggedIn : false }
    return res.redirect(res.locals.getRootURI())
  })
}
