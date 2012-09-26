module.exports = function(app) {
  app.post('/link/add', function(req, res, next) {
    return res.redirect('/' + req.body.uri)
  })
}
