var should = require('should')
  , mongoose = require('mongoose')
  , Heat = require('./../models/heat')
  , Bin = require('./../models/bin')

describe('Heat', function(){
  before(function(done){
    mongoose.connect('localhost','test',function(err){
      should.not.exist(err)
      Heat.collection.drop()
      Bin.collection.drop()
      done()
    })
  })
  describe('create', function(){
    it('should create a heat model', function(done){
      var bin = new Bin({
        name : 'test'
      })
      bin.save(function(err){
        should.not.exist(err)
        Heat.vote('some session', bin._id, 'http://test.com'
        , function(err,heat){
          should.not.exist(err)
          should.equal(heat.votes,1)
          Heat.vote('some session',bin._id, 'http://test.com'
          , function(err,heat){
            should.not.exist(err)
            should.equal(heat.votes,2)
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