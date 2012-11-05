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

BinSchema.index(
  { 
    parent : 1
    , name: 1
    , owner : 1
  }
  , { unique : true }
);

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
  var bins = []
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
      if(bin) bins.push(bin)
      if(!path || path.length === 1 || !bin) return cb(null, bin, bins)
      path.shift()
      return next(path, bin, cb)
    })

    function next(path, bin, cb){
      Bin.findOne({
        name : path[0].toLowerCase()
        , parent : bin
      }, function(err, bin){
        if(err) return cb(err)
        if(bin) bins.push(bin)
        if(path.length === 1 || !bin) return cb(null, bin, bins)
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
  var bins = []
  
  if(path==='/') return cb(null,null)
  path = path.split('/')
  if(path[0]==='') path.shift()
  if(path.length === 1 && !opts.owner) return cb(new Error('Cannot create root bin using '
    + 'ensureExists'))
  
  // make sure the root bin exists without also trying to create it. this 
  // `ensureExists` is not responsibe for creating root bins (like root user 
  // or anounymous bins)
  Bin.findOne({
    name : !!opts.owner ? null : path[0]
    , sessionID : opts.sessionID
    , owner : opts.owner
    , parent : { $exists : false }
  }, function(err, bin) {
    if(err) return cb(err)
    if(!bin) return cb(new Error('The root bin needs to exists first'))
    // a root user bin doesnt have a name
    if(!opts.owner){
      path.shift()
      bins.push(bin)
    }
    return next(path, bin, cb)
  })
  
  function next(path, bin, cb){
    opts.name = path[0]
    opts.parent = bin._id
    opts.public = bin.public
    ensureBinExists(opts, function(err, bin){
      if(err) return cb(err)
      if(!bin) return cb(new Error("Unable to create bin with `ensureBinExists`"
        + " in Bin model"))
      bins.push(bin)
      if(path.length === 1) return cb(null, bin, bins)
      path.shift()
      // recurse!
      return next(path, bin, cb)
    })
  }
  
  function ensureBinExists(opts, cb){
    
    var query = {}, set = _.extend({},opts)
    
    if(opts.name){
      query.name = opts.name.toLowerCase()
    }else{
      // it is possible to ensure a bin without a name exists if the owner
      // attribute is present which indicates a root bin
    }
    
    if(opts.parent){
      query.parent = opts.parent
    }else{
      // a root bin won't have a parent
    }
    
    if(!query.parent && !query.name) return cb(new Error('cant query bin '
      + 'without a parent or name'))
    
    Bin.findOne(query,function(err,bin){
      if(err) return cb(err)
      if(bin) return cb(null,bin)
      bin = new Bin(opts)
      bin.save(function(err){
        if(err) return cb(err)
        else return cb(null,bin)
      })
    })
    // 
    // Bin.findOneAndUpdate(
    //   // query
    //   query
    //   // update
    //   , {
    //     $set : query
    //   }
    //   // options. create it if it doesn't already exist
    //   , { upsert : true }
    //   , function(err,bin){
    //     if(err) return cb(err)
    //     if(!bin) return cb(new Error('findOneAndUpate did not return a bin when upsert was provided'))
    //     console.log(bin)
    //     if(typeof bin.__v === 'undefined' ){
    //       // this bin was just created. make sure we set any new fields
    //       console.log('this bin didnt exist before')
    //       console.log(set)
    //       _.extend(bin,set)
    //       bin.increment()
    //       bin.save(function(err){
    //         if(err) return cb(err)
    //         return cb(null,bin)
    //       })
    //     }else return cb(null,bin)
    //   })
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

BinSchema.methods.removeLinkById = function(id){
  this.links = _.filter(this.links,function(link){
    return link.id !== id
  })
  return this
}

BinSchema.methods.renameLinkById = function(id, name){
  _.any(this.links, function(link){
    if(link.id === id){
      link.title = name
      return true // sort circuit
    }
  })
  return this
}

BinSchema.methods.getChildren = function(cb){
  // escape regex characters
  Bin.find({ parent : this })
    .limit(config.maxChildBins)
    .sort({ 
      name : 'asc'
      , test : -1 
    })
    .exec(cb)
}

var Bin = module.exports = mongoose.model('Bin', BinSchema)