var _ = require('underscore')
  , async = require('async')
  , config = require('../config')
  , mongo = require('mongoose')
  , User = require('../models/user')
  , Bin = require('../models/bin')
  , Link = require('../models/link')
  , pathCommand = require('../controllers/path-command')
  , users = require('./example-users.json')


mongo.connect(config.mongoPath)
mongo.connection.on('open', function() {
  var cbs = []
  _.each(users,function(user){
    cbs.push(function(done){
      var new_user = new User({
        username : user.username
        , password : user.password
      })
      new_user.save(function(err){
        //if(err) return done()
        if(err) console.error(err)
        var username = user.username
        // save the root bin
        var bin = new Bin({ path : user.username + ':/' })
        // create the root bin
        bin.save(function(err){
          //if(err) throw err
          if(err) console.error(err)
          var cbs = []
          _.each(user.links,function(link){
            cbs.push(function(done){
              console.log('link: '+link)
              var command = pathCommand(link)
              if(command.path===undefined) command.path = '/'
              if(command instanceof Error) throw command
              var path = command.path
                , uri = command.uri
              Bin.findUserBin(user.username, path, function (err, bin) {
                if(err) throw err
                if(!bin){
                  // we need to create the bin
                  Link.scrape(uri,function(err,link){
                    if(err) return next(err)
                    var bin = new Bin({
                      path : username + ':' + path
                      // since the bin deosnt exist yet, this has got to be the first link
                      , links : [link]
                    })
                    bin.save(function(err){
                      if(err) return next(err)
                      return done()
                    })
                  })
                }else{
                  // the bin already exists, so add the link to it
                  Link.scrape(uri, function (err, link) {
                    if (err) throw err
                    else if (bin.addLink(link)) 
                      return bin.save(function(err) {
                        if(err) throw err
                        return done()
                      }) 
                    else{
                      console.error('bin already has link: '+link)
                      return done()
                    }
                  })
                }
              })
            })
          })
          async.series(cbs,function(err){
            if(err) throw err
            console.log('added links for user: ' + username)
            return done()
          })
        }) // end `bin.save`
      })
    })
  })
  async.series(cbs,function(err){
    if(err) throw err
    console.log("done!")
    mongo.disconnect()
  })
})