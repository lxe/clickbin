var should = require('should')
  , scrapper = require('../controllers/scrapper')

describe('scrapper', function(){
  describe('get', function(){
    it('should get page data', function(done){
      scrapper.get('https://launchpad.37signals.com/basecamp', function(err,res){
        should.not.exist(err)
        done()
      })
    })
  })
})