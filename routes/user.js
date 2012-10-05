

module.exports = function(req,res,next,opts){
  var username = opts.username
  return res.render('user',opts)
}