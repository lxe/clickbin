var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var LinkSchema = new Schema({
  title : {
    type : String
    , required : true
  }
  , icon : {
    type : String
    , required : true
    , default : null
  }
  , url : {
    type : String
    , required : true
  }
})

module.exports = LinkSchema