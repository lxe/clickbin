/**
 * @file app.js
 *
 * Express js entry point.
 * 
 */
var _          = require('underscore')
  , async      = require('async')
  , express    = require('express')
  , MongoStore = require('connect-mongo')(express)
  , mongo      = require('mongoose')
  , less       = require('less')
  , config     = require('./config')

/*
 * ============================================================================
 * Express app setup
 */
var app = module.exports = express()

app.configure(function() {

  /**
   * Use the connect-less parser. 
   */
  app.set('views', __dirname + '/views')

  /**
   * Use the jade compiler. This one
   * converts all the jade files to css before serving
   * and places them into /public/stylehseets
   * directory. I'm sure it's got some sort of caching mechanism as well.
   */
  app.set('view engine', 'jade')
  app.use(require('connect-less')({
    src: __dirname + '/views',
    dst: __dirname + '/public',
    enable: ['less']
  }))

  /**
   * Set up static paths
   */
  app.use(express.static(__dirname + '/public'))
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'))

  /**
   * Pre-packaged miscellaneous middlewares
   */
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.cookieParser())

  /**
   * Store sessions in mongo
   */
  app.use(express.session({
    secret: 'whalecopter',
    maxAge: new Date(Date.now() + 3600000),
    store:  new MongoStore({ db: 'clickbin' })
  }))

  /**
   * Custom middleware
   */
  app.use(function(req, res, next) {

    /**
     * Custom "flash" middleware. Unlike the
     * original connect-flash 
     * (https://github.com/jaredhanson/connect-flash),
     * this one is simpler, and allows any sort
     * of objects, not just flat strings.
     */
    req.session.flash = req.session.flash || {}
    res.locals.flash  = req.session.flash
    req.session.flash = {}
    next()
  })

  /**
   * Router middleware
   */
  app.use(app.router)
})

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }))
})

app.configure('production', function() {
  app.use(express.errorHandler({
    dumpExceptions: false,
    showStack: false
  }))
})

// Routes
require('./routes')(app)

/**
 * ============================================================================
 * Go go go go!
 */
mongo.connect('mongodb://localhost/clickbin')
mongo.connection.on('open', function() {
  app.listen(config.server.port, function() {
    console.log("Express server listening on port %d in %s mode", 
      config.server.port, 
      app.settings.env)
  })
})
