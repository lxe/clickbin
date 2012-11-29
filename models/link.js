var _ = require('underscore')
  , util = require('util')
  , mongoose = require('mongoose')
  , Schema = mongoose.Schema
  , LinkCache = require('./linkcache')


var LinkSchema = new Schema({
  title : {
    type : String
    , required : false
  }
  , desc : {
    type : String
    , required : false
  }
  // the path to the image
  , icon : {
    type : String
    , required : false
    , default : null
  }
  , url : {
    type : String
    , required : true
    , index : true
  }
  , mime : {
    type : String
    , required : false
  }
  , created : {
    type : Date
    , default : Date.now
    , index : true
  }
  , tags : {
    type : [String]
    , default : []
    , index : true
  }
  , owner : {
    type : Schema.Types.ObjectId
    , required : false
    , index : true
  }
  , votes : {
    type : Number
    , required : true
    , default : 0
  }
  , clicks : {
    type : Number
    , required : true
    , default : 0
  }
  , anonymous : {
    type : String
    , required : false
  }
  , public : {
    type : Boolean
    , required: true
    , default : true
  }
}, { strict : true })


LinkSchema.index(
  { 
    owner : 1
    , url : 1
  }
  , { unique : true }
)


LinkSchema.statics.scrape = function(url,cb){
  LinkCache.scrape(url,cb)
}

LinkSchema.statics.getUserLinks = function(user, tags, includePrivate, cb){
  
  if(!util.isArray(tags)) tags = [tags]
  else if(!tags) tags = []
  
  var query = Link.find() //.where('owner').equals(user._id)
  if(tags.length){
    query.and(
      _.map(tags, function(tag){
        return { tags : tag }
      })
    )
  }
  query.where('owner',user._id)
  if(!includePrivate) query.where('public',true)
  //query.limit(100)
  query.sort('field -created')
  if(cb) query.exec(cb)
  else return query
}

function XOR(a,b) {
  return ( a || b ) && !( a && b )
}

LinkSchema.methods.getTagChanges = function(tags){
  var tag_changes = {}
  tags = _.uniq(tags)
  
  if( this.public === undefined ) this.public = true
  console.log('tags added: ' + tags)
  console.log('existing tags: ' + this.tags)
  var old_tags = this.tags
    , is_public = this.public
    , changed_public = this.isModified('public')
    , was_public = XOR(changed_public, is_public)
  console.log('was the link public? ' + was_public)
  console.log('was `public` modified: ' + changed_public)
  console.log('is the link public? ' + is_public)
  
  _.each(tags, function(tag){
    if(!_.contains(old_tags, tag)){
      // `tag` is a new tag being added to this link
      if(!tag_changes[tag]) tag_changes[tag] = {}
      tag_changes[tag].count = 1
    }
  })
  
  _.each(old_tags, function(tag){
    if(!tag_changes[tag]) tag_changes[tag] = {}
    if(!_.contains(tags, tag)){
      // `tag` is an old tag being removed from this link
      tag_changes[tag].count = -1
    }else{
      // `tag` is an existing tag that hasn't changed with this update
      tag_changes[tag].count = 0
    }
  })
  
  _.each( tag_changes, function(change, tag){
    if(change.count >= 1){
      // we're adding this tag
      if(is_public){
          // the tag was added to a public link
          change.publicCount = 1
      }else{
        // the tag was added to a private link
        change.publicCount = 0
      }
    }else if(change.count === 0){
      // we didnt add or remove this tag but we made the link public or private
      if(changed_public){
        if(is_public){
          // changed the link to public
          change.publicCount = 1
        }else{
          // changed the link to private
          change.publicCount = -1
        }
      }else{
        // we didn't add or remove this tag nor did this links public status 
        // change
      }
    }else if(change.count <= -1){
      // we're removing this tag
      if(was_public){
        change.publicCount = -1
      }else{
        change.publicCount = 0
      }
    }
    // there's no point in updating a tag that hasn't changed
    if(change.publicCount === 0 && change.count === 0)
      delete tag_changes[tag]
  })
  console.log('tag_changes')
  console.log(tag_changes)
  return tag_changes
}

LinkSchema.methods.save = function(cb){
  if(cb){
    var old_cb = cb
    cb = function(err, doc){
      if(err && err.code === 11000) return cb(new Error("You already have that link"))
      else return old_cb(err,doc)
    }
  }
  return mongoose.Model.prototype.save.call(this,cb)
}

var Link = module.exports = mongoose.model('Link', LinkSchema)