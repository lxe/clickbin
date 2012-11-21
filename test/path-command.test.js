var should = require("should")
  , path_command = require('../controllers/path-command-parser')
// just an example...
describe('path-command', function(){
  describe('parse', function(done){
    it('should parse the uri into a path command object', function(done){
      var command = path_command('/tag1/tag2/gundam.com')
      should.equal(command.tags[0], 'tag1')
      should.equal(command.tags[1], 'tag2')
      should.equal(command.link.protocol, 'http://')
      should.equal(command.link.uri, 'gundam.com')
      
      command = path_command('/tag1/gundam.com')
      should.equal(command.tags[0], 'tag1')
      should.equal(command.link.protocol, 'http://')
      should.equal(command.link.uri, 'gundam.com')
      
      command = path_command('/')
      should.equal(command.tags.length, 0)
      
      command = path_command('/tag1/tag2')
      should.equal(command.tags.length, 2)
      
      command = path_command('/tag2/tag1/http://google.com')
      should.exist(command.redirect)
      should.equal(command.redirect,'/tag1/tag2/http://google.com')
      
      command = path_command('/daring%20fireball/regexp/url/http://daringfireball.net/2010/07/improved_regex_for_matching_urls')
      should.exist(command.tags)
      should.equal(command.tags.length, 3)
      should.equal(command.tags[0], 'daring fireball')
      should.equal(command.tags[1], 'regexp')
      should.equal(command.tags[2], 'url')
      
      ;(function(){
        command = path_command('/appl://google.com')
      }).should.throw()
      
      done()
    })
  })
})