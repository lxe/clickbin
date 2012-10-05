
var fs = require('fs')

module.exports = function(app) {
  
  app.get('/', function(req, res) {
    return res.render('landing', {
      title: 'ClickBin'
    })
  })
  
  require('./link')(app)
  require('./bin')(app)
  require('./path')(app)
}
