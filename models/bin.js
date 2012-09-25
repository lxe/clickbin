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


BinSchema.virtual('title').get(function(){
  var path = this.path.split('/')
    , name = path[path.length - 1]
  //return name[0].toUpperCase() + name.substring(1) // camle case?
  return name
})
BinSchema.virtual('parent').get(function(){
  var path = this.path.split('/')
  if(path.length>1) return path[path.length - 2]
  else return null
})

BinSchema.methods.addLink = function(link){
  if( _.any(this.links,function(link_){ return (link_.uri === link.uri) }) )
    // the link is already in this bin
    return false
  else return !!this.links.push(link)
}

module.exports = mongoose.model('Bin', BinSchema)