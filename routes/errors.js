module.exports = function (err, req, res, next) {
  console.error(err)
  console.error(err.stack)
  req.session.flash.error = err.message
  res.redirect('/')
}