module.exports = function(app) {
  app.post('/_/link/add', function(req, res, next) {
    return res.redirect('/' + req.body.uri)
  })
  app.get('/_/link/add.jsonp', function(req, res, next) {
    if(req.accepts('text/javascript'))
      return res.jsonp({
        path : req.session.bookmarkletPath
      })
  })
}
