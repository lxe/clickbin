module.exports = function(app) {
  app.post('/_/link/add', function(req, res, next) {
    return res.redirect('/' + req.body.uri)
  })
}
