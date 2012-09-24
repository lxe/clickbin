var should = require('should')
  , mongoose = require('mongoose')
  , Bin = require('./../models/bin')

describe('Bin', function(){
  before(function(done){
    mongoose.connect('localhost','clickbin',function(err){
      should.not.exist(err)
      Bin.collection.drop()
      done()
    })
  })
  describe('create', function(){
    it('should create a bin account', function(done){
      var bin = new Bin({name : 'test'})
      bin.save(function(err){
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