
var Db = require('mongodb').Db;
var Server = require('mongodb').Server;
var util = require('util')

var client = new Db('clickbin', new Server('127.0.0.1', 27017, {}));

var mongoose = require('mongoose')
var db = mongoose.connect('localhost', 'clickbin-v2');
var Bin = require('../models/bin')
var User = require('../models/user')
var Link = require('../models/link')
var Counter = require('../models/counter')

function username(path){
  var m = path.match(/([^\/]+):(.*)/)
  if(m) return m[1]
  else return null
}

function binName(path){
  if(path==='/') return null
  var path = realPath(path).split('/')
  var name = path[path.length-1]
  return name
}

function realPath(path){
  var m = path.match(/([^\/]+):(.*)/)
  if(m) return m[2]
  else return path
}

function getParent(owner, path, cb){
  if(path==='/') path = []
  else path = path.split('/')
  if(path.length && path[0]==='') path.shift()
  var name = null
  // remove our name from the path
  if(path.length) name = path.pop()
  
  path = '/' + path.join('/')
  console.log('getting parent at path: ' + path)
  return Bin.getByPath(owner, path, cb)
}

client.open(function (err, client) {
  if(err) throw err;
  
  client.collection('users',function(err,col){
    console.log('converting users...')
    if(err) throw err
    var cursor = col.find({})
    cursor.sort({username:1})
    function next(){
      cursor.nextObject(function(err,doc){
        if(err) throw err
        if(doc){
          var user = new User({
            username : doc.username
            , email : doc.email
            , created : doc.created
            , active : doc.active
          })
          user.setValue('password',doc.password)
          user.setValue('salt',doc.salt)
          
          if(user.email === 'vicapowell39gmail.com' )
            user.email = 'vicapowell39@gmail.com'
          user.save(function(err){
            if(err){
              console.dir(user)
              throw err
            }
            next()
          })
        }else{
          var user = new User({
            username : 'yc'
            , password : 'mdifheddy yc'
          })
          user.save(function(err){
            if(err) throw err
            links()
          })
        }
      })
    }
    next()
  })
  
  function links(){
    console.log('converting links...')
    client.collection('links', function(err, col){
      if(err) throw err
      var cursor = col.find({})
      cursor.sort({url:1})
      function next(){
        cursor.nextObject(function(err,doc){
          if(err) throw err
          if(doc){
            var link = new Link(doc)
            link.save(function(err){
              if(err) throw err
              next()
            })
          }else counters()
        })
      }
      next()
    })
  }
  
  function counters(){
    console.log('conveting counters...')
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
  }
  
  function bins(){
    console.log('processing bins...')
    client.collection('bins',function(err,col){
      if(err) throw err
      var cursor = col.find({})
      cursor.sort({path:1})

      function next(){
        console.log('next')
        cursor.nextObject(function(err,doc){
          if(err) throw err
          if(doc){
            var owner = username(doc.path)
            console.log('process doc: ' + doc.path)
            console.log('\towner: ' + owner)
            if(!owner) return gotOwner()
            else{
              // go get the owner
              User.findOne({
                username : owner
              }, function(err,user){
                if(err) throw err
                if(!user) throw new Error('doc.path: ' + doc.path + ' has user ' 
                  + owner + ' but user document does not exist')
                console.log('got owner: ' + user.username)
                gotOwner(user._id)
              })
            }

            function gotOwner(owner){
              var path = realPath(doc.path)
              getParent(owner, path, function(err, parent){
                if(err) throw err
                if(!parent) console.log('no parent found for bin path : ' + path )
                else console.log('got parent at path: ' + path + ' with owner: ' + username(doc.path) )
                var bin = new Bin({
                  __v : doc.__v
                  , _id : doc._id
                  , links : doc.links
                  , public : !!doc.public
                  , sessionID : doc.sessionID
                })
                var name = binName(doc.path)
                console.log('bin name is : ' + name)
                if(name) bin.set('name', name)
                if(owner) bin.set('owner',owner)

                if(parent) bin.parent = parent
                console.log('saving bin...')
                bin.save(function(err){
                  if(err){
                    console.log('error for bin')
                    console.dir(bin)
                    throw err
                  }
                  console.log('bin is saved')
                  process.nextTick(next)
                })
              })
            }
          }else process.exit()
        })
      }
      next()
    })
  }
})