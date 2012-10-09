var _ = require('underscore')
  , User = require('../models/user')
  , Bin = require('../models/bin')

module.exports = function(app) {
  app.get('/signup', function(req, res, next) {
    return res.render('signup',{
      errors:{}
      , inputUsername : ''
      , inputEmail : ''
    })
  })
  app.post('/signup',function(req, res, next) {
    console.log(req.body)
    req.assert('inputUsername','must be at least 3 characters and start with a letter').len(3,64).regex(/^[a-zA-Z]+/)
    req.assert('inputPassword','must be at least 6 characters').len(6,64)
    req.assert('inputPasswordAgain','passwords must match').is(req.body.inputPassword)
    if(req.body.inputEmail) 
      req.assert('inputEmail','invalid email').isEmail()
    //req.assert('inputUsername','username is at least 3 characters long').notEmpty() //.min(3).max(64).isAlphanumeric().regex(/^[a-zA-Z]+/)
    var errors = req.validationErrors(true)
    
    if(!_.isEmpty(errors)){
      // show the proper error message
      return res.render('signup',{
        inputUsername : req.body.inputUsername
        , inputEmail : req.body.inputEmail
        , errors : errors
      })
    }else{
      // try and create the new user
      var user = new User({
        username : req.body.inputUsername.toLowerCase() // all usernames are lowercased to avoid collision
        , password : req.body.inputPassword
        , email : req.body.inputEmail
      })
      user.save(function(err){
        if(err){
          if( err.toString().indexOf('dup key') !==-1 && err.toString().indexOf('$username') !== -1)
            req.session.flash.error = 'Sorry! That username is already taken'
          else if( err.toString().indexOf('dup key') !==-1 && err.toString().indexOf('$email') !== -1)
            req.session.flash.error = 'Sorry! That email address is already taken'
          else{
            req.session.flash.error = 'An unkown error occured. Please try again. If the problem continues, please contact an admin.'
            console.error(err.toString())
          }
          return res.redirect('back')
        }else{
          req.session.user = { 
            loggedIn : true 
            , username : user.username
          }
          req.session.flash.succuess = "You're logged in!"
          var user_path = user.getPath(req)
          // create a new top level bin for this user
          var bin = new Bin({ path : user.username + ':/' })
          bin.save(function(err){
            if(err) return next(err)
            return res.redirect(user_path)
          })
        }
      })
    }
  })
}
