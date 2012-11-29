
var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , _ = require('underscore')

var TagSchema = new Schema({
  name : {
      type  : String
    , required : true
    , index : true
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

TagSchema.statics.updateUserTags = function(owner, changes){
  _.each(changes, function(change, name){
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
        , $inc : { count : change }
      }
      // options
      , {
        // create the field if it doesn't already exist
        upsert : true
      }
    ).exec()
  })
}


var Tag = module.exports = mongoose.model('Tag', TagSchema)