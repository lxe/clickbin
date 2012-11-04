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
  describe('parent',function(){
    it('should allow the bin to set its parent', function( done ) {
      var parent = new Bin({name : 'parent'})
      parent.save( function(err) {
        should.not.exist(err)
        var child = new Bin({name : 'child'})
        child.parent = parent
        child.save(function(err){
          should.not.exist(err)
          should.exist(child.parent)
          done()
        })
      })
    })
  })
  describe('getByPath', function() {
    it('should get a bin path a path', function(done){
      Bin.getByPath('/parent', function(err,bin){
        should.not.exist(err)
        should.exist(bin)
        should.equal(bin.name,'parent')
        Bin.getByPath('/parent/child', function(err,bin){
          should.not.exist(err)
          should.exist(bin)
          should.equal(bin.name,'child')
          Bin.getByPath('/parent/child/', function(err,bin){
            should.not.exist(err)
            should.exist(bin)
            should.equal(bin.name,'child')
            Bin.getByPath('/parent/child/poop', function(err,bin){
              should.not.exist(err)
              should.not.exist(bin)
              done()
            })
          })
        })
      })
    })
  })
  describe('ensureExists', function(){
    it('should create a bin need in the `/parent` bin', function(done){
      Bin.ensureExists('/parent/child/teacher/conference', function(err,bin){
        if(err) throw err
        should.exist(bin)
        done()
      })
    })
  })
  after(function(done){
    mongoose.disconnect()
    done()
  })
})