var _ = require('underscore')
  , config = require('../config')
  , User = require('../models/user')
  , Bin = require('../models/bin')

module.exports = function(app) {
  app.get('/_/signup', function(req, res, next) {
    return res.render('signup',{
      errors:{}
      , inputUsername : ''
      , inputEmail : ''
      , title : 'Join clickbin!'
    })
  })
  app.post('/_/signup',function(req, res, next) {
    
    var errors = {}
    req.sanitize('inputUsername').trim()
    req.validate('inputUsername','numbers or letters and at least 3 characters long').len(3,64).regex(config.usernameRegexp)
    req.validate('inputPassword','must be at least 6 characters').len(6,64)
    req.validate('inputPasswordAgain','passwords must match').is(req.body.inputPassword)
    if(req.body.inputEmail){
      req.sanitize('inputEmail').trim()
      req.validate('inputEmail','invalid email').isEmail().notEmpty()
    }else{
      errors.inputEmail = {
        msg : 'the email field is required'
      }
    }
    //req.validate('inputUsername','username is at least 3 characters long').notEmpty() //.min(3).max(64).isAlphanumeric().regex(/^[a-zA-Z]+/)
    _.extend(errors,req.validationErrors(true))
    
    if(_.any(config.reservedUsernames,function(name){
      return req.body.inputUsername.toLowerCase() === name
    })){
      errors.inputUsername = {
        msg : 'Sorry! That username is already taken'
      }
    }
    
    if(!_.isEmpty(errors)){

      // show the proper error message
      return res.render('signup',{
        inputUsername : req.body.inputUsername
        , inputEmail : req.body.inputEmail
        , errors : errors
        , title : 'Join clickbin!'
      })

    } else {
      // try and create the new user
      var user = new User({
        username : req.body.inputUsername.toLowerCase() // all usernames are lowercased to avoid collision
        , password : req.body.inputPassword
      })
      // dont add the field unless it has a value
      if(req.body.inputEmail) user.email  = req.body.inputEmail
      
      user.save(function(err){
        if(err){
          if( err.toString().indexOf('dup key') !==-1 
              && err.toString().indexOf('$username') !== -1
          ){
            req.session.flash.error = 'Sorry! That username is already taken'
          }else if( 
            err.toString().indexOf('dup key') !==-1 
            && err.toString().indexOf('$email') !== -1
          ){
            req.session.flash.error = 'Sorry! That email address is already taken'
          }else{
            req.session.flash.error = 'An unkown error occured. Please try '
              + 'again. If the problem continues, please contact an admin.'
            console.error(err.toString())
          }
          return res.redirect('back')
        }else{
          req.session.user = { 
            loggedIn : true 
            , username : user.username
            , _id : user._id
          }
          req.session.flash.succuess = "You're logged in!"
          // create a new top level bin for this user
          var bin = new Bin({ owner : user })
          bin.save(function(err){
            if(err) return next(err)
            return res.redirectToProfile(user.username)
          })
        }
      })
    }
  })
}
