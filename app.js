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
  , flash = require('connect-flash')
  , config     = require('./config')

/*
 * ============================================================================
 * Express app setup
 */
var app = module.exports = express()

app.configure(function() {
  /**
   * 
   */
  app.set('views', __dirname + '/views')
  app.set('view engine', 'jade')
  app.use(require('connect-less')({
    src: __dirname + '/views',
    dst: __dirname + '/public',
    enable: ['less']
  }))

  /**
   * 
   */
  app.use(express.static(__dirname + '/public'))
  app.use(express.favicon(__dirname + '/public/images/favicon.ico'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.cookieParser())

  /**
   * 
   */
  app.use(express.session({
    secret: 'whalecopter',
    maxAge: new Date(Date.now() + 3600000),
    store:  new MongoStore({ db: 'clickbin' })
  }))
  app.use(flash())

  /**
   * 
   */
  app.use(app.router)
})

/**
 * [ description]
 * @return {[type]} [description]
 */
app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }))
})

/**
 * [ description]
 * @return {[type]} [description]
 */
app.configure('production', function() {
  app.use(express.errorHandler())
})

// Routes
require('./routes')(app)

/**
 * ============================================================================
 * [serverConfig description]
 * @type {Object}
 */
mongo.connect('mongodb://localhost/clickbin')
mongo.connection.on('open', function() {
  app.listen(config.server.port, function() {
    console.log("Express server listening on port %d in %s mode", 
      config.server.port, 
      app.settings.env)
  })
})
