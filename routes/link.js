
var Link = require('../models/link')
  , User = require('../models/user')
  , _ = require('underscore')
  , config = require('../config')

module.exports = function(app){
  app.get('/_/link/:linkID/remove', function(req, res, next){
    if(!req.session.user) 
      // the user is not logged in
      return res.redirect('back')
    Link.findOne({
      _id : req.params.linkID
      , owner : req.session.user._id
    }, function(err, link){
      if(err || !link) return res.redirect('back')
      var tag_changes = link.getTagChanges([])
        , owner = link.owner
      link.remove(function(err){
        if(err) return next(err)
        User.updateTagCount( owner, tag_changes, function(err){
          if(err) return next(err)
          return res.redirect('back')
        })
      })
    })
  })
  
  app.get('/_/link/:linkID/update', function(req, res, next){
    if(!req.session.user) return res.redirect('back')
    var tags = req.query.tags
      , title = req.query.title
      , public = req.query.public
      , update = {}
    
    // console.log('query')
    // console.log(req.query)
    
    if(tags){
      try{
        tags = JSON.parse(tags)
      }catch(e){
        console.error('tag format issue')
        return res.redirect('back')
      }
    }
    
    if(tags && !(tags instanceof Array) ){
      console.error('tags not array when updating link')
      return res.redirect('back')
    }
    
    var invalidTag = _.find(tags, function(tag){
      return !tag.match(config.tagNameRegexp)
    })
    if(invalidTag)
      return next(new Error('invalid tag name: ' + invalidTag))
    
    if(title && typeof title !== 'string' ){
      console.error('title not string hwne updating link')
      return res.redirect('back')
    }
    
    if(public){
      public = (public === 'true')
      req.session.flash.success = 'The link was made ' + ( (public) ? 'public' : 'private' )
    }
    else public = undefined
    
    Link.findOne({
      _id : req.params.linkID
      , owner : req.session.user._id
    }, function(err,link){
      if(err || !link){
        console.error('error or missing when updating link')
        return res.redirect('back')
      }
      
      if(title) link.title = title
      var tag_changes = null
      if(tags){
        tag_changes = link.getTagChanges(tags)
        link.tags = tags
      }
      if( public !== undefined ) link.public = public
      link.save(function(err, link){
        if(err) return next(err)
        if(!link) return res.redirect('back')
        // the tags didn't change
        if(!tag_changes) return res.redirect('back')
        
        User.updateTagCount( link.owner, tag_changes, function(err){
          if(err) return next(err)
          return res.redirect('back')
        })
      })
    })
  })
}