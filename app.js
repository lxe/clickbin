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

/*
 * ============================================================================
 * Express app setup
 */
var app = module.exports = express();

app.configure(function() {
  /**
   * 
   */
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(require('connect-less')({
    src: __dirname + '/views',
    dst: __dirname + '/public',
    enable: ['less']
  }));

  /**
   * 
   */
  app.use(express.static(__dirname + '/public'));
  
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());

  /**
   * 
   */
  app.use(express.session({
    secret: 'whalecopter',
    maxAge: new Date(Date.now() + 3600000),
    store:  new MongoStore({ db: 'clickbin' })
  }));


  /**
   * [ description]
   * @param  {[type]}   req  [description]
   * @param  {[type]}   res  [description]
   * @param  {Function} next [description]
   * @return {[type]}        [description]
   */
  app.use(function(req, res, next) {

    // Flash 
    req.session.flash = req.session.flash || {};
    res.locals.flash  = req.session.flash;
    req.session.flash = {};

    next();
  });

  /**
   * 
   */
  app.use(app.router);
});

/**
 * [ description]
 * @return {[type]} [description]
 */
app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

/**
 * [ description]
 * @return {[type]} [description]
 */
app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes
require('./routes')(app);

/**
 * ============================================================================
 * [serverConfig description]
 * @type {Object}
 */
var serverConfig = { port: 3000 };
mongo.connect('mongodb://localhost/clickbin');
mongo.connection.on('open', function() {
  app.listen(serverConfig.port, function() {
    console.log("Express server listening on port %d in %s mode", 
      serverConfig.port, 
      app.settings.env);
  });
});