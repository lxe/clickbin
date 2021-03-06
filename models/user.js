
var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , salt = require('../config').salt
  , common = require('./common')
  , Link = require('./link')
  , Tag = require('./tag')
  , _ = require('underscore')


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
    , validate : [ common.validateUsername, "username"]
  }
  , name : {
    first: String
    , last:  String
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
  , created : {
    type : Date
    , default : Date.now
    , index : true
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

UserSchema.statics.scrapeLink = function(user_id, href, tags, cb){
  Link.scrape(href, function(err, scrappedLink){
    if(err) return cb(err)
    var link = new Link({
      tags : tags
      , url : href
      , owner : user_id
    })
    scrappedLink = scrappedLink.toObject()
    delete scrappedLink._id
    scrappedLink.tags = _.union(scrappedLink.tags,link.tags)
    _.extend(link, scrappedLink)
    link.save(function(err, link){
      if(err) return cb(err)
      // increment the users tag count
      var tag_changes = {}
      _.each(link.tags, function(tag){
        tag_changes[tag] = {
          count : 1
          , publicCount : 1
        }
      })
      Tag.updateUserTags(user_id, tag_changes)
      return cb(null, link)
    })
  })
}

UserSchema.statics.updateTagCount = function(user_id, tag_changes){
  Tag.updateUserTags(user_id, tag_changes)
}

UserSchema.methods.getTopTags = function(cb){
  return Tag.getTopTags(this._id, cb)
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

UserSchema.methods.getLinks = function(tags, includePrivate, cb){
  // optional parameters
  return Link.getUserLinks(this, tags, includePrivate, cb)
}


var User = module.exports = mongoose.model('User', UserSchema)