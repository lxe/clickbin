var _ = require("underscore")
  , User = require('../models/user')

module.exports = function(app) {

  app.get('/_/login', function(req, res, next) {
    return res.render('login', {
      errors : {}
      , title : 'Sign in - clickbin'
    })
  })

  app.post('/_/login',function(req, res, next) {
    var errors = {}
    if(!req.body.inputUsername) errors.inputUsername = { msg : "username is missing" }
    if(!req.body.inputPassword) errors.inputPassword = { msg : "password is missing" } 
    if(!_.isEmpty(errors)) return res.render('login',{errors:errors})
    User.findOne({username:req.body.inputUsername},function(err,user){
      if(err) return next(err)
      if(user && user.guessPassword(req.body.inputPassword)){
        req.session.user = { 
          loggedIn : true 
          , username : user.username
          , title : 'Sign in - clickbin'
          , _id : user._id
        }
        return res.redirect('/')
      }else{
        errors.inputPassword = { msg : "Username and password combo is not correct" }
        return res.render('login', {
          errors : errors
        })
      }
    })
  })
}
