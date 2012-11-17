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
  , bin : {
    type : Schema.Types.ObjectId
    , requried: true
  }
  , url : {
    type : String
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
    , bin : 1
    , url : 1
  }
  , { unique : true }
)

// Heat.vote()
HeatSchema.statics.vote = function(sessionID, bin, url, cb){
  Heat.findOneAndUpdate({
    sessionID : sessionID
    , bin : bin
    , url : url
  }
  , {
    sessionID : sessionID
    , bin : bin
    , url : url
    , $inc : { votes : 1 }
  }
  // options
  , {
    new : true // return the modified document
    , upsert : true
  }, cb)
}

var Heat = module.exports = mongoose.model('Heat',HeatSchema)