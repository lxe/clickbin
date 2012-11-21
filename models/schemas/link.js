var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var LinkSchema = new Schema({
  title : {
    type : String
    , required : false
  }
  , desc : {
    type : String
    , required : false
  }
  // the path to the image (local or absolute)
  , icon : {
    type : String
    , required : false
    , default : null
  }
  , url : {
    type : String
    , required : true
    , index : true
  }
  , mime : {
    type : String
    , required : false
  }
  , created : {
    type : Date
    , default : Date.now
    , index : true
  }
  , tags : {
    type : [String]
    , default : []
    , index : true
  }
  , owner : {
    type : Schema.Types.ObjectId
    , required : false
    , index : true
  }
  , votes : {
    type : Number
    , required : true
    , default : 0
  }
  , clicks : {
    type : Number
    , required : true
    , default : 0
  }
}, {strict : true})

LinkSchema.index(
  { 
    owner : 1
    , _id : 1
  }
  , { unique : true }
)

module.exports = LinkSchema