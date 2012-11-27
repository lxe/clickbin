module.exports = function (err, req, res, next) {
  console.error(err)
  if(req.session) req.session.flash.error = err.message
  res.redirectToLanding()
}