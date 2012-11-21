
var Link = require('../models/link')
  , User = require('../models/user')

module.exports = function(app){
  app.get('/_/link/:linkID/remove', function(req, res, next){
    if(!req.session.user) 
      // the user is not logged in
      return res.redirect('back')
    Link.findOne({
      _id : req.params.linkID
      , owner : req.session.user._id
    }).remove()
    res.redirect('back')
  })
  
  app.get('/_/link/:linkID/update', function(req, res, next){
    if(!req.session.user) return res.redirect('back')
    var tags = req.query.tags
      , title = req.query.title
      , update = {}
    
    // console.log('query')
    // console.log(req.query)
    
    try{
      tags = JSON.parse(tags)
    }catch(e){
      console.error('tag format issue')
      return res.redirect('back')
    }
    
    if(tags && !(tags instanceof Array) ){
      console.error('tags not array when updating link')
      return res.redirect('back')
    }
    console.log('title: ' + title)
    if(title && typeof(title) !== 'string' ){
      console.error('title not string hwne updating link')
      return res.redirect('back')
    }
    
    Link.findOne({
      _id : req.params.linkID
      , owner : req.session.user._id
    }, function(err,link){
      if(err || !link){
        console.error('error or missing when updating link')
        return res.redirect('back')
      }
      console.log('title')
      console.log('tags: ' + tags)
      if(title) link.title = title
      if(tags) link.tags = tags
      link.save()
      return res.redirect('back')
    })
  })
}