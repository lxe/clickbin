var fs = require('fs')
  , user = require('./user')

module.exports = function(app) {
  
  require('./click')(app)
  require('./link')(app)
  require('./path-command')(app)
  
  app.get('/', function(req, res, next) {
    var host = req.get('Host').split('.').reverse()

    // if the request contains a subdomain use the `user` route
    if(req.subdomains.length !== 0) {
      return user(req, res, next, {
        username: req.subdomains[0],
        path: '/'
      })
    }

    // if the user is not logged in
    if(!req.session.user || !req.session.user.loggedIn) {

      // show the landing page
      return res.render('landing', {
        title: 'clickbin',
        bodyId: 'landing'
      })
    } else {
      // redirect to the users bin
      var url = req.protocol + '://' 
        + req.session.user.username 
        + '.' + host[1] + '.' + host[0] + '/';

      return res.redirect(url)
    }
  })

  require('./login')(app)
  require('./logout')(app)
  require('./signup')(app)
}