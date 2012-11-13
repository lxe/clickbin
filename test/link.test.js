var should = require('should')
  , mongoose = require('mongoose')
  , Link = require('./../models/link')
  , User = require('./../models/user')

describe('Link', function(){
  before(function(done){
    mongoose.connect('localhost','test',function(err){
      should.not.exist(err)
      Link.collection.drop()
      User.collection.drop()
      done()
    })
  })
  describe('create', function(){
    it('should create a Link account', function(done){
      var link = new Link({
        title : 'hello world'
        , url : 'google.com'
        , tags : ['search']
      }).save(function(err){
        should.not.exist(err)
        done()
      })
    })
  })
  describe('search', function(){
    it('should grab the link by the tag', function(done){
      Link.find({
        tags : {
          $in : ['search','google']
        }
      },function(err,links){
        should.not.exist(err)
        should.exist(links)
        done()
      })
    })
  })
  describe('user link', function(){
    it('should get all the links for a user for a given tag', function(done){
      var user = new User({
        username : 'vicapow'
        , email : 'vicapow@gmail.com'
        , password : 'password'
      })
      user.save(function(err){
        if(err) throw err
        var link = new Link({
          title : 'test link name'
          , url : 'http://google.com'
          , tags : ['gundam','anime']
          , owner : user._id // the user
        })
        link.save(function(err){
          should.not.exist(err)
          should.exist(link)
          user.getLinks(['anime'], function(err,links){
            should.not.exist(err)
            should.exist(links)
            done()
          })
        })
      })
    })
  })
  after(function(done){
    mongoose.disconnect()
    done()
  })
})