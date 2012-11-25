/**
 * for processing requests for user subdomains.
 * ie., `username.clickb.in`
 */

var Link = require('../models/link')
  , User = require('../models/user')
  , config = require('../config')
  , mongoose = require('mongoose')
  , _ = require('underscore')


module.exports = function(req, res, next, opts) {
  // this route is called from the `path` route. the path route first parses out
  // the following parameters and gives it to us via the `opts` argument
  var username = opts.username
    , path = opts.path || '/'
    , link  = opts.link
    , tags = opts.tags
    , page = opts.page || 0
    , tagPath = opts.tagPath || '/'
  
  // if the user is logged in but the user subdomain wasn't in the request,
  // redirect to the user subdomain
  if(!username){
    return res.redirectToProfile(req.session.user.username, opts.path)
  }
  
  var isOwner = req.session.user && req.session.user.username === username
  
  // add a new link with the provided tags
  if(link){
    // check that we're the owner of the subdomain
    if(isOwner){
      Link.scrape(link.href, function(err, scrappedLink){
        if(err) return next(err)
        var link = new Link({
          tags : tags
          , url : opts.link.href
          , owner : req.session.user._id
        })
        scrappedLink = scrappedLink.toObject()
        delete scrappedLink._id
        scrappedLink.tags = _.union(scrappedLink.tags,link.tags)
        _.extend(link,scrappedLink)
        link.save(function(err){
          if(err && err.code === 11000) console.log(err)
          if(err) return next(err)
          return res.redirect('/' + tags.join('/'))
        })
      })
    }else{
      return next(new Error("You can't tag links for other users."))
    }
  }else{
    console.log('otps: ')
    console.log(opts)
    if(!tags) tags = []
    User.findOne({
      username : username
    }, function(err,user){
      if(err) return next(err)
      if(!user) return next(new Error("Ther's no user with that name"))
      var query = user.getLinks(tags, isOwner)
      query.count(function(err, numLinks){
        if(err) return next(err)
        var query = user.getLinks(tags, isOwner)
        query.limit(20).skip(page * 20)
        query.exec(function(err,links){
          
          if(err) return next(err)
          tags.sort()
          path = '/' + tags.join('/')
          if(path.length > 1) path += '/'

          tags = _.object(_.map(tags, function(tag){
            return [tag, true]
          }))
          
          if(tagPath !== '/') tagPath += '/'
          var lastPage = Math.floor( numLinks / 20 )
          
          return res.render('user', {
            title : user.username + '.' + config.domain + path
            , numLinks : numLinks
            , page : page
            , links : links
            , tags : tags
            , prevPage : (page > 0) ? tagPath + (page - 1) : null
            , nextPage : (page < lastPage) ? tagPath + (page + 1) : null
            , path : path
            , authorizedUser : req.session.user && user._id.toString() === req.session.user._id
            , profile : {
              username : user.username
            }
          })
        })
      })
    })
  }
}