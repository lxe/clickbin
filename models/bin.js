var _       = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')

// design cools. simplicity and easiness should be priority #1 even over performance
// a bin should be able to be removed simply by removing the document from the db

var BinSchema = new Schema({
  // is this bin publicically accessible by anyone?
   public : {
    type : Boolean
    , required : true
    , default : true
  }
  , created : {
    type : Date
    , default : Date.now
    , index : true
  }
  , links : [LinkSchema]
  , owner : {
    type : Schema.Types.ObjectId
    , required : false
    , default : null
    , index : true
  }
  // if a bin doesnt have a parent, its a detached bin
  // the only bin that should not have a parent, is the root bin?
  , parent : {
    type: Schema.Types.ObjectId
    , index : true
  }
  // used for anounymous bins
  // `sessionID` should not be set if `owner` is set
  , sessionID : String
  , name : {
    type : String
    , required : true
  }
}, { strict: true })

BinSchema.statics.findUserBin = function(username,path,cb){
  if(!cb){
    cb = path
    path = '/'
  }
  if(path==='') path = '/'
  return Bin.findOne({path:username + ':' + path },cb)
}

BinSchema.methods.getParent = function(cb){
  if(!this.parent) return cb(null,null)
  Bin.findOne({_id:this.parent},cb)
}

BinSchema.statics.getByPath = function(path,cb){
  if(path==='/') return cb(null,null)
  path = path.split('/')
  if(path[0]==='') path.shift()
  // find the root bin
  Bin.findOne({
    name : path[0] 
    , parent : { 
      $exists : false
    }
  }, function(err, bin) {
    if(err) return cb(err)
    if(path.length === 1 || !bin) return cb(null,bin)
    path.shift()
    return next(path,bin,cb)
  })
  
  function next(path, bin, cb){
    Bin.findOne({
      name : path[0]
      , parent : bin
    }, function(err, bin){
      if(err) return cb(err)
      if(path.length === 1 || !bin) return cb(null, bin)
      path.shift()
      // recurse!
      return next(path,bin,cb)
    })
  }
}

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