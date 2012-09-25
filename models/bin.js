var mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')

var BinSchema = new Schema({
  path : {
    type : String
    , unique : true
    , required : true
    , index : true
  }
  , public : {
    type : Boolean
    , required : true
    , default : true
  }
  , links : [LinkSchema]
})

module.exports = mongoose.model('Bin', BinSchema)