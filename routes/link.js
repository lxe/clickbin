module.exports = function(app) {
  app.post('/_/link/add', function(req, res, next) {
    return res.redirect('/' + req.body.uri)
  })
  app.get('/_/link/add.jsonp', function(req, res, next) {
    console.log('link/add.jsonp')
    if(req.accepts('text/javascript')){
      // TODO: examin the `req.query` and perform the approviate action
      return res.jsonp({
        path : req.session.bookmarkletPath
      })
    }
  })
}
