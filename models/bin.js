var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var BinItem = new Schema({
  type : {
    type : String
    , required : true
    , default : 'bin' // possible values: 'bin', link'
  }
  , name : {
    type : String
    , required : true
  }
  // only necessary for bin items of type link
  , url : {
    type : String
    , required : false
  }
})

var BinSchema = new Schema({
  name : {
    type : String
    , unique : true
    , required : true
  }
  , public : {
    type : Boolean
    , required : true
    , default : true
  }
  , contents : [BinItem]
})

module.exports = mongoose.model('Bin', BinSchema)