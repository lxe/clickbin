var fs = require('fs'),
  user = require('./user')

  module.exports = function(app) {

    app.get('/', function(req, res, next) {
      var host = req.get('Host').split('.').reverse()
      console.log(host)

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
          title: 'ClickBin',
          bodyId: 'landing'
        })
      } else {
        console.log('redirecting to the logged in users page')

        // redirect to the users bin
        var url = req.protocol + '://' 
          + req.session.user.username 
          + '.' + host[1] + '.' + host[0] + '/';

        console.log(url)
        return res.redirect(url)
      }
    })

    require('./login')(app)
    require('./logout')(app)
    require('./signup')(app)
    require('./link')(app)
    require('./bin')(app)
    require('./path')(app)
  }