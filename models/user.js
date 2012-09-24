var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , salt = require('../config').salt
  , common = require('./common')


function setPassword(password){
    if(common.validatePassword(password)){
        password = common.md5(password + salt)
        var res = common.digest(password)
        this.salt = res.salt
        return res.digest
    }
    return "." //return an invalid password
}

var UserSchema = new Schema({
  username : {
    type: String
    , unique : true
    , required : true
  }
  , firstname : {
      type : String
      , requried : false
  }
  , lastname : {
      type : String
      , required : false
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
  // did the user validate their account via email?
  , validated : {
      type : Boolean
      , required : true
      , default : false
  }
})

module.exports = mongoose.model('User',UserSchema)