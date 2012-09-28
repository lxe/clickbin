var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var LinkSchema = new Schema({
  title : {
    type : String
    , required : false
  }
  , icon : {
    type : String
    , required : false
    , default : null
  }
  , url : {
    type : String
    , required : true
  }
})

module.exports = LinkSchema