var _         = require('underscore')
  , mongoose  = require('mongoose')
  , Db = require('mongodb').Db
  , Server = require('mongodb').Server
  , ObjectID = require('mongodb').ObjectID
  , Tag = require('../models/tag')
  , Link = require('../models/link')
  , config = require('../config')
  , client = new Db(config.dbName, new Server('127.0.0.1', 27017, {}))


client.open(function(err, client){
  if(err) throw err
  mongoose.connect(config.mongoPath)
  mongoose.connection.on('open', function() {
    console.log('connected to mongoose')
    Tag.collection.drop()
    client.collection('links', function(err, col){
      if(err) throw err
      var cursor = col.find({})
      function next(){
        cursor.nextObject(function(err,doc){
          if(err) throw err
          if(!doc) process.exit()
          var changes = {}
          _.each(doc.tags, function(tag){ 
            changes[tag] = {
              count : 1 
              , publicCount :  ( (doc.public) ? 1 : 0 )
            }
          })
          Tag.updateUserTags(doc.owner, changes, next)
        })
      }
      next()
    })
  })
})