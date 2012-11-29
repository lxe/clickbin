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
      User.scrapeLink(req.session.user._id, link.href, tags, function(err, link){
        if(err) return next(err)
        req.session.flash.success = 'Saved link ' + link.url
        return res.redirect('/' + tags.join('/'))
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
      if(!user){
        if(req.session.user && username === req.session.user.username){
          req.session.user = null
        }
        return next(new Error("Ther's no user with that name"))
      }
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

          tagsHash = _.object(_.map(tags, function(tag){
            return [tag, true]
          }))
          
          if(tagPath !== '/') tagPath += '/'
          var lastPage = Math.floor( (numLinks-1) / 20 )
          
          // when to page with no links
          if(!links.length && page !== 0){
            if(req.session) req.session.flash.error = "There are no more pages "
              + "for this tag"
            return res.redirect(path)
          }
          
          if(!links.length && !isOwner){
            if(tags.length){
              if(req.session) req.session.flash.error = user.username 
                + " has no links those tags"
              return res.redirectToProfile(username)
            }else{
              if(req.session) req.session.flash.error = user.username 
                + " doesn't have any public links"
            }
          }
          
          var authorizedUser = req.session.user 
            && user._id.toString() === req.session.user._id
          
          var query = user.getTopTags()
          if(!authorizedUser) query.where('public', true)
          query.limit(20)
          query.exec(function(err,tags){
            if(err) return next(err)
            return res.render('user', {
              title : user.username + '.' + config.domain + path
              , numLinks : numLinks
              , page : page
              , links : links
              , tags : tags
              , tagHash : tagsHash
              , numPages : lastPage + 1
              , prevPage : (page > 0) ? tagPath + (page - 1) : null
              , nextPage : (page < lastPage) ? tagPath + (page + 1) : null
              , path : path
              , authorizedUser : authorizedUser
              , profile : {
                username : user.username
              }
              , user : user
            })
          })
        })
      })
    })
  }
}