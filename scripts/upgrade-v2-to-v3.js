
var Db = require('mongodb').Db
    , Server = require('mongodb').Server
    , ObjectID = require('mongodb').ObjectID
    , util = require('util')

// the old database
var client = new Db('clickbin-v2', new Server('127.0.0.1', 27017, {}))

var mongoose = require('mongoose')
// the new database
var db = mongoose.connect('localhost', 'clickbin-v3')
var User = require('../models/user')
var Link = require('../models/link')
var Counter = require('../models/counter')

Counter.collection.drop()

function getTags(col, doc, cb, tags){
  if(!tags) tags = [doc.name]
  if(doc && doc.parent){
    col.findOne({ _id : doc.parent  } , function(err, parent) {
      if(err) return cb(err)
      if(parent) tags.push(parent.name)
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
            counter.save(function(err){
              if(err) throw err
              next()
            })
          })
        }else bins()
      })
    }
    next()
  })
  
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
            getTags(col, doc, function(err, tags){
              if(err) throw err
              if(tags && tags.length) console.log('tags: ' + tags + ' owner : ' + doc.owner)
              process.nextTick(next)
            })
          }else process.exit()
        })
      }
      next()
    })
  }
})