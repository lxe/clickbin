var request = require('request')
  , _ = require('underscore')
  , config = require('../config')
  , mongoose = require('mongoose')
  , Link = require('../models/link')
  , User = require('../models/user')
  , argv = require('optimist')
    .default('user','nodejs')
    .argv

mongoose.connect(config.mongoPath, function(err){
  if(err) throw err
  User.findOne({
    username : argv.user
  }, function(err, user){
    if(err) throw err
    if(!user) throw new Error("user '" + argv.user + "' not found")
    // remove the previous modules
    Link.remove({ 
      $and : [
        { tags : 'module' }
        , { tags : 'npm' }
      ]
    }).exec()
    request.get({ 
      url : 'http://isaacs.iriscouch.com/registry/_all_docs'
      , json : true
    }, function(err, res, body){
      if(err) throw err
      var ids = _.pluck(body.rows,'id')
      function next(){
        request.get({
          url : 'http://isaacs.iriscouch.com/registry/' + ids.shift()
          , json : true
        }, function(err, res, body){
          if(err) throw err
          var link = getLink(body)
          if(!link){
            if(ids.length) return next()
            else return
          }
          link = new Link(link)
          link.owner = user.id
          console.log(link)
          link.save(function(err){
            if(err) throw err
            if(ids.length) next()
          })
        })
      }
      next()
    })
  })
})


function getLink(body){
  try{
    var dist_tags = body['dist-tags']
    if(!dist_tags){
      console.error(body)
      console.error('no dist-tags attribute')
      return null
    }
    var latest = dist_tags.latest
    latest = body.versions[latest]
    var tags
    if(!latest) return null
    tags = latest.keywords
    if(!tags) tags = []
    tags.push('module')
    tags.push('npm')
    if(latest && latest._npmUser)
      tags.push('user ' + latest._npmUser.name)
  
    tags = _.uniq(_.filter(tags, function(tag){
      return tag.match(config.tagNameRegexp)
    }))
  
    tags = _.map(tags, function(tag){
      return tag.toLowerCase()
    })
  
    return {
      url : 'https://npmjs.org/package/' + body.name
      , title : latest.name
      , desc : latest.description
      , tags : tags
      , icon : '/_/images/thumbs/hostnames/npmjs.org.png'
    }
  }catch(e){
    console.error(e)
    return null
  }
}