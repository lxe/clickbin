var _       = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')

var BinSchema = new Schema({
  path : {
    type : String
    , unique : true
    , required : true
    , index : true
  }
  // is this bin publicically accessible by anyone?
  , public : {
    type : Boolean
    , required : true
    , default : true
  }
  , sessionID : {
      type : String
      , unique : false
      , required : false
      , default : null
  }
  , created : {
    type : Date
    , default : Date.now
  }
  , links : [LinkSchema]
})

BinSchema.statics.findUserBin = function(username,path,cb){
  if(!cb){
    cb = path
    path = '/'
  }
  if(path==='') path = '/'
  return Bin.findOne({path:username + ':' + path },cb)
}


BinSchema.virtual('title').get(function(){
  var path = this.path.split('/')
    , name = path[path.length - 1]
  //return name[0].toUpperCase() + name.substring(1) // camle case?
  return name
})
BinSchema.virtual('parent').get(function(){
  console.log('this.path: '+this.path)
  var path = this.pathWithoutUsername().substr(1).split('/')
  console.log('path: '+path)
  var username = this.username
  console.log('username: '+this.username)
  console.log('path[path.length-2]: '+path[path.length - 2])
  if( !username && path.length > 1 || path.length > 2){
    path.pop()
    return '/' + path.join('/')
  }else if(username && path.length === 1){
    if(path.length === 1) return '/'
  }
  else return null
})

/**
  * Just get the actual path, without the user prefix
  */
BinSchema.methods.pathWithoutUsername = function(){
  var path = this.path.split(':')
  return path[path.length-1]
}

BinSchema.virtual('username').get(function(){
  var path = this.path.split(':')
  if(path.length>1) return path[0]
  else return null
})

BinSchema.methods.addLink = function(link){
  if( _.any(this.links,function(link_){ return (link_.url === link.url) }) )
    // the link is already in this bin
    return false
  else return !!this.links.push(link)
}

BinSchema.methods.removeLinkById = function(linkID){
  console.log('remove link by id: '+linkID)
  this.links = _.filter(this.links,function(link){
    return link.id !== linkID
  })
  return this
}

BinSchema.methods.getChildren = function(cb){
  // escape regex characters
  var path = this.path.replace(/[#-.]|[[-^]|[?|{}]/g, '\\$&')
  var regex = '^' + path + '/[^/]+$'
  regex = regex.replace('//','/')
  Bin.find({path:new RegExp(regex)},cb)
}

var Bin = module.exports = mongoose.model('Bin', BinSchema)