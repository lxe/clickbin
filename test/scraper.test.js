var should = require('should')
  , scraper = require('../controllers/scraper')

describe('scraper', function(){
  describe('get', function(){
    it('should get page data', function(done){
      scraper.get('https://launchpad.37signals.com/basecamp', function(err,res){
        should.not.exist(err)
        done()
      })
    })
  })
})