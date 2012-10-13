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
  }
  , mime : {
    type : String
    , required : false
  }
})

module.exports = LinkSchema