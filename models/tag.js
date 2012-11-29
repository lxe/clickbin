
var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , _ = require('underscore')

var TagSchema = new Schema({
  name : {
      type  : String
    , required : true
    , index : true
  }
  , publicCount : {
    type : Number
    , required : true
    , default : 0
  }
  , count : {
      type  : Number
    , required : true
    , default  : 0
  }
  , owner : {
    type : Schema.Types.ObjectId
    , required : true
    , index : true
  }
}, { strict : true })

// make sure the combination of the owner and name is unique
TagSchema.index(
  { 
    owner : 1
    , name : 1
  }
  , { unique : true }
)

TagSchema.statics.getTopTags = function(owner, cb){
  var query = Tag.find({
    owner : owner
  }).sort('field -count')
  if(cb) return query.exec(cb)
  else return query
}

TagSchema.statics.updateUserTags = function(owner, changes, cb){
  
  var tags = _.keys(changes)
  
  function next(name){
    Tag.findOneAndUpdate(
      // query conditions
      {
        name : name
        , owner : owner
      }
      // update
      , {
        name : name
        , owner : owner
        , $inc : changes[name]
      }
      // options
      , {
        // create the field if it doesn't already exist
        upsert : true
      }
      , function(err){
        if(err && cb) return cb(err)
        var tag = tags.pop()
        if(tag) return next(tag)
        if(cb) return cb()
      }
    )
  }
  
  return next(tags.pop())
}


var Tag = module.exports = mongoose.model('Tag', TagSchema)