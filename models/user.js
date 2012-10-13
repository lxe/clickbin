/**
 * User Model
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , salt = require('../config').salt
  , common = require('./common')


/**
 * [setPassword description]
 * @param {[type]} password [description]
 */
function setPassword(password){
  if(common.validatePassword(password)){
    password = common.md5(password + salt)
    var res = common.digest(password)
    this.salt = res.salt
    return res.digest
  }
  return "." //return an invalid password
}

/**
 * [UserSchema description]
 * @type {Schema}
 */
var UserSchema = new Schema({
  username : {
    type: String
    , unique : true
    , required : true
  }
  , name : {
    first: String,
    last:  String
  }
  , email : {
    type : String
    , unique : true
    , sparse: true
    , required : false
    , validate : [ common.validateEmail, "email"]
  }
  , password : { 
    type : String
    , set : setPassword
    , required : true
    , validate : [ common.validatePassword, "password"]
  }
  , salt : {
    type : String
    , required : true
  }

  // did the user activate their account via email?
  , active : {
    type : Boolean
    , required : true
    , default : false
  }
}, { strict: true })

UserSchema.statics.exists = function(username,email,cb){
  User.findOne().or({
    username : username
    , email : email
  }).exec(cb)
}

UserSchema.statics.getURI = function(req,username){
  var host = req.get('Host').split('.').reverse()
  return req.protocol + '://' + username + '.' + host[1] + '.' + host[0] + '/'
}

UserSchema.methods.getURI = function(req){
  return User.getURI(req,this.username)
}

UserSchema.methods.guessPassword = function(password){
  return this.password === common.digest(common.md5(password + salt),this.salt).digest
}

var User = module.exports = mongoose.model('User', UserSchema)