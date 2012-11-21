var _       = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , config = require('../config')

// design cools. simplicity and easiness should be priority #1 even over performance
// a bin should be able to be removed simply by removing the document from the db

var HeatSchema = new Schema({
  // is this bin publicically accessible by anyone?
   sessionID : {
    type : String
    , required : true
  }
  , linkID : {
    type : Schema.Types.ObjectId
    , required : true
  }
  , votes : {
    type : Number
    , required : true
  }
  , created : {
    type : Date
    , default : Date.now
    , index : true
  }
}, { strict: true })

HeatSchema.index(
  { 
    sessionID : 1
    , linkID : 1
  }
  , { unique : true }
)

// Heat.vote()
HeatSchema.statics.vote = function(sessionID, linkID, cb){
  Heat.findOneAndUpdate({
    sessionID : sessionID
    , linkID : linkID
  }
  , {
    sessionID : sessionID
    , linkID : linkID
    , $inc : { votes : 1 }
  }
  // options
  , {
    new : true // return the modified document
    , upsert : true
  }, cb)
}

var Heat = module.exports = mongoose.model('Heat',HeatSchema)