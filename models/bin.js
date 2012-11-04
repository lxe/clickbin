var _       = require('underscore')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkSchema = require('./schemas/link')
  , config = require('../config')

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
  // the user that owns this bin. if the bin doesnt have an owner, 
  // the bin is anounymous
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
    , required : false
    , set : function(name){
      if(!name) return name
      this.prettyName = name
      return name.toLowerCase()
    }
    , get : function(){
      return this.prettyName
    }
  }
  , prettyName : {
    type : String
    , required : false
  }
}, { strict: true })

// request for path /32/bin1/bin2
// query is made for first bin



BinSchema.methods.getParent = function(cb){
  if(!this.parent) return cb(null,null)
  Bin.findOne({_id:this.parent},cb)
}
/**
  * can optionally be called like: getByPath(path,cb)
  */
BinSchema.statics.getByPath = function(owner, path, cb) {
  if(!cb){
    // apply optional params
    cb = path
    path = owner
    owner = null
  }
  // get the user's objectId
  if(!owner) getBin(owner, path, cb)
  else if( typeof owner === 'string' ) {
    // query the user
    mongoose.model('User').findOne({
      username : owner
    }, function(err, owner){
      if(err) return cb(err)
      if(!owner) return cb(null,new Error('user ' + owner + ' doesnt exist'))
      return getBin(owner, path, cb)
    })
  }else if( owner instanceof mongoose.Types.ObjectId )
    return getBin(owner, path, cb)
  else return cb(new Error('username is not string or ObjectId in '
    + 'Bin.findUserBin'))
  
  // now that we have the user id, do the real work of getting the bin by its 
  // path
  function getBin(owner, path, cb) {
    if(path==='/') path = null
    if(path){ 
      path = path.split('/')
      if(path[0]==='') path.shift()
      if(path[path.length-1] === '') path.pop()
    }
    if(owner instanceof mongoose.Document) owner = owner._id
    // find the root bin and make sure the user owns it.
    var query = {
      name : path ? path[0].toLowerCase() : null
      , parent : { $exists : !!owner && !!path }
      , owner : owner
    }
    Bin.findOne(query, function(err, bin) {
      if(err) return cb(err)
      if(!path || path.length === 1 || !bin) return cb(null, bin)
      path.shift()
      return next(path, bin, cb)
    })

    function next(path, bin, cb){
      Bin.findOne({
        name : path[0].toLowerCase()
        , parent : bin
      }, function(err, bin){
        if(err) return cb(err)
        if(path.length === 1 || !bin) return cb(null, bin)
        path.shift()
        // recurse!
        return next(path, bin, cb)
      })
    }
  }
}

BinSchema.statics.ensureExists = function(opts, path, cb) {
  // `opts` is an optional param
  if(!cb){
    // apply optional params
    cb = path
    path = opts
    opts = {}
  }
  // shallow copy options
  opts = _.extend({},opts)
  
  
  if(path==='/') return cb(null,null)
  path = path.split('/')
  if(path[0]==='') path.shift()
  if(path.length === 1 && !opts.owner) return cb(new Error('Cannot create root bin using '
    + 'ensureExists'))
  
  // make sure the root bin exists
  Bin.findOne({
    name : !!opts.owner ? null : path[0]
    , sessionID : opts.sessionID
    , owner : opts.owner
    , parent : { $exists : false }
  }, function(err, bin) {
    if(err) return cb(err)
    if(!bin) return cb(new Error('The root bin needs to exists first'))
    if(!opts.owner) path.shift()
    return next(path, bin, cb)
  })
  
  function next(path, bin, cb){
    opts.name = path[0]
    opts.parent = bin._id
    ensureBinExists(opts, bin, function(err, bin){
      if(err) return cb(err)
      if(!bin) return cb(new Error("Unable to create bin with `ensureBinExists`"
        + " in Bin model"))
      if(path.length === 1) return cb(null,bin)
      path.shift()
      // recurse!
      return next(path, bin, cb)
    })
  }
  
  function ensureBinExists(opts, bin, cb){
    if(opts.name){
      opts.prettyName = opts.name
      opts.name = opts.name.toLowerCase()
    }
    Bin.findOneAndUpdate(
      // query
      opts
      // update
      , {
        $set : opts
      }
      // options. create it if it doesn't already exist
      , { upsert : true }
      , cb)
  }
}

BinSchema.virtual('name').set(function (name) {
  var parts = v.split(' ');
  this.name.first = parts[0];
  this.name.last = parts[1];
});

BinSchema.virtual('username').get(function(){
  throw new Error('Dont use the username property. use `owner` instead ')
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
  Bin.find({ parent : this }).limit(config.maxChildBins).exec(cb)
}

var Bin = module.exports = mongoose.model('Bin', BinSchema)