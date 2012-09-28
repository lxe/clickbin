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
  },
  name : {
    first: String,
    last:  String
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

module.exports = mongoose.model('User', UserSchema)