var mongoose = require('mongoose')
  , Schema = mongoose.Schema

var LinkSchema = new Schema({
  uri : {
    type : String
    , unique : true
    , required : true
  }
})

module.exports = mongoose.model('Link', LinkSchema)