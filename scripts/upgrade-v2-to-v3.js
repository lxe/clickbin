
var Db = require('mongodb').Db
    , Server = require('mongodb').Server
    , ObjectID = require('mongodb').ObjectID
    , util = require('util')
    , _ = require('underscore')

// the old database
var client = new Db('clickbin-v2', new Server('127.0.0.1', 27017, {}))

var mongoose = require('mongoose')
// the new database
var db = mongoose.connect('localhost', 'clickbin-v3')
var User = require('../models/user')
var Link = require('../models/link')
var Counter = require('../models/counter')

Counter.collection.drop()
Link.collection.drop()
User.collection.drop()

function getTags(col, doc, cb, tags){
  if(!tags){
    if(doc.name) tags = [doc.name.toString()]
    else doc.name = []
  }
  if(doc && doc.parent){
    col.findOne({ _id : doc.parent  } , function(err, parent) {
      if(err) return cb(err)
      if(parent && parent.name) tags.push(parent.name.toString())
      return getTags(col, parent, cb, tags)
    })
  }else return cb(null, tags)
}

client.open(function (err, client) {
  if(err) throw err
  console.log('conveting `counters` collection...')
  client.collection('counters', function(err, col){
    if(err) throw err
    var cursor = col.find({})
    function next(){
      cursor.nextObject(function(err,doc){
        if(err) throw err
        if(doc){
          var counter = new Counter(doc)
          counter.save(function(err){
            if(err) throw err
            next()
          })
        }else users()
      })
    }
    next()
  })
  
  function users(){
    console.log('converting `users` collection...')
    client.collection('users', function(err, col){
      if(err) throw err
      var cursor = col.find({})
      function next(){
        cursor.nextObject(function(err, doc){
          if(err) throw err
          if(doc){
            var user = new User(doc)
            user.save(function(err){
              if(err) throw err
              next()
            })
          }else bins()
        })
      }
      next()
    })
  }
  
  function bins(){
    console.log('converting `bins` collection...')
    client.collection('bins',function(err,col){
      if(err) throw err
      var cursor = col.find({})
      cursor.sort({owner:1})
      function next(){
        //console.log('\tnext bin...')
        cursor.nextObject(function(err,doc){
          if(err) throw err
          if(doc){
            // if(doc.name) console.log('\t process bin: ' + doc.name)
            // else console.log('\t processing user root bin')
            if(!doc.owner) return process.nextTick(next)
            
            getTags(col, doc, function(err, tags){
              if(err) throw err
              //if(tags && tags.length) console.log('tags: ' + tags + ' owner : ' + doc.owner)
              
              var count = 0
              if(doc.links) count = doc.links.length
                
              _.each(doc.links,function(link){
                console.log('link')
                console.log('tags: ' + tags)
                console.log('typeof tags: ' + (tags instanceof Array) )
                console.log(link)
                link = new Link({
                  title : link.title
                  , desc : link.desc
                  , icon : link.icon
                  , url : link.url
                  , mime : link.mime
                  , created : link.created
                  , tags : tags
                  , owner: doc.owner
                  , votes : 0
                  , clicks : 0
                  , anonymous : false
                  , public : doc.public
                })
                console.log(link)
                link.save(function(err){
                  if(err){
                    throw err
                  }
                  count--
                  done()
                })
              })
              
              if(count === 0) done()
              
              function done(){
                if(count === 0) process.nextTick(next)
              }
            })
          }else process.exit()
        })
      }
      next()
    })
  }
})