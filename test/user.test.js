var should = require('should')
  , mongoose = require('mongoose')
  , User = require('./../models/user')

describe('User', function(){
  before(function(done){f
    mongoose.connect('localhost','test',function(err){
      should.not.exist(err)
      User.collection.drop(function(err){
        should.not.exist(err)
        done()
      })
    })
  })
  describe('create', function(){
    it('should create a user account', function(done){
      var user = new User({
        username : 'vicapow'
        , password : '123456'
        , email : 'vicapow@gmail.com'
      })
      user.save(function(err){
        should.not.exist(err)
        done()
      })
    })
  })
  after(function(done){
    mongoose.disconnect()
    done()
  })
})