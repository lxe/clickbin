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
    , uri  = opts.uri
    , bins = opts.bins
  
  function isBinOwner(bin){
    return req.session 
      && req.session.user 
      // we're the user for this subdomain
      && req.session.user.username === username 
      && bin
      // and we own the bin
      && bin.owner
      && bin.owner.toString() === req.session.user._id
  }
  
  function isBinRootOwner(){
    return req.session
      && req.session.user 
      && req.session.user.username === username
  }
  
  function errorUserNoBin(req,res){
    req.session.flash.error = username + " doesn't have a bin with "
      + "that name."
    return res.redirectToProfile(username)
  }
  
  // show the user `root` bin. aka, their profile page
  if(path === '/' && !uri){
    return render([])
  } else if(!uri) {
    res.send('user requested a tag path')
  } else if(uri) {
    // add a link to a users bin
    res.send('adding a link to a tag not yet implemented')
  }

  // show the user bin page

  function render(tags) {
    // meanhile, in russia
    User.findOne({
      username : username
    }, function(err,user){
      if(err) return next(err)
      if(!user) return res.send(404)
      console.log('tags: ' + tags)
      user.getLinks(tags, function(err,links){
        if(err) return next(err)
        return res.render('user', {
          title : user.username + '.' + config.domain + path
          , links : links
          , profile : {
            username : user.username
          }
        })
      })
    })
  }

  // add the link to a user bin

  function addLinkToUserBin(path, uri, bin) {
    Link.scrape(uri, function(err, link) {
      if(err) return cb(err)
      if(bin.addLink(link)) return bin.save(function(err) {
        if(err) return next(err)
        return res.redirect(path)
      })
      else {
        // the link already exists
        req.session.flash.error = 'This bin already has that link'
        return res.redirect(path)
      }
    })
  }
}