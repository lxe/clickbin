/**
 * for processing requests for user subdomains.
 * ie., `username.clickb.in`
 */

var Link = require('../models/link')
  , User = require('../models/user')
  , config = require('../config')
  , _ = require('underscore')


module.exports = function(req, res, next, opts) {
  // this route is called from the `path` route. the path route first parses out
  // the following parameters and gives it to us via the `opts` object above
  var username = opts.username
    , path = opts.path || '/'
    , link  = opts.link
    , tags = opts.tags
  
  if(link){
    // add a new link with the provided tags
    if(req.session.user.username === username){
      Link.scrape(link.href, function(err, scrappedLink){
        if(err) return next(err)
        var link = new Link({
          tags : tags
          , url : opts.link.href
          , owner : req.session.user._id
        })
        scrappedLink = scrappedLink.toObject()
        delete scrappedLink._id
        _.extend(link,scrappedLink)
        link.save(function(err){
          if(err) return next(err)
          return res.redirect('/' + tags.join('/'))
        })
      })
    }else{
      return next(new Error("You cant tag links for other users."))
    }
  }else{
    if(tags && tags.length){
      Link.find({ 
        tags : tags 
        , owner : req.session.user._id
      }, function(err,links){
        if(err) return next(err)
        return render(tags,links)
      })
    }else{
      User.findOne({
        username : username
      }, function(err,user){
        if(err) throw err
        if(!user) return res.send(404)
        Link.find({
          owner : user._id
        }, function(err, links){
          if(err) return next(err)
          return render([], links)
        })
      })
    }
  }

  // show the user bin page

  function render(tags,links) {
    if(!tags) tags = []
    if(!links) links = []
    // meanhile, in russia
    User.findOne({
      username : username
    }, function(err,user){
      if(err) return next(err)
      if(!user) return res.send(404)
      user.getLinks(tags, function(err,links){
        if(err) return next(err)
        
        tags.sort()
        path = '/' + tags.join('/')
        if(path.length > 1) path += '/'
        
        tags = _.object(_.map(tags, function(tag){
          return [tag, true]
        }))
        
        return res.render('user', {
          title : user.username + '.' + config.domain + path
          , links : links
          , tags : tags
          , path : path
          , authorizedUser : req.session.user && user._id.toString() === req.session.user._id
          , profile : {
            username : user.username
          }
        })
      })
    })
  }
}